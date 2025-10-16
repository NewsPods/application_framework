class PreferencesService {
    async updatePreferences(userId, preferences) {
        await new Promise(resolve => setTimeout(resolve, 200));

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            currentUser.preferences = preferences;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        return { success: true, preferences };
    }

    async getPreferences(userId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        return currentUser?.preferences || {
            newspapers: [],
            sections: [],
            subtopics: []
        };
    }
}

export default new PreferencesService();