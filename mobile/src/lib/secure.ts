import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';

const MASTER_KEY_ALIAS = 'hp_master_key_v1';
const MASTER_KEY_FALLBACK_ALIAS = `${MASTER_KEY_ALIAS}_fallback`;

const SENSITIVE_KEYS = new Set<string>([
  'hp_users',
  'hp_session',
  'hp_profiles_map',
  'hp_treatments_map',
  'hp_access_requests',
  'hp_activity_log',
  'hp_pending_actions',
  'hp_qr_shares',
  'hp_family',
  'hp_active_family',
  'hp_profile',
  'hp_treatments',
]);

interface Envelope {
  __enc: 1;
  nonce: number[];
  cipher: number[];
}

interface SecureStoreCompat {
  getItemAsync?: (key: string) => Promise<string | null>;
  setItemAsync?: (
    key: string,
    value: string,
    options?: SecureStore.SecureStoreOptions,
  ) => Promise<void>;
}

let cachedKey: Uint8Array | null = null;
let secureStoreUnavailable = Platform.OS === 'web';

const secureStoreCompat = SecureStore as SecureStoreCompat;

function isEnvelope(value: unknown): value is Envelope {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Envelope>;
  return item.__enc === 1 && Array.isArray(item.nonce) && Array.isArray(item.cipher);
}

function parseSerializedKey(serialized: string | null): Uint8Array | null {
  if (!serialized) return null;

  try {
    const parsed = JSON.parse(serialized) as unknown;
    if (!Array.isArray(parsed)) return null;

    const isValidByteArray =
      parsed.length === nacl.secretbox.keyLength &&
      parsed.every((item) => Number.isInteger(item) && item >= 0 && item <= 255);

    if (!isValidByteArray) return null;

    return Uint8Array.from(parsed as number[]);
  } catch {
    return null;
  }
}

async function readKeyFromSecureStore(): Promise<string | null> {
  if (secureStoreUnavailable) return null;

  if (typeof secureStoreCompat.getItemAsync !== 'function') {
    secureStoreUnavailable = true;
    return null;
  }

  try {
    return await secureStoreCompat.getItemAsync(MASTER_KEY_ALIAS);
  } catch {
    secureStoreUnavailable = true;
    return null;
  }
}

async function writeKeyToSecureStore(serialized: string): Promise<boolean> {
  if (secureStoreUnavailable) return false;

  if (typeof secureStoreCompat.setItemAsync !== 'function') {
    secureStoreUnavailable = true;
    return false;
  }

  try {
    await secureStoreCompat.setItemAsync(MASTER_KEY_ALIAS, serialized, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch {
    secureStoreUnavailable = true;
    return false;
  }
}

async function readKeyFromFallbackStorage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(MASTER_KEY_FALLBACK_ALIAS);
  } catch {
    return null;
  }
}

async function writeKeyToFallbackStorage(serialized: string): Promise<void> {
  try {
    await AsyncStorage.setItem(MASTER_KEY_FALLBACK_ALIAS, serialized);
  } catch {
    // Ignore: auth flow will still work for current runtime via cachedKey.
  }
}

async function getOrCreateMasterKey(): Promise<Uint8Array> {
  if (cachedKey) return cachedKey;

  const secureStoreValue = await readKeyFromSecureStore();
  const fallbackValue = secureStoreValue ? null : await readKeyFromFallbackStorage();

  const existingKey = parseSerializedKey(secureStoreValue ?? fallbackValue);
  if (existingKey) {
    cachedKey = existingKey;

    if (!secureStoreValue && !secureStoreUnavailable) {
      await writeKeyToSecureStore(JSON.stringify(Array.from(existingKey)));
    }

    return existingKey;
  }

  const generated = Crypto.getRandomBytes(nacl.secretbox.keyLength);
  const serialized = JSON.stringify(Array.from(generated));

  const storedInSecureStore = await writeKeyToSecureStore(serialized);
  if (!storedInSecureStore) {
    await writeKeyToFallbackStorage(serialized);
  }

  cachedKey = generated;
  return generated;
}

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key);
}

export function looksEncrypted(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isEnvelope(parsed);
  } catch {
    return false;
  }
}

export async function encryptPlaintext(plain: string): Promise<string> {
  try {
    const key = await getOrCreateMasterKey();
    const nonce = Crypto.getRandomBytes(nacl.secretbox.nonceLength);
    const message = new TextEncoder().encode(plain);
    const cipher = nacl.secretbox(message, nonce, key);
    const envelope: Envelope = {
      __enc: 1,
      nonce: Array.from(nonce),
      cipher: Array.from(cipher),
    };
    return JSON.stringify(envelope);
  } catch {
    // Keep app functional if secure primitives fail on a specific web runtime.
    return plain;
  }
}

export async function decryptToPlaintext(stored: string): Promise<string | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return stored;
  }

  if (!isEnvelope(parsed)) return stored;

  let key: Uint8Array;
  try {
    key = await getOrCreateMasterKey();
  } catch {
    return null;
  }

  const opened = nacl.secretbox.open(Uint8Array.from(parsed.cipher), Uint8Array.from(parsed.nonce), key);
  if (!opened) return null;
  return new TextDecoder().decode(opened);
}
