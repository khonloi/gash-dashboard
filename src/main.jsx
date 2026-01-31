import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { mockUser } from './mock/mockData'
import reportWebVitals from './reportWebVitals';

// Demo Mode Initialization
const isDemoMode = import.meta.env.VITE_APP_USE_MOCK === 'true';
console.log("[GASH] Demo Mode Detection:", isDemoMode);

const initApp = async () => {
    if (isDemoMode) {
        try {
            const { setupMocks } = await import('./mock/setupMocks');
            setupMocks();

            // Ensure a clean session for Demo Mode
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            // Check if we need to hydrate the demo user
            // We check for !storedToken OR if the stored user ID doesn't match the mock user ID
            // This handles the case where a real user might have been logged in previously
            if (!storedToken || !storedUser || (JSON.parse(storedUser)._id !== mockUser._id)) {
                console.log("[GASH Demo] Initializing fresh demo session...");
                localStorage.clear();
                localStorage.setItem('token', 'demo-token-12345');
                localStorage.setItem('user', JSON.stringify(mockUser));
                localStorage.setItem('loginTime', Date.now().toString());
            }
        } catch (error) {
            console.error("[GASH] Failed to load mock setup:", error);
        }
    }

    ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    )
};

initApp();;

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to a analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
