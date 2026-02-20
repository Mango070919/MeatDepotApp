
import { AppConfig } from "../types";

const BACKUP_FILENAME = 'meat_depot_app_data.json';

/**
 * Uploads an image to Google Drive as a file.
 * Returns a thumbnail link for use in the app.
 */
export const uploadToDrive = async (base64String: string, fileName: string, config: AppConfig): Promise<string | null> => {
  if (!config.googleDrive?.accessToken || !config.googleDrive?.folderId) return null;

  try {
      const boundary = 'meat_depot_image_boundary';
      const delimiter = `--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      // Extract raw base64 data
      const contentType = base64String.split(';')[0].split(':')[1];
      const base64Data = base64String.split(',')[1];

      const metadata = {
        name: fileName,
        mimeType: contentType,
        parents: [config.googleDrive.folderId]
      };

      const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          '\r\n' +
          delimiter +
          'Content-Type: ' + contentType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n' +
          base64Data +
          close_delim;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ 
          'Authorization': 'Bearer ' + config.googleDrive.accessToken,
          'Content-Type': 'multipart/related; boundary=' + boundary
      }),
      body: multipartRequestBody
    });
    
    if (res.status === 401) {
        console.warn("Drive Upload 401: Token expired");
        return null;
    }

    if (!res.ok) {
        const errText = await res.text();
        console.error("Drive API Error:", errText);
        return null;
    }

    const data = await res.json();
    if (data.id) {
        // sz=w1000 provides a high-quality preview.
        return `https://drive.google.com/thumbnail?id=${data.id}&sz=w1000`;
    }
    return null;
  } catch (e) {
    console.error("Drive Upload Failed", e);
    return null;
  }
};

export const deleteFromDrive = async (fileUrl: string, config: AppConfig) => {
    if (!config.googleDrive?.accessToken) return;
    
    const idMatch = fileUrl.match(/id=([^&]+)/);
    if (!idMatch) return;
    const fileId = idMatch[1];
    
    try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: new Headers({ 'Authorization': 'Bearer ' + config.googleDrive.accessToken })
        });
    } catch (e) {
        console.error("Drive Delete Failed", e);
    }
};

/**
 * Saves the entire application JSON state to a backup file in Drive.
 * This function acts as the primary synchronization mechanism. 
 * It ensures that whenever a user is created or updated in the app state,
 * the change is reflected in the Drive file (BACKUP_FILENAME).
 */
export const saveAppStateToDrive = async (data: any, config: AppConfig, createCheckpoint = false) => {
  if (!config.googleDrive?.accessToken || !config.googleDrive?.folderId) return;

  try {
    let fileIdToUpdate = null;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = createCheckpoint ? `meat_depot_checkpoint_${timestamp}.json` : BACKUP_FILENAME;

    // If not a checkpoint, check if main file exists to update it (Bi-directional sync anchor)
    if (!createCheckpoint) {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and '${config.googleDrive.folderId}' in parents and trashed=false&fields=files(id)`;
        const searchRes = await fetch(searchUrl, {
          headers: { 'Authorization': 'Bearer ' + config.googleDrive.accessToken }
        });
        
        if (searchRes.status === 401) {
            throw new Error('token_expired');
        }

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            if (searchData.files?.[0]) {
                fileIdToUpdate = searchData.files[0].id;
            }
        }
    }
    
    const fileContent = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    
    let res;

    if (fileIdToUpdate) {
      // PATCH existing file (Update Sync)
      res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileIdToUpdate}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Authorization': 'Bearer ' + config.googleDrive.accessToken },
        body: fileContent
      });
    } else {
      // POST new file (Initial Create)
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        parents: [config.googleDrive.folderId]
      };
      
      const boundary = 'meat_depot_app_boundary';
      const delimiter = `--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          '\r\n' +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(data) +
          close_delim;

      res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 
            'Authorization': 'Bearer ' + config.googleDrive.accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: multipartRequestBody
      });
    }

    if (res.status === 401) {
        throw new Error('token_expired');
    }

    if (!res.ok) {
        throw new Error(`Drive Save Failed: ${res.status} ${res.statusText}`);
    }

    console.log(`App state synced to Drive (${filename})`);
  } catch (e: any) {
    if (e.message === 'token_expired') {
        throw e; // Re-throw for store to handle
    }
    console.error("Save to Drive failed", e);
  }
};

export const loadAppStateFromDrive = async (config: AppConfig) => {
    if (!config.googleDrive?.accessToken || !config.googleDrive?.folderId) return null;

    try {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and '${config.googleDrive.folderId}' in parents and trashed=false&fields=files(id)`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'Authorization': 'Bearer ' + config.googleDrive.accessToken }
        });
        
        if (searchRes.status === 401) throw new Error('token_expired');
        if (!searchRes.ok) return null;

        const searchData = await searchRes.json();
        const existingFile = searchData.files?.[0];

        if (existingFile) {
            return await loadBackup(existingFile.id, config);
        }
    } catch (e: any) {
        if (e.message === 'token_expired') throw e;
        console.error("Load from Drive failed", e);
    }
    return null;
};

export interface DriveFile {
    id: string;
    name: string;
    createdTime: string;
}

export const listBackups = async (config: AppConfig): Promise<DriveFile[]> => {
    if (!config.googleDrive?.accessToken || !config.googleDrive?.folderId) return [];
    
    try {
        // List files starting with meat_depot_checkpoint_ or the main file
        const q = `(name contains 'meat_depot_checkpoint_' or name = '${BACKUP_FILENAME}') and '${config.googleDrive.folderId}' in parents and trashed=false`;
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,createdTime)&orderBy=createdTime desc`;
        
        const res = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + config.googleDrive.accessToken }
        });
        
        if (res.status === 401) throw new Error('token_expired');

        if (res.ok) {
            const data = await res.json();
            return data.files || [];
        }
    } catch (e: any) {
        if (e.message === 'token_expired') {
            console.warn("Drive list skipped: Token expired");
            return [];
        }
        console.error("Failed to list backups", e);
    }
    return [];
};

export const loadBackup = async (fileId: string, config: AppConfig) => {
    if (!config.googleDrive?.accessToken) return null;
    try {
        const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': 'Bearer ' + config.googleDrive.accessToken }
        });
        
        if (fileRes.status === 401) throw new Error('token_expired');

        if (fileRes.ok) {
            return await fileRes.json();
        }
    } catch (e: any) {
        if (e.message === 'token_expired') throw e;
        console.error("Failed to load specific backup", e);
    }
    return null;
};
