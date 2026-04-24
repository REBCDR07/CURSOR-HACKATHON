import { deriveAndStoreKey, clearKey } from './crypto';
import { bootstrapSecureStore, resetSecureStore, flushSecureWrites } from './secureStore';

export type UserRole = 'patient' | 'medecin';

export interface UserAccount {
  id: string;
  role: UserRole;
  nom: string;
  prenom: string;
  email: string;
  passwordHash: string;
  // Doctor-only fields
  specialite?: string;
  numeroRPPS?: string;
  createdAt: string;
}

export interface SessionData {
  userId: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  specialite?: string;
}

const USERS_KEY = 'hp_users';
const SESSION_KEY = 'hp_session';

export function getUsers(): UserAccount[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: UserAccount[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Simple hash for demo (NOT production-grade)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function makeId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function setSession(user: UserAccount) {
  const session: SessionData = {
    userId: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    specialite: user.specialite,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function signup(nom: string, prenom: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' };
  }
  const user: UserAccount = {
    id: makeId(),
    role: 'patient',
    nom,
    prenom,
    email: email.toLowerCase(),
    passwordHash: simpleHash(password),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setSession(user);
  await deriveAndStoreKey(user.id, password);
  await bootstrapSecureStore();
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
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' };
  }
  const user: UserAccount = {
    id: makeId(),
    role: 'medecin',
    nom,
    prenom,
    email: email.toLowerCase(),
    passwordHash: simpleHash(password),
    specialite,
    numeroRPPS,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  setSession(user);
  await deriveAndStoreKey(user.id, password);
  await bootstrapSecureStore();
  return { success: true };
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> {
  const users = getUsers();
  const user = users.find(u => u.email === email.toLowerCase());
  if (!user) return { success: false, error: 'Aucun compte trouvé avec cet email.' };
  if (user.passwordHash !== simpleHash(password)) return { success: false, error: 'Mot de passe incorrect.' };
  setSession(user);
  await deriveAndStoreKey(user.id, password);
  await bootstrapSecureStore();
  return { success: true, role: user.role };
}

export async function logout(): Promise<void> {
  await flushSecureWrites();
  localStorage.removeItem(SESSION_KEY);
  clearKey();
  resetSecureStore();
}

export function getSession(): SessionData | null {
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  const s = JSON.parse(data);
  // Backwards compatibility with sessions created before role field existed
  if (!s.role) s.role = 'patient';
  return s;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function isDoctor(): boolean {
  return getSession()?.role === 'medecin';
}

export function isPatient(): boolean {
  return getSession()?.role === 'patient';
}
