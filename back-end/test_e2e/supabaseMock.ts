// Mock for @supabase/supabase-js to avoid real uploads during E2E tests
import { jest } from '@jest/globals';

// Set dummy env vars for tests
process.env.SUPABASE_URL = 'http://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-key';

export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

// Mock state for controlling failures in tests
let failNextUpload = false;
let failNextRemove = false;

export const supabaseServiceMockConfig = {
    setFailNextUpload: (fail: boolean) => {
        failNextUpload = fail;
    },
    isFailNextUpload: () => failNextUpload,
    setFailNextRemove: (fail: boolean) => {
        failNextRemove = fail;
    },
    isFailNextRemove: () => failNextRemove
};

// Function to get current failure state
const getFailNextUpload = () => failNextUpload;
const setFailNextUpload = (value: boolean) => { failNextUpload = value; };
const getFailNextRemove = () => failNextRemove;
const setFailNextRemove = (value: boolean) => { failNextRemove = value; };

// Mock the @supabase/supabase-js module
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        storage: {
            from: jest.fn((bucket: string) => ({
                upload: jest.fn(async (filePath: string, fileBuffer: Buffer, options: any) => {
                    // Simulate upload failure if flag is set (for testing error branches)
                    if (getFailNextUpload()) {
                        setFailNextUpload(false); // Reset after use
                        return { data: null, error: { message: 'Simulated Supabase upload failure' } };
                    }
                    // Simulate successful upload
                    return { data: { path: filePath }, error: null };
                }),
                getPublicUrl: jest.fn((filePath: string) => ({
                    data: { publicUrl: `http://test.local/${filePath}` }
                })),
                remove: jest.fn(async (files: string[]) => {
                    // Simulate remove failure if flag is set (for testing error branches)
                    if (getFailNextRemove()) {
                        setFailNextRemove(false); // Reset after use
                        return { data: null, error: { message: 'Simulated Supabase remove failure' } };
                    }
                    // Simulate successful remove
                    return { data: null, error: null };
                })
            }))
        }
    }))
}));
