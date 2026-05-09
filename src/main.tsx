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
} catch (error: any) {
  console.error("Critical error during React mount:", error);
  document.body.innerHTML = `
    <div style="background: #0A0A0B; color: white; height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif; text-align: center; padding: 20px;">
      <div>
        <h1 style="color: #4F46E5; margin-bottom: 10px;">Trendifi</h1>
        <p style="opacity: 0.8;">An error occurred while loading the application.</p>
        <div style="background: rgba(255,0,0,0.1); color: #ff5555; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; font-size: 12px; max-width: 400px; word-break: break-all;">
          ${error?.message || "Unknown error"}
        </div>
        <button onclick="window.location.reload()" style="background: #4F46E5; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Refresh Page</button>
      </div>
    </div>
  `;
}
