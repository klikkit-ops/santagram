import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || '';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.warn('Missing Cloudflare R2 credentials. R2 storage operations will fail.');
}

// Create S3-compatible client for R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});

/**
 * Upload a file to Cloudflare R2
 * @param key - The object key (path) in R2
 * @param buffer - The file buffer to upload
 * @param contentType - MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
    key: string,
    buffer: Buffer,
    contentType: string
): Promise<string> {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        throw new Error('Cloudflare R2 credentials are not configured');
    }

    try {
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: contentType,
        });

        await r2Client.send(command);

        // Return public URL
        const publicUrl = getPublicUrl(key);
        console.log(`File uploaded to R2: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        console.error('Error uploading to R2:', error);
        throw new Error(`Failed to upload to R2: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Download a file from Cloudflare R2
 * @param key - The object key (path) in R2
 * @returns Buffer containing the file data
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        throw new Error('Cloudflare R2 credentials are not configured');
    }

    try {
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
        });

        const response = await r2Client.send(command);
        
        if (!response.Body) {
            throw new Error('No body in R2 response');
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);
        return buffer;
    } catch (error) {
        console.error('Error downloading from R2:', error);
        throw new Error(`Failed to download from R2: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Get the public URL for an R2 object
 * @param key - The object key (path) in R2
 * @returns Public URL
 */
export function getPublicUrl(key: string): string {
    if (R2_PUBLIC_URL) {
        // Remove trailing slash if present
        const baseUrl = R2_PUBLIC_URL.replace(/\/$/, '');
        // Remove leading slash from key if present
        const cleanKey = key.startsWith('/') ? key.slice(1) : key;
        return `${baseUrl}/${cleanKey}`;
    }

    // Fallback: construct URL from account ID and bucket name
    if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
        const cleanKey = key.startsWith('/') ? key.slice(1) : key;
        return `https://pub-${R2_ACCOUNT_ID}.r2.dev/${R2_BUCKET_NAME}/${cleanKey}`;
    }

    throw new Error('R2 public URL not configured');
}

