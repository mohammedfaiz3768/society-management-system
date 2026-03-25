"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    society_id: string | null;
    is_first_login?: boolean;
    flat_number?: string | null;
    block?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const PUBLIC_ROUTES = ['/login', '/register', '/verify-email', '/setup-society'];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const init = async () => {
            const savedToken = localStorage.getItem('admin_token');

            if (savedToken) {
                try {
                    // ✅ Verify token against server — get fresh user data
                    const res = await api.get('/auth/me');
                    setToken(savedToken);
                    setUser(res.data);
                } catch {
                    // ✅ Token expired or invalid — clear everything
                    localStorage.removeItem('admin_token');
                    localStorage.removeItem('admin_user');
                }
            }

            setIsLoading(false);
        };

        init();
    }, []);

    useEffect(() => {
        const isPublicRoute = pathname === '/' || PUBLIC_ROUTES.some(r => pathname.startsWith(r));

        // ✅ All public routes excluded from redirect
        if (!isLoading && !token && !isPublicRoute) {
            router.push('/login');
        }
    }, [isLoading, token, pathname, router]);

    const login = (newToken: string, newUser: User) => {
        // ✅ Only store token — never store user data in localStorage
        localStorage.setItem('admin_token', newToken);
        setToken(newToken);
        setUser(newUser);
        router.push('/dashboard');
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user'); // clean up old stored user if exists
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};