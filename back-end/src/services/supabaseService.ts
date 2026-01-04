import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseFailedToUpload, SupabaseFailedToDelete } from '../errors/supabaseError';

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const NODE_ENV = process.env.NODE_ENV;

let supabase: SupabaseClient | null = null;

/**
 * Lazily initialize Supabase.
 * This prevents backend crash in test / test_ui / CI environments.
 */
function getSupabase(): SupabaseClient {
    if (supabase) return supabase;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        // Allow backend to start in tests / UI
        if (
            NODE_ENV === 'test' ||
            NODE_ENV === 'test_ui' ||
            NODE_ENV === 'ci'
        ) {
            throw new SupabaseFailedToUpload('Supabase disabled in test environment');
        }

        throw new Error(
            'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.'
        );
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
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

        const supabaseClient = getSupabase();

        const filePath = generateFilePath(file.originalname, directoryPath);

        const { error } = await supabaseClient.storage
            .from(supabaseBucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new SupabaseFailedToUpload(filePath);
        }

        const publicUrl = supabaseClient
            .storage
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

        const supabaseClient = getSupabase();

        const { error } = await supabaseClient.storage
            .from(supabaseBucket)
            .remove([filePath]);

        if (error) {
            throw new SupabaseFailedToDelete(filePath);
        }
    }
}

export const supabaseService = new SupabaseService();
