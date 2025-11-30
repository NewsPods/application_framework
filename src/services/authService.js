import Storage from './storage'; // 👈 Import new service

const API = import.meta.env.VITE_API_URL;

class AuthService {
    // NOTE: We can't load user/token in constructor anymore because it's async!

    _headers(token, json = true) {
        return {
            ...(json ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        };
    }

    async login(identifier, password) {
        const r = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const data = await r.json();

        if (r.ok && data.success) {
            // 👈 SAVE TO NATIVE STORE
            await Storage.set('authToken', data.token);
            await Storage.set('currentUser', data.user);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Login failed' };
    }

    async signup({ first_name, last_name, email, username, password }) {
        const r = await fetch(`${API}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email, username, password })
        });
        const data = await r.json();

        if (r.ok && data.success) {
            // 👈 SAVE TO NATIVE STORE
            await Storage.set('authToken', data.token);
            await Storage.set('currentUser', data.user);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Signup failed' };
    }

    async getCurrentUser() {
        const token = await Storage.get('authToken'); // 👈 ASYNC GET
        if (!token) return null;

        try {
            const r = await fetch(`${API}/auth/me`, { headers: this._headers(token, false) });
            const data = await r.json();
            return data.user || null;
        } catch {
            return null;
        }
    }

    async logout() {
        await Storage.clear(); // 👈 ASYNC CLEAR
    }

    // New helper to get token directly
    async getToken() {
        return await Storage.get('authToken');
    }
}

export default new AuthService();