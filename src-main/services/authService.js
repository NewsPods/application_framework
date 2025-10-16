import { mockUsers } from '../utils/mockData';

class AuthService {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    async login(email, password) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const user = mockUsers.find(u => u.email === email && u.password === password);
        if (user) {
            const userData = { ...user, password: undefined };
            this.currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('authToken', 'mock-jwt-token-' + user.id);
            return { success: true, user: userData };
        }
        return { success: false, error: 'Invalid credentials' };
    }

    async signup(email, password, name) {
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser = {
            id: mockUsers.length + 1,
            email,
            name,
            subscription: 'free',
            preferences: {
                newspapers: [],
                sections: [],
                subtopics: []
            }
        };

        mockUsers.push({ ...newUser, password });
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        localStorage.setItem('authToken', 'mock-jwt-token-' + newUser.id);
        return { success: true, user: newUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser && !!localStorage.getItem('authToken');
    }
}

export default new AuthService();