import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

import { User } from '../api/auth/auth.api';

type UserRole = 'resident' | 'guard' | 'admin' | null;

interface AuthState {
    token: string | null;
    user: User | null;
    userRole: UserRole;
    societyId: string | null;
    isLoading: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    loadUser: () => Promise<void>;
}

const secureStorage = {
    getItem: async (name: string): Promise<string | null> => {
        const value = await SecureStore.getItemAsync(name);
        console.log(`[AuthStore] getItem ${name}:`, value ? 'EXISTS' : 'NULL');
        return value;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        console.log(`[AuthStore] setItem ${name}`);
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        console.log(`[AuthStore] removeItem ${name}`);
        await SecureStore.deleteItemAsync(name);
    },
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            userRole: null,
            societyId: null,
            isLoading: false,
            login: (token, user) => {
                console.log('[AuthStore] LOGIN action called', user.role);
                set({
                    token,
                    user,
                    userRole: user.role,
                    societyId: (user as any).societyId || null
                });
            },
            logout: () => {
                console.log('[AuthStore] LOGOUT action called');
                set({ token: null, user: null, userRole: null, societyId: null });
                // Note: Navigation handled by _layout.tsx useEffect watching token changes
            },
            loadUser: async () => {
                // augment this if needed, but persist middleware handles hydration
                return Promise.resolve();
            },
        }),
        {
            name: 'sms-auth-storage',
            storage: createJSONStorage(() => secureStorage),
        }
    )
);
