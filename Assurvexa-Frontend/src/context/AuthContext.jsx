import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const authVersion = useRef(0);

    useEffect(() => {
        const interceptorId = api.interceptors.response.use(
            response => response,
            error => {
                if (
                    error.response?.status === 401 &&
                    !error.config?.skipAuthState
                ) {
                    setUser(null);
                }

                return Promise.reject(error);
            }
        );

        const bootstrapVersion = authVersion.current;

        api.get('/me', { skipAuthState: true })
            .then(({ data }) => {
                if (authVersion.current === bootstrapVersion) {
                    setUser(data.user);
                }
            })
            .catch(() => {
                if (authVersion.current === bootstrapVersion) {
                    setUser(null);
                }
            })
            .finally(() => setIsLoading(false));

        return () => api.interceptors.response.eject(interceptorId);
    }, []);

    const value = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        async login(credentials) {
            authVersion.current += 1;
            const { data } = await api.post('/login', credentials, {
                skipAuthState: true,
            });
            setUser(data.user);
            return data.user;
        },
        async logout() {
            authVersion.current += 1;
            try {
                await api.post('/logout');
            } finally {
                setUser(null);
            }
        },
    }), [isLoading, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
