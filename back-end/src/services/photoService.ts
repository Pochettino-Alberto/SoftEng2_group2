import { v4 as uuidv4 } from "uuid";

/**
 * Represents a controller for managing users.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class PhotoService {
    
    /**
     * Simulates uploading a file to an external image service.
     * @param file - The file object from multer.
     * @returns The generated photo ID as a string.
     */
    async uploadFile(file: Express.Multer.File): Promise<string> {
        const photoId = uuidv4();
        console.log(`Uploaded file ${file.originalname}, assigned ID: ${photoId}`);
        // simulate async operation
        return Promise.resolve(photoId);
    }

    /**
     * Upload multiple files.
     * @param files - Array of multer file objects
     * @returns Array of photo IDs
     */
    async uploadFiles(files: Express.Multer.File[]): Promise<string[]> {
        // Map files to upload promises and await all
        const uploadPromises = files.map(file => this.uploadFile(file));
        const photoIds = await Promise.all(uploadPromises);
        return photoIds;
    }

}

export default PhotoService