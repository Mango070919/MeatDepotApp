
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { AppConfig } from '../types';

let db: any = null;
let storage: any = null;
let app: any = null;

export const initFirebase = (config: AppConfig) => {
  if (!config.firebaseConfig || !config.firebaseConfig.apiKey || !config.firebaseConfig.projectId) {
      console.log("Firebase config missing.");
      return false;
  }
  
  if (!app) {
      try {
        app = initializeApp(config.firebaseConfig);
        db = getFirestore(app);
        
        // Enable Offline Persistence
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn("Firebase persistence failed: Multiple tabs open");
            } else if (err.code == 'unimplemented') {
                console.warn("Firebase persistence not supported by browser");
            }
        });

        storage = getStorage(app);
        console.log("Firebase Initialized Successfully");
        return true;
      } catch (e) {
        console.error("Firebase Initialization Error:", e);
        return false;
      }
  }
  return true;
};

export const saveStateToFirebase = async (data: any) => {
  if (!db) {
      console.warn("Firestore not initialized. Cannot save.");
      return;
  }

  try {
    const timestamp = new Date().toISOString();
    
    // Split data into separate documents to avoid the 1MB Firestore limit per document.
    // We use a collection named 'meat_depot_system' and specific document IDs.
    const collectionName = 'meat_depot_system';

    const batchPromises = [];

    // 1. Config
    if (data.config) {
        batchPromises.push(setDoc(doc(db, collectionName, 'config'), { ...data.config, _syncedAt: timestamp }));
    }

    // 2. Products
    if (data.products) {
        batchPromises.push(setDoc(doc(db, collectionName, 'products'), { items: data.products, _syncedAt: timestamp }));
    }

    // 3. Users
    if (data.users) {
        batchPromises.push(setDoc(doc(db, collectionName, 'users'), { items: data.users, _syncedAt: timestamp }));
    }

    // 4. Orders
    if (data.orders) {
        // Orders can grow large. Ideally, they should be a collection, but for sync compatibility with current architecture,
        // we'll try to save them as a list. If this fails, we catch it.
        batchPromises.push(setDoc(doc(db, collectionName, 'orders'), { items: data.orders, _syncedAt: timestamp }));
    }

    // 5. Posts & Promo Codes
    if (data.posts) {
        batchPromises.push(setDoc(doc(db, collectionName, 'posts'), { items: data.posts, _syncedAt: timestamp }));
    }
    if (data.promoCodes) {
        batchPromises.push(setDoc(doc(db, collectionName, 'promoCodes'), { items: data.promoCodes, _syncedAt: timestamp }));
    }

    // 6. Production Data
    if (data.rawMaterials) {
        batchPromises.push(setDoc(doc(db, collectionName, 'rawMaterials'), { items: data.rawMaterials, _syncedAt: timestamp }));
    }
    if (data.productionBatches) {
        batchPromises.push(setDoc(doc(db, collectionName, 'productionBatches'), { items: data.productionBatches, _syncedAt: timestamp }));
    }
    if (data.activityLogs) {
        batchPromises.push(setDoc(doc(db, collectionName, 'activityLogs'), { items: data.activityLogs, _syncedAt: timestamp }));
    }
    
    await Promise.all(batchPromises);
    console.log("State synced to Firebase successfully.");
    return true;

  } catch (e) {
    console.error("Firebase Save Error:", e);
    return false;
  }
};

export const loadStateFromFirebase = async () => {
    if (!db) return null;

    try {
        const collectionName = 'meat_depot_system';
        const docIds = ['config', 'products', 'users', 'orders', 'posts', 'promoCodes', 'rawMaterials', 'productionBatches', 'activityLogs'];
        
        const loadPromises = docIds.map(id => getDoc(doc(db, collectionName, id)));
        const snapshots = await Promise.all(loadPromises);
        
        const combinedState: any = {};
        let hasData = false;

        snapshots.forEach((snap, index) => {
            if (snap.exists()) {
                const data = snap.data();
                const key = docIds[index];
                
                if (key === 'config') {
                    combinedState.config = data;
                } else {
                    // For array types stored in 'items' field
                    if (data.items) {
                        combinedState[key] = data.items;
                    }
                }
                hasData = true;
            }
        });

        if (hasData) {
            console.log("State loaded from Firebase successfully.");
            return combinedState;
        }
    } catch (e: any) {
        if (e.code === 'unavailable') {
            console.warn("Firebase is offline. Using local state.");
        } else {
            console.error("Firebase Load Error:", e);
        }
    }
    return null;
};

export const uploadToFirebase = async (base64String: string, fileName: string): Promise<string | null> => {
    if (!storage) {
        console.warn("Firebase Storage not initialized.");
        return null;
    }
    try {
        const storageRef = ref(storage, 'uploads/' + fileName);
        await uploadString(storageRef, base64String, 'data_url');
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (e) {
        console.error("Firebase Upload Error:", e);
        return null;
    }
};

export const deleteFromFirebase = async (fileUrl: string) => {
    if (!storage) return;
    try {
        const storageRef = ref(storage, fileUrl);
        await deleteObject(storageRef);
    } catch (e) {
        console.error("Firebase Delete Error:", e);
    }
};
