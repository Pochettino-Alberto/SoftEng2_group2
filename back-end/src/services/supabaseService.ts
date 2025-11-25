import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as crypto from 'crypto';
import { SupabaseFailedToUpload, SupabaseFailedToDelete } from '../errors/supabaseError';

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rksihjpitwbqsydhlyeb.supabase.co';
// NOTE: Use the Service Role Key for server-side operations to bypass RLS
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_X0X76JcwyNPc6M9P25QB-g_AgZ2Sbxj';

// Initialize the Supabase Client
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Generates a unique file path for the Supabase storage bucket.
 * The path includes the report ID and a random string for uniqueness.
 * @param originalName - The original name of the file.
 * @param directoryPath - The ID of the folder in which to store the file.
 * @returns The unique file path string (e.g., 'myDirPath/123-abcdef123.jpg').
 */
const generateFilePath = (originalName: string, directoryPath: string): string => {
    const randomString = crypto.randomBytes(6).toString('hex');
    const fileExtension = path.extname(originalName);
    // remove unnecessary / at the end of the dir path
    directoryPath = directoryPath.endsWith('/') ? directoryPath.slice(0, -1) : directoryPath;
    // Path: {folder-id}/{random-hex}{ext}
    return `${directoryPath}/${randomString}${fileExtension}`; 
};

// Ensure the following buckets exist in Supabase
export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
};

class SupabaseService {

    /**
     * Uploads a single file buffer to Supabase Storage and returns its public URL.
     * @param directoryPath - The directory path (without file name) in which to store the file.
     * @param photoBuffer - The file buffer received from multer.
     * @param supabaseBucket - The supabase bucket where to upload the file.
     * @returns An Object with the public URL and filepath of the uploaded file.
     */
    async uploadFile(
        directoryPath: string,
        file: Express.Multer.File,
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string, filePath: string }> {

        const fileName = file.originalname;
        const filePath = generateFilePath(fileName, directoryPath);
        
        const { data, error } = await supabase.storage
            .from(supabaseBucket)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            // Translate Supabase errors into a custom error
            throw new SupabaseFailedToUpload(filePath);
        }

        const publicUrl = supabase.storage.from(supabaseBucket).getPublicUrl(filePath).data.publicUrl;
        
        return Promise.resolve({ publicUrl, filePath });
    }

    /**
     * Upload multiple files.
     * @param files - Array of multer file objects
     * @returns Array of photo IDs
     */
    async uploadFiles(
        directoryPath: string,
        files: Express.Multer.File[],
        supabaseBucket: SupabaseBucket
    ): Promise<{ publicUrl: string, filePath: string }[]> {
        // Map files to upload promises and await all
        const uploadPromises = files.map(file => this.uploadFile(directoryPath, file, supabaseBucket));
        const photoIds = await Promise.all(uploadPromises);
        return photoIds;
    }

    /**
     * Deletes a photo from Supabase Storage using its file path.
     * This is useful for cleanup (rollback) or general deletion.
     * @param filePath - The full path of the file in the bucket (e.g., '123/abcdef123.jpg').
     * @param supabaseBucket - The supabase bucket where to delete the file.
     */
    async deleteFile(filePath: string, supabaseBucket: SupabaseBucket): Promise<void> {
        if (!filePath) return;

        const { error } = await supabase.storage
            .from(supabaseBucket)
            .remove([filePath]);

        if (error) {
            throw new SupabaseFailedToDelete(filePath);
        }
    }
}

// Export a singleton instance
export const supabaseService = new SupabaseService();