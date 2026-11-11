import axios from 'axios';

const configuredBaseURL = import.meta.env.VITE_BACKEND_URL;
const backendURL = new URL(
    configuredBaseURL || 'http://localhost:8000/api',
    window.location.origin
);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (
    localHosts.has(window.location.hostname) &&
    localHosts.has(backendURL.hostname)
) {
    backendURL.hostname = window.location.hostname;
}

const api = axios.create({
    baseURL: backendURL.toString(),
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    }
});

export default api;