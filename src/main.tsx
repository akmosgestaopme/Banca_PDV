import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Debug para ambiente Electron
console.log('Environment:', {
  isElectron: !!(window as any).electronAPI,
  userAgent: navigator.userAgent,
  location: window.location.href
});

// Verificar se DOM está pronto
const initApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  console.log('Initializing React app...');
  
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app initialized successfully');
  } catch (error) {
    console.error('Error initializing React app:', error);
  }
};

// Aguardar DOM estar pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
