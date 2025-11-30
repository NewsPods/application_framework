// src/services/storage.js
import { Store } from '@tauri-apps/plugin-store';

let store = null;

async function getStore() {
    if (!store) {
        store = await Store.load('settings.json', { /* you can pass options, e.g. autoSave: false */ });
    }
    return store;
}

const StorageService = {
    async set(key, value) {
        const s = await getStore();
        await s.set(key, value);
        await s.save();
    },
    async get(key) {
        const s = await getStore();
        const val = await s.get(key);
        return val;
    },
    async clear() {
        const s = await getStore();
        await s.clear();
        await s.save();
    }
};

export default StorageService;
