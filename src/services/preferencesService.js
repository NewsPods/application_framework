// src/services/preferencesService.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class PreferencesService {
    async updatePreferences(preferences) {
        const token = localStorage.getItem('authToken');
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
                console.error('❌ Error saving preferences:', data);
                return { success: false, error: data.error || 'Failed to save preferences' };
            }

            // Update local cache if backend succeeds
            const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
            currentUser.preferences = preferences;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            console.log('✅ Preferences saved to backend:', data);
            return { success: true, preferences };
        } catch (err) {
            console.error('❌ Network/server error while saving preferences:', err);
            return { success: false, error: err.message };
        }
    }

    async getPreferences() {
        const token = localStorage.getItem('authToken');
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
            console.error('Error fetching preferences:', err);
            return { newspapers: [], sections: [], topics: [] };
        }
    }
}

export default new PreferencesService();
