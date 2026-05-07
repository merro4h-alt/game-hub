import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (error) {
  console.error("Critical error during React mount:", error);
  // Optional: show a minimal fallback UI if root mounting fails
  document.body.innerHTML = `
    <div style="background: #0A0A0B; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="color: #4F46E5;">Trendifi</h1>
        <p>An error occurred while loading the application. Please refresh the page.</p>
        <button onclick="window.location.reload()" style="background: #4F46E5; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Refresh</button>
      </div>
    </div>
  `;
}
