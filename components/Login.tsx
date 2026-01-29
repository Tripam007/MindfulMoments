import React, { useState } from 'react';
// FIX: The User type is defined in `types.ts` and not exported from `authService.ts`.
import { login } from '../services/authService';
import type { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
}

const AtSymbolIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            const user = login(email);
            onLogin(user);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-2xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Mindful Moments
                    </h1>
                    <p className="mt-2 text-gray-400">Your personal space for reflection and growth.</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <AtSymbolIcon />
                        </div>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-md relative block w-full pl-10 pr-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Enter your email to begin"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In / Sign Up'}
                        </button>
                    </div>
                </form>
                <p className="mt-4 text-xs text-center text-gray-500">
                    We use your email to create a private, isolated space for your journal. We will never share your data.
                </p>
            </div>
             <div className="mt-8 text-center text-sm text-gray-500 max-w-md">
                <p className="font-bold">Disclaimer:</p>
                <p>This application is not a medical tool. It provides wellness insights and resource suggestions only. If you are in crisis, please contact a healthcare professional.</p>
            </div>
        </div>
    );
};

export default Login;