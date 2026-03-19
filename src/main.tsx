import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const PREVIEW_CACHE_RESET_KEY = "lovable-preview-cache-reset";
const isLovablePreview = window.location.hostname.includes("preview--");

async function resetPreviewPwaCache() {
  if (!isLovablePreview) return true;

  const registrations = "serviceWorker" in navigator
    ? await navigator.serviceWorker.getRegistrations()
    : [];

  await Promise.all(registrations.map((registration) => registration.unregister()));

  const cacheKeys = "caches" in window ? await caches.keys() : [];
  await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));

  const hadCachedPreview = registrations.length > 0 || cacheKeys.length > 0;
  const alreadyReloaded = sessionStorage.getItem(PREVIEW_CACHE_RESET_KEY) === "1";

  if (hadCachedPreview && !alreadyReloaded) {
    sessionStorage.setItem(PREVIEW_CACHE_RESET_KEY, "1");
    window.location.reload();
    return false;
  }

  sessionStorage.removeItem(PREVIEW_CACHE_RESET_KEY);
  return true;
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator && !isLovablePreview) {
    try {
      await navigator.serviceWorker.register("/sw.js");
    } catch (e) {
      console.warn("SW registration failed:", e);
    }
  }
}

async function bootstrap() {
  const shouldRender = await resetPreviewPwaCache();
  if (!shouldRender) return;

  createRoot(document.getElementById("root")!).render(<App />);
  registerServiceWorker();
}

void bootstrap();
