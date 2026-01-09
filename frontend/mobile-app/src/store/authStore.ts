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
        return await SecureStore.getItemAsync(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await SecureStore.setItemAsync(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
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
            login: (token, user) => set({
                token,
                user,
                userRole: user.role,
                societyId: user.societyId || null
            }),
            logout: () => {
                set({ token: null, user: null, userRole: null, societyId: null });
                // Optional: clear router or navigate to auth
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
