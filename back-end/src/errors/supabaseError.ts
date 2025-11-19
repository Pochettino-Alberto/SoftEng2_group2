const FILE_NOT_FOUND = "The provided file does not exists on supabase"
const CANNOT_UPLOAD = "Cannot upload the provided file on supabase"
const CANNOT_DELETE = "Cannot delete the provided file on supabase"

/**
 * Represents an error that occurs when a file is not found on supabase.
 */
class SupabaseFileNotFound extends Error {
    customMessage: string
    customCode: number

    constructor(filename: string = "") {
        super()
        this.customMessage = `${filename}: ${FILE_NOT_FOUND}`
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a file cannot be uploaded on supabase.
 */
class SupabaseFailedToUpload extends Error {
    customMessage: string
    customCode: number

    constructor(filename: string = "") {
        super()
        this.customMessage = `${filename}: ${CANNOT_UPLOAD}`
        this.customCode = 503
    }
}

/**
 * Represents an error that occurs when a file cannot be deleted on supabase.
 */
class SupabaseFailedToDelete extends Error {
    customMessage: string
    customCode: number

    constructor(filename: string = "") {
        super()
        this.customMessage = `${filename}: ${CANNOT_DELETE}`
        this.customCode = 503
    }
}

export {SupabaseFileNotFound, SupabaseFailedToUpload, SupabaseFailedToDelete}