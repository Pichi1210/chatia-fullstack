
import { useMemo } from 'react';
import axios from 'axios';
import useAuth from './useAuth';

export const useClient = () => {
    const { user } = useAuth();

    const client = useMemo(() => {
        const instance = axios.create({
            baseURL: import.meta.env.VITE_API_URL,
        });

        instance.interceptors.request.use((config) => {
            if (user?.access_token) {
                config.headers.Authorization = `Bearer ${user.access_token}`;
            }
            return config;
        });

        return instance;
    }, [user]);

    return client;
};
