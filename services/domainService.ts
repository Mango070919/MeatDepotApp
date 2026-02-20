
import { AppConfig } from "../types";

export const saveToDomain = async (data: any, config: AppConfig) => {
    if (!config.customDomain?.url) return false;
    try {
        const res = await fetch(`${config.customDomain.url}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.customDomain.apiKey
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            console.warn(`Domain sync failed with status: ${res.status} ${res.statusText}`);
            return false;
        }
        return true;
    } catch (e: any) {
        // "Failed to fetch" usually means network error or CORS
        if (e.message === 'Failed to fetch') {
            console.warn("Domain sync unreachable (Network/CORS).");
        } else {
            console.warn("Domain sync error:", e);
        }
        return false;
    }
}

export const loadFromDomain = async (config: AppConfig) => {
    if (!config.customDomain?.url) return null;
    try {
        // Add timestamp to prevent caching
        const res = await fetch(`${config.customDomain.url}/sync?_t=${Date.now()}`, {
            headers: { 'X-API-Key': config.customDomain.apiKey }
        });
        if (res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await res.json();
            } else {
                console.warn("Domain load received non-JSON response.");
            }
        } else {
             console.warn(`Domain load failed with status: ${res.status}`);
        }
    } catch (e: any) {
        if (e.message === 'Failed to fetch') {
            console.warn("Domain load unreachable (Network/CORS).");
        } else {
            console.warn("Failed to load from domain", e);
        }
    }
    return null;
}

export const uploadToDomain = async (base64String: string, fileName: string, config: AppConfig) => {
    if (!config.customDomain?.url) return null;
    try {
        const res = await fetch(`${config.customDomain.url}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': config.customDomain.apiKey
            },
            body: JSON.stringify({ image: base64String, name: fileName })
        });
        
        if (res.ok) {
            const data = await res.json();
            return data.url; 
        }
        console.warn(`Domain upload failed: ${res.status}`);
    } catch (e: any) {
        console.warn("Failed to upload to domain", e);
    }
    return null;
}
