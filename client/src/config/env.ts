function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

const rawApi = import.meta.env.VITE_API_URL?.trim() ?? "";

/** Origine du backend (sans chemin), vide en dev si tout passe par le proxy `/api` */
export const apiOrigin = rawApi ? trimTrailingSlash(rawApi) : "";

/** Base axios : `/api` en dev (proxy), ou `{VITE_API_URL}/api` en prod */
export const API_BASE_URL = apiOrigin ? `${apiOrigin}/api` : "/api";

/**
 * URL publique du front (liens, partages). `VITE_APP_URL` en prod, sinon `window.location.origin`.
 */
export function resolveAppUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
