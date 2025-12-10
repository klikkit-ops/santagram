import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { getVideoStatus, createVideo } from '@/lib/heygen';

export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Session ID is required' },
                { status: 400 }
            );
        }

        // Get order by stripe session ID
        let { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_session_id', sessionId)
            .single();

        // If order not found in DB, check Stripe directly (webhook may not have fired)
        if (fetchError || !order) {
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId);

                if (session.payment_status === 'paid') {
                    // Create order from Stripe session data
                    const metadata = session.metadata || {};
                    const { data: newOrder, error: insertError } = await supabase
                        .from('orders')
                        .insert({
                            stripe_session_id: sessionId,
                            email: session.customer_email || '',
                            child_name: metadata.childName || 'Friend',
                            child_age: metadata.childAge ? parseInt(metadata.childAge) : null,
                            child_gender: metadata.childGender || '',
                            personalization: {
                                achievements: metadata.achievements || '',
                                interests: metadata.interests || '',
                                special_message: metadata.specialMessage || '',
                            },
                            message_type: metadata.messageType || 'christmas-morning',
                            status: 'paid',
                        })
                        .select()
                        .single();

                    if (!insertError && newOrder) {
                        order = newOrder;
                    } else {
                        // Try to fetch again in case it was created by another request
                        const { data: retryOrder } = await supabase
                            .from('orders')
                            .select('*')
                            .eq('stripe_session_id', sessionId)
                            .single();
                        if (retryOrder) {
                            order = retryOrder;
                        }
                    }
                }

                if (!order) {
                    return NextResponse.json({
                        status: session.payment_status === 'paid' ? 'paid' : 'pending',
                        child_name: session.metadata?.childName || 'Friend',
                    });
                }
            } catch {
                return NextResponse.json(
                    { error: 'Order not found' },
                    { status: 404 }
                );
            }
        }

        // If order is paid but video hasn't started generating, trigger it now
        if (order.status === 'paid' && !order.heygen_video_id) {
            try {
                const personalization = order.personalization || {};
                const videoResult = await createVideo({
                    childName: order.child_name,
                    childAge: order.child_age?.toString() || '',
                    childGender: order.child_gender || '',
                    achievements: personalization.achievements || '',
                    interests: personalization.interests || '',
                    specialMessage: personalization.special_message || '',
                    messageType: order.message_type || 'christmas-morning',
                });

                await supabase
                    .from('orders')
                    .update({
                        heygen_video_id: videoResult.video_id,
                        status: 'generating',
                    })
                    .eq('id', order.id);

                return NextResponse.json({
                    status: 'generating',
                    child_name: order.child_name,
                });
            } catch (heygenError) {
                console.error('HeyGen error:', heygenError);
                // Continue to return current status if HeyGen fails
            }
        }

        // If we already have the video URL, return it
        if (order.video_url && order.status === 'completed') {
            return NextResponse.json({
                status: 'completed',
                video_url: order.video_url,
                child_name: order.child_name,
            });
        }

        // If no HeyGen video ID yet, video hasn't started generating
        if (!order.heygen_video_id) {
            return NextResponse.json({
                status: order.status || 'pending',
                child_name: order.child_name,
            });
        }

        // Check HeyGen status
        const videoStatus = await getVideoStatus(order.heygen_video_id);

        // Update order if video is complete
        if (videoStatus.status === 'completed' && videoStatus.video_url) {
            await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    video_url: videoStatus.video_url,
                })
                .eq('id', order.id);

            return NextResponse.json({
                status: 'completed',
                video_url: videoStatus.video_url,
                child_name: order.child_name,
            });
        }

        if (videoStatus.status === 'failed') {
            await supabase
                .from('orders')
                .update({ status: 'failed' })
                .eq('id', order.id);

            return NextResponse.json({
                status: 'failed',
                error: videoStatus.error,
                child_name: order.child_name,
            });
        }

        return NextResponse.json({
            status: videoStatus.status,
            child_name: order.child_name,
        });
    } catch (error) {
        console.error('Video status error:', error);
        return NextResponse.json(
            { error: 'Failed to get video status' },
            { status: 500 }
        );
    }
}
