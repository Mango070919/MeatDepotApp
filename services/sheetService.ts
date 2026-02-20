
import { AppConfig } from "../types";

export const extractSheetId = (url: string) => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

/**
 * Loads the application state from the 'System_State' tab of the Google Sheet.
 */
export const loadStateFromSheet = async (sheetId: string) => {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=System_State&select=A`;
    const res = await fetch(url);
    const text = await res.text();
    
    const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const json = JSON.parse(jsonString);
    
    if (json.table && json.table.rows.length > 0) {
        let fullJsonString = '';
        json.table.rows.forEach((row: any) => {
            if (row.c && row.c[0] && row.c[0].v) {
                fullJsonString += row.c[0].v;
            }
        });

        if (fullJsonString) {
            console.log("State loaded from Sheet successfully.");
            return JSON.parse(fullJsonString);
        }
    }
  } catch (error) {
    console.warn("Could not load state from Google Sheet.", error);
  }
  return null;
};

/**
 * Saves the application state to the 'System_State' tab.
 */
export const saveStateToSheet = async (sheetId: string, data: any, accessToken: string) => {
    try {
        const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
        
        const metaRes = await fetch(baseUrl, {
             headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (metaRes.status === 401) {
            throw new Error("token_expired");
        }

        if (!metaRes.ok) {
            const errText = await metaRes.text();
            throw new Error(`Sheet Metadata Access Failed (${metaRes.status}): ${errText}`);
        }

        const meta = await metaRes.json();
        if (!meta.sheets) throw new Error("Invalid Sheet metadata response.");
        
        let sheetIdNum = 0;
        const sheetExists = meta.sheets.some((s: any) => {
            if (s.properties.title === 'System_State') {
                sheetIdNum = s.properties.sheetId;
                return true;
            }
            return false;
        });
        
        if (!sheetExists) {
            const addSheetRes = await fetch(`${baseUrl}:batchUpdate`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{ addSheet: { properties: { title: 'System_State' } } }]
                })
            });
            if (addSheetRes.status === 401) throw new Error("token_expired");
            if (!addSheetRes.ok) throw new Error("Failed to create System_State sheet.");
        }
        
        const fullString = JSON.stringify(data);
        const chunkSize = 40000;
        const chunks = [];
        for (let i = 0; i < fullString.length; i += chunkSize) {
            chunks.push([fullString.slice(i, i + chunkSize)]);
        }

        const clearRes = await fetch(`${baseUrl}/values/System_State!A:A:clear`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (clearRes.status === 401) throw new Error("token_expired");
        
        const updateRes = await fetch(`${baseUrl}/values/System_State!A1:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ values: chunks })
        });
        
        if (updateRes.status === 401) throw new Error("token_expired");
        if(!updateRes.ok) throw new Error("Failed to append data to Sheet.");
        
        return true;
    } catch (e: any) {
        if (e.message !== 'token_expired') {
            console.error("Save to Sheet failed", e);
        }
        throw e;
    }
};
