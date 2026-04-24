import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installSecureStore, bootstrapSecureStore } from "./lib/secureStore";

// Install interceptor before any module reads localStorage.
installSecureStore();

// Bootstrap (decrypt sensitive keys into memory cache) before initial render.
// If no session key is available this is a no-op fast-path.
bootstrapSecureStore().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
