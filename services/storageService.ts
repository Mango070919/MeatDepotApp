
import { AppConfig } from "../types";
import { uploadToDrive, deleteFromDrive } from "./googleDriveService";
import { uploadToDomain } from "./domainService";
import { uploadToFirebase, deleteFromFirebase } from "./firebaseService";

/**
 * Unified file upload handler.
 * Uploads to Google Drive, Firebase, or Custom Domain based on config.
 */
export const uploadFile = async (base64: string, name: string, config: AppConfig): Promise<string | null> => {
    if (config.backupMethod === 'FIREBASE') {
        const url = await uploadToFirebase(base64, name);
        // Fallback to base64 if upload fails to keep local functionality
        return url || base64;
    }
    
    if (config.backupMethod === 'CUSTOM_DOMAIN') {
        const url = await uploadToDomain(base64, name, config);
        return url || base64; 
    }
    
    // Default to Google Drive
    return uploadToDrive(base64, name, config);
}

/**
 * Unified file delete handler.
 */
export const deleteFile = async (url: string, config: AppConfig) => {
    if (config.backupMethod === 'FIREBASE') {
        return deleteFromFirebase(url);
    }
    if (config.backupMethod === 'CUSTOM_DOMAIN') {
        // Domain delete logic could be added here if the API supports it.
        return; 
    }
    return deleteFromDrive(url, config);
}
