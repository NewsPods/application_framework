import Storage from './storage'; // 👈 Import
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class PreferencesService {
    async updatePreferences(preferences) {
        const token = await Storage.get('authToken'); // 👈 Async
        if (!token) {
            console.warn('⚠️ No auth token found, skipping backend call');
            return { success: false, error: 'Not authenticated' };
        }

        try {
            const res = await fetch(`${API}/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(preferences)
            });

            const data = await res.json();
            if (!res.ok) {
                return { success: false, error: data.error || 'Failed to save preferences' };
            }

            // Update local cache
            const currentUser = (await Storage.get('currentUser')) || {}; // 👈 Async
            currentUser.preferences = preferences;
            await Storage.set('currentUser', currentUser); // 👈 Async

            return { success: true, preferences };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }

    async getPreferences() {
        const token = await Storage.get('authToken'); // 👈 Async
        if (!token) return { newspapers: [], sections: [], topics: [] };

        try {
            const res = await fetch(`${API}/preferences`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.preferences || { newspapers: [], sections: [], topics: [] };
            }
            return { newspapers: [], sections: [], topics: [] };
        } catch (err) {
            return { newspapers: [], sections: [], topics: [] };
        }
    }
}

export default new PreferencesService();