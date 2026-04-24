/**
 * Transparent encryption-at-rest layer for a small set of sensitive keys.
 *
 * Design:
 *   - We intercept localStorage reads/writes for a fixed list of "sensitive"
 *     keys (medical profile, treatments, activity log).
 *   - At app boot we asynchronously load + decrypt each into a synchronous
 *     in-memory cache. After bootstrap, all reads serve from the cache and
 *     all writes update the cache and schedule an async re-encrypt + persist.
 *   - When no derived session key is available (logged out, legacy install),
 *     values pass through untouched so the app stays functional.
 *
 * Storage code keeps using `localStorage.getItem`/`setItem` directly — we
 * monkey-patch those two methods for the sensitive keys only.
 */
import { encryptString, decryptString, hasSessionKey } from './crypto';

const SENSITIVE_KEYS = new Set<string>([
  'hp_profiles_map',
  'hp_treatments_map',
  'hp_activity_log',
]);

const cache = new Map<string, string | null>();
let booted = false;
let pendingWrites: Promise<unknown> = Promise.resolve();

const realGetItem = Storage.prototype.getItem;
const realSetItem = Storage.prototype.setItem;
const realRemoveItem = Storage.prototype.removeItem;

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

/**
 * Load + decrypt all sensitive keys into the memory cache. Call this after
 * a successful login/signup once the session key is derived. Safe to call
 * multiple times.
 */
export async function bootstrapSecureStore(): Promise<void> {
  for (const key of SENSITIVE_KEYS) {
    const raw = realGetItem.call(localStorage, key);
    if (raw == null) {
      cache.set(key, null);
      continue;
    }
    // If encrypted envelope and we have a key, decrypt; otherwise pass through.
    let decoded = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.__enc === 1) {
        decoded = await decryptString(raw);
      }
    } catch {
      // not JSON envelope, leave as-is
    }
    cache.set(key, decoded);
  }
  booted = true;
}

/** Drop the in-memory cache (call on logout). */
export function resetSecureStore(): void {
  cache.clear();
  booted = false;
}

function schedulePersist(key: string, plain: string | null): void {
  pendingWrites = pendingWrites.then(async () => {
    if (plain == null) {
      realRemoveItem.call(localStorage, key);
      return;
    }
    if (hasSessionKey()) {
      const enc = await encryptString(plain);
      realSetItem.call(localStorage, key, enc);
    } else {
      realSetItem.call(localStorage, key, plain);
    }
  }).catch(() => { /* swallow */ });
}

/**
 * Install the localStorage interceptor. Idempotent.
 */
export function installSecureStore(): void {
  if ((Storage.prototype as any).__hpInstalled) return;
  (Storage.prototype as any).__hpInstalled = true;

  Storage.prototype.getItem = function (key: string) {
    if (this === localStorage && isSensitive(key)) {
      if (booted && cache.has(key)) return cache.get(key) ?? null;
      // Pre-bootstrap: try sync read; if encrypted, return null (caller will
      // re-render once bootstrap completes via storage event).
      const raw = realGetItem.call(this, key);
      if (raw == null) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.__enc === 1) return null;
      } catch { /* not envelope */ }
      return raw;
    }
    return realGetItem.call(this, key);
  };

  Storage.prototype.setItem = function (key: string, value: string) {
    if (this === localStorage && isSensitive(key)) {
      cache.set(key, value);
      schedulePersist(key, value);
      // Also notify listeners
      try { window.dispatchEvent(new Event('hp-secure-update')); } catch { /* noop */ }
      return;
    }
    return realSetItem.call(this, key, value);
  };

  Storage.prototype.removeItem = function (key: string) {
    if (this === localStorage && isSensitive(key)) {
      cache.set(key, null);
      schedulePersist(key, null);
      return;
    }
    return realRemoveItem.call(this, key);
  };
}

/** Wait for any pending async writes — useful before logout. */
export async function flushSecureWrites(): Promise<void> {
  await pendingWrites;
}
