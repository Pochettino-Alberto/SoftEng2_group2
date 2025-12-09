// Simple supabaseService mock to avoid real uploads during E2E tests
export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

// Mock state for controlling failures in tests
let failNextUpload = false

export const supabaseServiceMockConfig = {
    setFailNextUpload: (fail: boolean) => {
        failNextUpload = fail
    },
    isFailNextUpload: () => failNextUpload
}

// Simple supabaseService mock to avoid real uploads during E2E tests

export const supabaseService = {
    uploadFiles: async (directoryPath: string, files: Express.Multer.File[], bucket: any) => {
        // Simulate upload failure if flag is set (for testing error branches)
        if (failNextUpload) {
            failNextUpload = false // Reset after use
            throw new Error('Simulated Supabase upload failure')
        }
        // return fake public URLs and file paths
        return files.map((f, i) => ({ publicUrl: `http://test.local/${directoryPath}/file${i}.jpg`, filePath: `${directoryPath}/file${i}.jpg` }))
    },
    deleteFile: async (filePath: string, bucket: any) => {
        return Promise.resolve()
    }
}
