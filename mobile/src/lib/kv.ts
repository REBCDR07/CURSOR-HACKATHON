import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  decryptToPlaintext,
  encryptPlaintext,
  isSensitiveKey,
  looksEncrypted,
} from './secure';

async function readPlainString(key: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  if (!isSensitiveKey(key)) return raw;

  const plain = await decryptToPlaintext(raw);
  if (plain === null) {
    // Corrupted or undecipherable payload: drop it to unblock future writes.
    await AsyncStorage.removeItem(key);
    return null;
  }

  // Legacy migration path: auto-encrypt old plaintext payloads.
  if (!looksEncrypted(raw)) {
    try {
      const encrypted = await encryptPlaintext(plain);
      await AsyncStorage.setItem(key, encrypted);
    } catch {
      // Keep plaintext value if encryption is temporarily unavailable.
      await AsyncStorage.setItem(key, plain);
    }
  }

  return plain;
}

async function writePlainString(key: string, value: string): Promise<void> {
  if (!isSensitiveKey(key)) {
    await AsyncStorage.setItem(key, value);
    return;
  }

  try {
    const encrypted = await encryptPlaintext(value);
    await AsyncStorage.setItem(key, encrypted);
  } catch {
    // Last-resort fallback so auth/session flows remain functional.
    await AsyncStorage.setItem(key, value);
  }
}

export async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const plain = await readPlainString(key);
    if (!plain) return fallback;
    return JSON.parse(plain) as T;
  } catch {
    return fallback;
  }
}

export async function writeJSON<T>(key: string, value: T): Promise<void> {
  await writePlainString(key, JSON.stringify(value));
}

export async function readString(key: string): Promise<string | null> {
  return readPlainString(key);
}

export async function writeString(key: string, value: string): Promise<void> {
  await writePlainString(key, value);
}

export async function removeKey(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
