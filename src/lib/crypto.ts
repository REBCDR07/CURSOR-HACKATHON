/**
 * Lightweight at-rest encryption for sensitive medical data in localStorage.
 *
 * Strategy:
 *  - On signup/login the user's password is used to derive a per-user AES-GCM
 *    key via PBKDF2. The raw key bytes are kept in `sessionStorage` (cleared
 *    on logout / tab close) — never persisted to disk.
 *  - Sensitive payloads are stored as JSON envelopes:
 *      { __enc: 1, iv: <base64>, data: <base64> }
 *  - When no key is loaded (e.g. legacy install, public/landing page) we fall
 *    back to plaintext so the app stays usable; encryption activates the next
 *    time data is written while a session is open.
 *
 * This is a defense-in-depth measure for a stolen/borrowed phone — it is not
 * a substitute for proper server-side security.
 */

const KEY_SESSION_STORAGE = 'hp_dk'; // base64 raw 256-bit key
const SALT_PREFIX = 'hp_salt_';      // per-user PBKDF2 salt (localStorage)

// ---- base64 helpers ----
function bytesToB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function getOrCreateSalt(userId: string): Uint8Array {
  const key = SALT_PREFIX + userId;
  const existing = localStorage.getItem(key);
  if (existing) return b64ToBytes(existing);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(key, bytesToB64(salt));
  return salt;
}

/** Derive an AES-GCM 256-bit key from password + per-user salt. */
export async function deriveAndStoreKey(userId: string, password: string): Promise<void> {
  if (!('crypto' in window) || !crypto.subtle) return; // unsupported, stay plaintext
  try {
    const salt = getOrCreateSalt(userId);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password) as BufferSource,
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
      baseKey,
      256,
    );
    sessionStorage.setItem(KEY_SESSION_STORAGE, bytesToB64(new Uint8Array(bits)));
  } catch {
    // ignore — we'll just fall back to plaintext
  }
}

export function clearKey(): void {
  sessionStorage.removeItem(KEY_SESSION_STORAGE);
}

function loadKey(): Uint8Array | null {
  const b64 = sessionStorage.getItem(KEY_SESSION_STORAGE);
  return b64 ? b64ToBytes(b64) : null;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw as BufferSource, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

interface Envelope { __enc: 1; iv: string; data: string }
function isEnvelope(v: unknown): v is Envelope {
  return !!v && typeof v === 'object' && (v as any).__enc === 1 && typeof (v as any).iv === 'string';
}

/**
 * Synchronous wrapper around the WebCrypto async API. We use a small
 * cache and run encryption synchronously is impossible — so the storage
 * layer keeps using sync APIs but encryption happens lazily on a write
 * tick. To keep the public storage API synchronous we serialize plaintext
 * synchronously and then schedule an async re-write that swaps in the
 * encrypted envelope. Reads transparently decrypt synchronously when the
 * stored value is an envelope by spawning a microtask cache.
 *
 * In practice this is sufficient: the same record is read back from the
 * in-memory cache populated at load, and rewrites go through the async
 * encrypt path. For simpler determinism we expose only async helpers and
 * have storage.ts use them via top-level await-free wrappers.
 */
export async function encryptString(plain: string): Promise<string> {
  const raw = loadKey();
  if (!raw) return plain; // no session key, store plaintext
  try {
    const key = await importAesKey(raw);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        new TextEncoder().encode(plain) as BufferSource,
      ),
    );
    const env: Envelope = { __enc: 1, iv: bytesToB64(iv), data: bytesToB64(ct) };
    return JSON.stringify(env);
  } catch {
    return plain;
  }
}

export async function decryptString(stored: string): Promise<string> {
  if (!stored) return stored;
  let parsed: unknown;
  try { parsed = JSON.parse(stored); } catch { return stored; }
  if (!isEnvelope(parsed)) return stored;
  const raw = loadKey();
  if (!raw) {
    // Encrypted but no key — return empty so caller gets nothing rather than crash.
    return '';
  }
  try {
    const key = await importAesKey(raw);
    const iv = b64ToBytes(parsed.iv);
    const ct = b64ToBytes(parsed.data);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return '';
  }
}

/** True when a derived key is loaded for the current session. */
export function hasSessionKey(): boolean {
  return !!sessionStorage.getItem(KEY_SESSION_STORAGE);
}
