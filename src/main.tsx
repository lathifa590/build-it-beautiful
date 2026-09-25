import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Auto-reload saat chunk lama tidak ditemukan setelah deploy versi baru (dengan anti-infinite-loop)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const lastReload = sessionStorage.getItem('vite-preload-reloaded');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 5000) {
    sessionStorage.setItem('vite-preload-reloaded', now.toString());
    window.location.reload();
  } else {
    console.error('Bypass infinite reload loop. Please clear browser cache (Ctrl+F5).');
  }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

