import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useUIStore } from './store/uiStore';

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  useUIStore.getState().setInstallPrompt(e);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);