/**
 * Backend Pre-warmer & Keep-Alive Service for Render-hosted backend.
 * 
 * Free-tier Render instances spin down after 15 minutes of inactivity.
 * This service proactively sends non-blocking lightweight pings upon app mount,
 * file selection, and periodic intervals (every 3 minutes) so the backend
 * is fully spun up and ready before the user clicks 'Fetch & Analyse'.
 */

const getApiBaseUrl = () => {
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    return rawApiUrl.trim().replace(/\/+$/, '');
};

let isWarming = false;
let isReady = false;
let keepAliveTimer = null;

export const warmBackend = async () => {
    if (isReady || isWarming) return;
    
    const API_BASE_URL = getApiBaseUrl();
    isWarming = true;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-store',
            signal: controller.signal
        }).catch(async () => {
            // Fallback to root endpoint if /health isn't mapped
            return await fetch(`${API_BASE_URL}/`, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-store'
            });
        });

        clearTimeout(timeoutId);

        if (response && response.ok) {
            isReady = true;
            console.log("⚡ Vidyut Backend instance is warm & ready on Render.");
        }
    } catch (e) {
        // Suppress warning - the ping alone will cause Render to begin spinning up
        console.log("⚡ Vidyut backend spin-up ping sent to Render.");
    } finally {
        isWarming = false;
    }
};

export const startKeepAlive = (intervalMs = 3 * 60 * 1000) => {
    // Initial immediate warm up
    warmBackend();

    if (!keepAliveTimer) {
        keepAliveTimer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                const API_BASE_URL = getApiBaseUrl();
                fetch(`${API_BASE_URL}/health`, { method: 'GET', mode: 'cors', cache: 'no-store' })
                    .catch(() => {});
            }
        }, intervalMs);
    }
};

export const stopKeepAlive = () => {
    if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
    }
};
