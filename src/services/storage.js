import { Store } from '@tauri-apps/plugin-store';

// Initialize the store file
const store = new Store('settings.json');

const StorageService = {
    // Save a value
    async set(key, value) {
        await store.set(key, value);
        await store.save(); // Crucial: Flushes to disk
    },

    // Get a value
    async get(key) {
        return await store.get(key);
    },

    // Remove a value
    async remove(key) {
        await store.delete(key);
        await store.save();
    },

    // Clear all (for logout)
    async clear() {
        await store.clear();
        await store.save();
    }
};

export default StorageService;