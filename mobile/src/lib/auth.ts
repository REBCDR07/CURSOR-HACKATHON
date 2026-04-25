import * as Crypto from 'expo-crypto';
import type { SessionData, UserAccount, UserRole } from '../types/domain';
import { generateId } from './ids';
import { readJSON, readString, removeKey, writeJSON, writeString } from './kv';

export const USERS_KEY = 'hp_users';
export const SESSION_KEY = 'hp_session';

async function hashPassword(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

function toSession(user: UserAccount): SessionData {
  return {
    userId: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    specialite: user.specialite,
  };
}

async function saveSession(user: UserAccount): Promise<void> {
  await writeString(SESSION_KEY, JSON.stringify(toSession(user)));
}

export async function getUsers(): Promise<UserAccount[]> {
  return readJSON<UserAccount[]>(USERS_KEY, []);
}

async function saveUsers(users: UserAccount[]): Promise<void> {
  await writeJSON(USERS_KEY, users);
}

export async function signupPatient(
  nom: string,
  prenom: string,
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' };
  }

  const user: UserAccount = {
    id: generateId(),
    role: 'patient',
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  await saveSession(user);
  return { success: true };
}

export async function signupDoctor(
  nom: string,
  prenom: string,
  email: string,
  password: string,
  specialite: string,
  numeroRPPS: string,
): Promise<{ success: boolean; error?: string }> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === normalized)) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' };
  }

  const user: UserAccount = {
    id: generateId(),
    role: 'medecin',
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    specialite: specialite.trim(),
    numeroRPPS: numeroRPPS.trim(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await saveUsers(users);
  await saveSession(user);
  return { success: true };
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; role?: UserRole; error?: string }> {
  const users = await getUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find((u) => u.email === normalized);

  if (!user) return { success: false, error: 'Aucun compte trouvé avec cet email.' };

  const hashed = await hashPassword(password);
  if (user.passwordHash !== hashed) {
    return { success: false, error: 'Mot de passe incorrect.' };
  }

  await saveSession(user);
  return { success: true, role: user.role };
}

export async function logout(): Promise<void> {
  await removeKey(SESSION_KEY);
}

export async function getSession(): Promise<SessionData | null> {
  const raw = await readString(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionData;
    if (!parsed.role) parsed.role = 'patient';
    return parsed;
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getSession()) !== null;
}
