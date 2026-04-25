export type UserRole = 'patient' | 'medecin';

export interface UserAccount {
  id: string;
  role: UserRole;
  nom: string;
  prenom: string;
  email: string;
  passwordHash: string;
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

export interface Vaccin {
  nom: string;
  date: string;
  rappel: string;
}

export interface PatientProfile {
  id: string;
  pseudo: string;
  age: number | null;
  sexe: 'M' | 'F' | '';
  groupeSanguin: string;
  allergies: string[];
  electrophorese: string;
  maladiesChroniques: string[];
  vaccins: Vaccin[];
  donneesPubliques: string[];
  createdAt: string;
}

export interface PriseRecord {
  date: string;
  heure: string;
  pris: boolean;
  prisAt?: string;
}

export interface Treatment {
  id: string;
  medicament: string;
  posologie: string;
  frequence: number;
  heures: string[];
  dureeJours: number;
  dateDebut: string;
  notes: string;
  ordonnanceBase64: string;
  prises: PriseRecord[];
  actif: boolean;
  createdAt: string;
  medecinId?: string;
}

export interface AccessRequest {
  id: string;
  patientUserId: string;
  medecinId: string;
  medecinNom: string;
  medecinSpecialite: string;
  status: 'pending' | 'accepted' | 'refused' | 'revoked' | 'completed';
  createdAt: string;
  resolvedAt?: string;
}

export interface FamilyProfile extends PatientProfile {
  relation: string;
}

export interface ActivityEntry {
  id: string;
  clientId?: string;
  patientUserId: string;
  type:
    | 'access_request'
    | 'access_accepted'
    | 'access_refused'
    | 'access_revoked'
    | 'prescription_issued'
    | 'record_viewed'
    | 'prescription_exported';
  medecinId: string;
  medecinNom: string;
  medecinSpecialite?: string;
  details?: string;
  createdAt: string;
}

export interface PendingAction {
  id: string;
  doctorId: string;
  kind: 'access_request' | 'prescription' | 'activity';
  payload: unknown;
  createdAt: string;
  status?: 'queued' | 'failed';
  lastError?: string;
}

export interface QRShare {
  token: string;
  patientUserId: string;
  createdAt: string;
  expiresAt: string;
}

export type QRValidation =
  | { ok: true; patientUserId: string; expiresAt: string }
  | { ok: false; reason: 'not_found' | 'expired' | 'revoked' };

export interface LastPrescription {
  doctorId: string;
  patientUserId: string;
  patientName: string;
  date: string;
  notes: string;
  treatments: Treatment[];
}
