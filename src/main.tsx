import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import { initAppAutoUpdater } from './utils/appUpdater';
import { hydratePhoneStorage } from './utils/phoneStorage';

// Initialize automatic cross-device app updater (Service Worker + /version.json + Firestore release signal)
initAppAutoUpdater();

// Hydrate & lock phone default storage (IndexedDB + Persistent Storage) before/during startup
void hydratePhoneStorage();

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
