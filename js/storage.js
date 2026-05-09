/* ==========================================
   js/storage.js — Unified persistence layer
   French Helper
   
   Backend: IndexedDB (primary for PWA/browser)
   Future: Capacitor Filesystem (for Play Store native app)
   
   Object stores:
     'audio'  — Google TTS MP3 blobs, keyed by normalized text
     'backup' — auto-backup JSON snapshots
   =========================================== */

const DB_NAME = 'french-helper-storage';
const DB_VERSION = 1;
const STORE_AUDIO = 'audio';
const STORE_BACKUP = 'backup';

let _db = null;

function openDB() {
    if (_db) return Promise.resolve(_db);
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_AUDIO)) {
                db.createObjectStore(STORE_AUDIO);
            }
            if (!db.objectStoreNames.contains(STORE_BACKUP)) {
                db.createObjectStore(STORE_BACKUP);
            }
        };
        
        request.onsuccess = (event) => {
            _db = event.target.result;
            resolve(_db);
        };
        
        request.onerror = (event) => {
            console.error('IndexedDB open error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/* ===== AUDIO BLOB STORAGE ===== */

/**
 * Store a TTS audio blob keyed by normalized phrase text.
 */
async function storeAudio(normalizedText, blob) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        store.put(blob, normalizedText);
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('storeAudio failed:', normalizedText, err);
        return false;
    }
}

/**
 * Retrieve a cached TTS audio blob.
 * Returns null if not found.
 */
async function getAudio(normalizedText) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_AUDIO, 'readonly');
            const store = tx.objectStore(STORE_AUDIO);
            const request = store.get(normalizedText);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('getAudio failed:', normalizedText, err);
        return null;
    }
}

/**
 * Delete audio entries for a list of normalized keys.
 * Call when a homework set is deleted.
 */
async function deleteAudioForKeys(normalizedKeys) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_AUDIO, 'readwrite');
        const store = tx.objectStore(STORE_AUDIO);
        normalizedKeys.forEach(key => store.delete(key));
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('deleteAudioForKeys failed:', err);
        return false;
    }
}

/**
 * Check if we have cached audio for a given phrase.
 */
async function hasAudio(normalizedText) {
    const blob = await getAudio(normalizedText);
    return blob !== null;
}

/* ===== BACKUP SNAPSHOTS ===== */

/**
 * Store a full backup snapshot in IndexedDB.
 */
async function storeBackup(backupData) {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_BACKUP, 'readwrite');
        const store = tx.objectStore(STORE_BACKUP);
        store.put({ data: backupData, timestamp: Date.now() }, 'latest');
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('storeBackup failed:', err);
        return false;
    }
}

/**
 * Retrieve the most recent backup snapshot.
 */
async function getBackup() {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_BACKUP, 'readonly');
            const store = tx.objectStore(STORE_BACKUP);
            const request = store.get('latest');
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        return null;
    }
}

/* ===== UTILITY: Auto-backup (IndexedDB only, no download) ===== */

/**
 * Store a snapshot of all app data in IndexedDB only.
 * Called on every data change. No file download — fast and silent.
 */
function autoBackup() {
    if (typeof state === 'undefined') return;
    const data = {
        history: state.history,
        cache: state.cache,
        customIcons: state.customIcons,
        customPhotos: state.customPhotos,
        homeworkNotes: state.homeworkNotes || {},
        wins: state.wins,
        losses: state.losses,
        speechSpeed: state.speechSpeed,
        appVersion: 'French Phrases Helper',
        backupDate: new Date().toISOString()
    };
    storeBackup(data);
}

/* ===== UTILITY: Export backup as downloadable file ===== */

/**
 * Build a full JSON backup and trigger a file download.
 * Used for explicit user action (Share/Backup All Data button).
 */
function exportBackupToFile() {
    // Gather all data from state (must be called after state is available)
    if (typeof state === 'undefined') return;
    
    const data = {
        history: state.history,
        cache: state.cache,
        customIcons: state.customIcons,
        customPhotos: state.customPhotos,
        homeworkNotes: state.homeworkNotes || {},
        wins: state.wins,
        losses: state.losses,
        speechSpeed: state.speechSpeed,
        appVersion: 'French Phrases Helper',
        backupDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Date-stamped filename: one file per day, avoids (1)(2)(3) pile-up
    const today = new Date().toISOString().split('T')[0];
    const filename = 'french-helper-backup-' + today + '.json';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    // Also store in IndexedDB
    storeBackup(data);
}

/* ===== UTILITY: Detect Capacitor environment ===== */

function isNativeApp() {
    try {
        return !!(window.Capacitor && window.Capacitor.isNativePlatform());
    } catch (e) {
        return false;
    }
}

/* ===== Expose to global scope ===== */
window.StorageDB = {
    storeAudio,
    getAudio,
    deleteAudioForKeys,
    hasAudio,
    storeBackup,
    getBackup,
    autoBackup,
    exportBackupToFile,
    isNativeApp
};
