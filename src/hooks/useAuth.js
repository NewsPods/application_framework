import authService from '../services/authService';

export const useAuth = () => ({
    login: authService.login.bind(authService),
    signup: authService.signup.bind(authService),
    logout: authService.logout.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService),
});