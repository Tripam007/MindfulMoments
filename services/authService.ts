
import type { User } from '../types';

const USER_KEY = 'mindful_moments_user';

export const signUp = (email: string): User => {
    const newUser: User = {
        id: `user_${Date.now()}`,
        email,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return newUser;
};

export const login = (email: string): User => {
    // In a real app, you'd verify password. Here, we'll just create a user if they don't exist.
    let user = getCurrentUser();
    if (user && user.email === email) {
        return user;
    }
    return signUp(email);
};

export const logout = (): void => {
    localStorage.removeItem(USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) {
        return null;
    }
    try {
        return JSON.parse(userJson) as User;
    } catch (e) {
        return null;
    }
};
