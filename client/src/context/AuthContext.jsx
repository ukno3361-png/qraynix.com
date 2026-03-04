/**
 * client/src/context/AuthContext.jsx
 * Auth context — provides current user state and auth actions.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as authApi } from '../api.js';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const data = await authApi.me();
            setUser(data.user);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { checkAuth(); }, [checkAuth]);

    const logout = async () => {
        await authApi.logout();
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshAuth: checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}
