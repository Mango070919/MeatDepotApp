
import { AppConfig } from "../types";
import { uploadToFirebase, deleteFromFirebase } from "./firebaseService";

/**
 * Unified file upload handler.
 * Tries Vercel Blob first, falls back to Firebase.
 */
export const uploadFile = async (base64: string, name: string, config: AppConfig): Promise<string | null> => {
    // 1. Try Vercel Blob (via our own API)
    try {
        // Convert base64 to Blob
        const response = await fetch(base64);
        const blob = await response.blob();
        
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(name)}`, {
            method: 'POST',
            body: blob
        });
        
        if (uploadRes.ok) {
            const result = await uploadRes.json();
            if (result.url) return result.url;
        }
    } catch (e) {
        console.warn("Vercel Blob upload failed/skipped, falling back to Firebase", e);
    }

    // 2. Fallback to Firebase
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
