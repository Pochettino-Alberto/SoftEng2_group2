import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseFailedToUpload, SupabaseFailedToDelete } from '../errors/supabaseError';

/**
 * IMPORTANT:
 * Supabase MUST be optional in test / CI / UI environments.
 * We lazily initialize the client and never throw at import-time.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        throw new SupabaseFailedToUpload(
            'Supabase disabled in test environment: Cannot upload the provided file on supabase'
        );
    }

    if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    }

    return supabase;
}

/**
 * Generates a unique file path for the Supabase storage bucket.
 */
const generateFilePath = (originalName: string, directoryPath: string): string => {
    const randomString = crypto.randomBytes(6).toString('hex');
    const fileExtension = path.extname(originalName);
    directoryPath = directoryPath.endsWith('/') ? directoryPath.slice(0, -1) : directoryPath;
    return `${directoryPath}/${randomString}${fileExtension}`;
};

export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

class SupabaseService {

    async uploadFile(
        directoryPath: string,
        file: Express.Multer.File,
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string; filePath: string }> {

        const filePath = generateFilePath(file.originalname, directoryPath);
        const client = getSupabase();

        const { error } = await client.storage
            .from(supabaseBucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new SupabaseFailedToUpload(filePath);
        }

        const publicUrl = client.storage
            .from(supabaseBucket)
            .getPublicUrl(filePath).data.publicUrl;

        return { publicUrl, filePath };
    }

    async uploadFiles(
        directoryPath: string,
        files: Express.Multer.File[],
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string; filePath: string }[]> {
        return Promise.all(
            files.map(file => this.uploadFile(directoryPath, file, supabaseBucket))
        );
    }

    async deleteFile(filePath: string, supabaseBucket: SupabaseBucket): Promise<void> {
        if (!filePath) return;

        const client = getSupabase();
        const { error } = await client.storage
            .from(supabaseBucket)
            .remove([filePath]);

        if (error) {
            throw new SupabaseFailedToDelete(filePath);
        }
    }
}

export const supabaseService = new SupabaseService();
