import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseFailedToUpload, SupabaseFailedToDelete } from '../errors/supabaseError';

// --- Environment detection ---
const NODE_ENV = process.env.NODE_ENV;

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// UI tests must NEVER fail uploads
const isUITest = NODE_ENV === 'test_ui';

// Initialize Supabase client only if usable
let supabase: SupabaseClient | null = null;

if (!isUITest && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// --- Helpers ---
const generateFilePath = (originalName: string, directoryPath: string): string => {
    const randomString = crypto.randomBytes(6).toString('hex');
    const fileExtension = path.extname(originalName);
    directoryPath = directoryPath.endsWith('/') ? directoryPath.slice(0, -1) : directoryPath;
    return `${directoryPath}/${randomString}${fileExtension}`;
};

// Buckets
export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

class SupabaseService {

    async uploadFile(
        directoryPath: string,
        file: Express.Multer.File,
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string; filePath: string }> {

        // ✅ UI TEST MODE: ALWAYS SUCCEED
        if (isUITest) {
            const fakePath = generateFilePath(file.originalname, directoryPath);
            return {
                filePath: fakePath,
                publicUrl: `http://localhost:3001/fake-supabase/${fakePath}`
            };
        }

        if (!supabase) {
            throw new SupabaseFailedToUpload('Supabase not configured');
        }

        const filePath = generateFilePath(file.originalname, directoryPath);

        const { error } = await supabase.storage
            .from(supabaseBucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw new SupabaseFailedToUpload(filePath);
        }

        const publicUrl =
            supabase.storage.from(supabaseBucket).getPublicUrl(filePath).data.publicUrl;

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
        if (!filePath || isUITest) return;

        if (!supabase) return;

        const { error } = await supabase.storage
            .from(supabaseBucket)
            .remove([filePath]);

        if (error) {
            throw new SupabaseFailedToDelete(filePath);
        }
    }
}

export const supabaseService = new SupabaseService();
