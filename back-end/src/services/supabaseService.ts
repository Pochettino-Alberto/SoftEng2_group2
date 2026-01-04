import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseFailedToUpload, SupabaseFailedToDelete } from '../errors/supabaseError';

// --- Environment ---
const NODE_ENV = process.env.NODE_ENV;

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

/**
 * We support 3 behaviors:
 *
 * - test / test_e2e / ci → Supabase DISABLED (explicit failure)
 * - test_ui              → Supabase FAKE success (UI must proceed)
 * - production           → Real Supabase
 */

// ----------------------
// Fake Supabase (UI TEST)
// ----------------------
const fakeUploadSuccess = (directoryPath: string, originalName: string) => {
    const randomString = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(originalName) || '.jpg';
    const cleanDir = directoryPath.endsWith('/')
        ? directoryPath.slice(0, -1)
        : directoryPath;

    const filePath = `${cleanDir}/${randomString}${ext}`;

    return {
        publicUrl: `http://fake-supabase.local/${filePath}`,
        filePath
    };
};

// ----------------------
// Disabled Supabase (TEST)
// ----------------------
const isSupabaseDisabled =
    NODE_ENV === 'test' ||
    NODE_ENV === 'test_e2e' ||
    NODE_ENV === 'ci';

// ----------------------
// Fake Supabase (UI)
// ----------------------
const isSupabaseFake =
    NODE_ENV === 'test_ui';

// ----------------------
// Real Supabase
// ----------------------
let supabase: SupabaseClient | null = null;

if (!isSupabaseDisabled && !isSupabaseFake) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        throw new Error(
            'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
        );
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ----------------------
// Buckets
// ----------------------
export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

class SupabaseService {

    async uploadFile(
        directoryPath: string,
        file: Express.Multer.File,
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string; filePath: string }> {

        // ❌ Hard failure for unit / integration / e2e
        if (isSupabaseDisabled) {
            throw new SupabaseFailedToUpload(
                'Supabase disabled in test environment: Cannot upload the provided file on supabase'
            );
        }

        // ✅ Fake success for UI tests
        if (isSupabaseFake) {
            return fakeUploadSuccess(directoryPath, file.originalname);
        }

        // ✅ Real Supabase upload
        const randomString = crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname);
        const cleanDir = directoryPath.endsWith('/')
            ? directoryPath.slice(0, -1)
            : directoryPath;

        const filePath = `${cleanDir}/${randomString}${ext}`;

        const { error } = await supabase!.storage
            .from(supabaseBucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new SupabaseFailedToUpload(filePath);
        }

        const publicUrl =
            supabase!.storage
                .from(supabaseBucket)
                .getPublicUrl(filePath)
                .data.publicUrl;

        return { publicUrl, filePath };
    }

    async uploadFiles(
        directoryPath: string,
        files: Express.Multer.File[],
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string; filePath: string }[]> {
        const uploads = files.map(file =>
            this.uploadFile(directoryPath, file, supabaseBucket)
        );
        return Promise.all(uploads);
    }

    async deleteFile(
        filePath: string,
        supabaseBucket: SupabaseBucket
    ): Promise<void> {

        if (!filePath) return;

        // No-op in test environments
        if (isSupabaseDisabled || isSupabaseFake) {
            return;
        }

        const { error } = await supabase!.storage
            .from(supabaseBucket)
            .remove([filePath]);

        if (error) {
            throw new SupabaseFailedToDelete(filePath);
        }
    }
}

// Singleton
export const supabaseService = new SupabaseService();
