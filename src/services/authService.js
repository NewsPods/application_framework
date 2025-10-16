// src/services/authService.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class AuthService {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.token = localStorage.getItem('authToken') || null;
    }

    _headers(json = true) {
        return {
            ...(json ? { 'Content-Type': 'application/json' } : {}),
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
        };
    }

    async login(identifier, password) {
        const r = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({ identifier, password })
        });
        const data = await r.json();
        if (r.ok && data.success) {
            this.currentUser = data.user;
            this.token = data.token;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Login failed' };
    }

    async signup({ first_name, last_name, email, username, password }) {
        const r = await fetch(`${API}/auth/signup`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify({ first_name, last_name, email, username, password })
        });
        const data = await r.json();
        if (r.ok && data.success) {
            this.currentUser = data.user;
            this.token = data.token;
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            localStorage.setItem('authToken', data.token);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Signup failed' };
    }

    async getCurrentUser() {
        if (!this.token) return null;
        const r = await fetch(`${API}/auth/me`, { headers: this._headers(false) });
        const data = await r.json();
        return data.user || null;
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    }

    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }
}

export default new AuthService();
