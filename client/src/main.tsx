import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker (vite-plugin-pwa)
if ('serviceWorker' in navigator) {
  // use the plugin's helper which provides update hooks
  try {
    // dynamic import of the virtual helper
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    import('virtual:pwa-register').then(({ registerSW }) => {
      const updateSW = registerSW({
        onRegistered() {
          // service worker registered
        },
        onNeedRefresh() {
          // You may prompt the user to refresh
          // console.info('New content available, please refresh.');
        },
        onOfflineReady() {
          // console.info('App ready to work offline.');
        }
      });
    });
  } catch (err) {
    // console.warn('Service worker registration failed', err);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
