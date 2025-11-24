// Simple supabaseService mock to avoid real uploads during E2E tests
export enum SupabaseBucket {
    REPORT_PHOTOS_BUCKET = 'reports'
}

// Simple supabaseService mock to avoid real uploads during E2E tests

export const supabaseService = {
    uploadFiles: async (directoryPath: string, files: Express.Multer.File[], bucket: any) => {
        // return fake public URLs and file paths
        return files.map((f, i) => ({ publicUrl: `http://test.local/${directoryPath}/file${i}.jpg`, filePath: `${directoryPath}/file${i}.jpg` }))
    },
    deleteFile: async (filePath: string, bucket: any) => {
        return Promise.resolve()
    }
}
