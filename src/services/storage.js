// src/services/storage.js
import { Store } from '@tauri-apps/plugin-store';

// Robust check: are we running inside Tauri?
const isTauri =
    typeof window !== 'undefined' &&
    !!window.__TAURI_INTERNALS__;

let storePromise = null;

async function getStore() {
    if (!storePromise) {
        // Use the newer async load API
        storePromise = Store.load('settings.json');
    }
    return storePromise;
}

const StorageService = {
    // Save a value
    async set(key, value) {
        if (isTauri) {
            const s = await getStore();
            await s.set(key, value);
            await s.save();
        } else {
            // Web fallback
            localStorage.setItem(key, JSON.stringify(value));
        }
    },

    // Get a value
    async get(key) {
        if (isTauri) {
            const s = await getStore();
            return await s.get(key);
        } else {
            const val = localStorage.getItem(key);
            try {
                return val ? JSON.parse(val) : null;
            } catch (e) {
                return null;
            }
        }
    },

    // Remove a single key
    async remove(key) {
        if (isTauri) {
            const s = await getStore();
            await s.delete(key);
            await s.save();
        } else {
            localStorage.removeItem(key);
        }
    },

    // Clear all (logout, reset, etc.)
    async clear() {
        if (isTauri) {
            const s = await getStore();
            await s.clear();
            await s.save();
        } else {
            localStorage.clear();
        }
    }
};

export default StorageService;
