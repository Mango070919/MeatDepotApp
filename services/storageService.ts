
import { AppConfig } from "../types";
import { uploadToFirebase, deleteFromFirebase } from "./firebaseService";

/**
 * Unified file upload handler.
 * Uploads to Firebase.
 */
export const uploadFile = async (base64: string, name: string, config: AppConfig): Promise<string | null> => {
    const url = await uploadToFirebase(base64, name);
    // Fallback to base64 if upload fails to keep local functionality
    return url || base64;
}

/**
 * Unified file delete handler.
 */
export const deleteFile = async (url: string, config: AppConfig) => {
    return deleteFromFirebase(url);
}
