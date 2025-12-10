import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create the client if we have the required env vars (allows build without env vars)
export const supabase: SupabaseClient = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as unknown as SupabaseClient;

// Database types
export interface Order {
    id: string;
    stripe_session_id: string;
    email: string;
    child_name: string;
    child_age: number | null;
    child_gender: string;
    personalization: {
        achievements?: string;
        interests?: string;
        special_message?: string;
    };
    message_type: string;
    status: 'pending' | 'paid' | 'generating' | 'completed' | 'failed';
    heygen_video_id: string | null;
    video_url: string | null;
    created_at: string;
    updated_at: string;
}
