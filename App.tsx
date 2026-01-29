import React, { useState, useEffect } from 'react';
// FIX: The User type is defined in `types.ts` and not exported from `authService.ts`.
import { getCurrentUser } from './services/authService';
import type { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
    }, []);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <div className="text-xl text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            {user ? <Dashboard user={user} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
        </div>
    );
};

export default App;