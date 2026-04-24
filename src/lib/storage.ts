// Types
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
  donneesPubliques: string[]; // keys visible to doctors
  createdAt: string;
}

export interface Vaccin {
  nom: string;
  date: string;
  rappel: string;
}

export interface Treatment {
  id: string;
  medicament: string;
  posologie: string;
  frequence: number; // times per day
  heures: string[]; // ["08:00", "20:00"]
  dureeJours: number;
  dateDebut: string;
  notes: string;
  ordonnanceBase64: string;
  prises: PriseRecord[];
  actif: boolean;
  createdAt: string;
  medecinId?: string;
}

export interface PriseRecord {
  date: string; // YYYY-MM-DD
  heure: string;
  pris: boolean;
  prisAt?: string;
}

export interface AccessRequest {
  id: string;
  patientUserId: string; // owner of the medical record
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

// Activity log entries (visible to patient)
export interface ActivityEntry {
  id: string;
  clientId?: string; // stable dedup key when synced from offline queue
  patientUserId: string;
  type: 'access_request' | 'access_accepted' | 'access_refused' | 'access_revoked' | 'prescription_issued' | 'record_viewed' | 'prescription_exported';
  medecinId: string;
  medecinNom: string;
  medecinSpecialite?: string;
  details?: string;
  createdAt: string;
}

// Doctor pending offline action (queued when offline)
export interface PendingAction {
  id: string;
  doctorId: string;
  kind: 'access_request' | 'prescription' | 'activity';
  payload: any;
  createdAt: string;
  status?: 'queued' | 'failed';
  lastError?: string;
}

// Temporary QR share (24h expiry)
export interface QRShare {
  token: string;
  patientUserId: string;
  createdAt: string;
  expiresAt: string;
}

// Keys (per-user maps stored as { [userId]: data })
const PROFILES_MAP_KEY = 'hp_profiles_map';
const TREATMENTS_MAP_KEY = 'hp_treatments_map';
const ACCESS_REQUESTS_KEY = 'hp_access_requests';
const FAMILY_KEY = 'hp_family';
const ACTIVE_FAMILY_KEY = 'hp_active_family';
const ACTIVITY_KEY = 'hp_activity_log';
const PENDING_ACTIONS_KEY = 'hp_pending_actions';
const QR_SHARES_KEY = 'hp_qr_shares';

// Legacy keys (migration)
const LEGACY_PROFILE_KEY = 'hp_profile';
const LEGACY_TREATMENTS_KEY = 'hp_treatments';

// Generate ID
export const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

// ---------- Helpers to identify the current patient ----------
function getCurrentPatientId(): string | null {
  const raw = localStorage.getItem('hp_session');
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    if (s.role && s.role !== 'patient') return null;
    return s.userId as string;
  } catch {
    return null;
  }
}

// ---------- Per-user maps ----------
function readMap<T>(key: string): Record<string, T> {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : {};
}
function writeMap<T>(key: string, map: Record<string, T>) {
  localStorage.setItem(key, JSON.stringify(map));
}

// ---------- Profile ----------
export function getProfileFor(userId: string): PatientProfile | null {
  const map = readMap<PatientProfile>(PROFILES_MAP_KEY);
  return map[userId] ?? null;
}

export function saveProfileFor(userId: string, profile: PatientProfile): void {
  const map = readMap<PatientProfile>(PROFILES_MAP_KEY);
  map[userId] = profile;
  writeMap(PROFILES_MAP_KEY, map);
}

export function getProfile(): PatientProfile | null {
  const uid = getCurrentPatientId();
  if (uid) {
    const p = getProfileFor(uid);
    if (p) return p;
    // migrate legacy single profile
    const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as PatientProfile;
      saveProfileFor(uid, parsed);
      localStorage.removeItem(LEGACY_PROFILE_KEY);
      return parsed;
    }
    return null;
  }
  // No session — fallback to legacy (used during onboarding before login)
  const data = localStorage.getItem(LEGACY_PROFILE_KEY);
  return data ? JSON.parse(data) : null;
}

export function saveProfile(profile: PatientProfile): void {
  const uid = getCurrentPatientId();
  if (uid) saveProfileFor(uid, profile);
  else localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(profile));
}

export function createDefaultProfile(): PatientProfile {
  return {
    id: generateId(),
    pseudo: '',
    age: null,
    sexe: '',
    groupeSanguin: '',
    allergies: [],
    electrophorese: '',
    maladiesChroniques: [],
    vaccins: [],
    donneesPubliques: ['groupeSanguin', 'allergies', 'maladiesChroniques'],
    createdAt: new Date().toISOString(),
  };
}

// ---------- Treatments ----------
export function getTreatmentsFor(userId: string): Treatment[] {
  const map = readMap<Treatment[]>(TREATMENTS_MAP_KEY);
  return map[userId] ?? [];
}

export function saveTreatmentsFor(userId: string, treatments: Treatment[]): void {
  const map = readMap<Treatment[]>(TREATMENTS_MAP_KEY);
  map[userId] = treatments;
  writeMap(TREATMENTS_MAP_KEY, map);
}

export function getTreatments(): Treatment[] {
  const uid = getCurrentPatientId();
  if (uid) {
    const map = readMap<Treatment[]>(TREATMENTS_MAP_KEY);
    if (map[uid]) return map[uid];
    // migrate legacy
    const legacy = localStorage.getItem(LEGACY_TREATMENTS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Treatment[];
      saveTreatmentsFor(uid, parsed);
      localStorage.removeItem(LEGACY_TREATMENTS_KEY);
      return parsed;
    }
    return [];
  }
  const data = localStorage.getItem(LEGACY_TREATMENTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveTreatments(treatments: Treatment[]): void {
  const uid = getCurrentPatientId();
  if (uid) saveTreatmentsFor(uid, treatments);
  else localStorage.setItem(LEGACY_TREATMENTS_KEY, JSON.stringify(treatments));
}

export function addTreatment(treatment: Treatment): void {
  const treatments = getTreatments();
  treatments.push(treatment);
  saveTreatments(treatments);
}

// Doctor-side: add a treatment directly to a patient's record
export function addTreatmentForPatient(patientUserId: string, treatment: Treatment): void {
  const treatments = getTreatmentsFor(patientUserId);
  treatments.push(treatment);
  saveTreatmentsFor(patientUserId, treatments);
}

export function updateTreatment(id: string, updates: Partial<Treatment>): void {
  const treatments = getTreatments();
  const idx = treatments.findIndex(t => t.id === id);
  if (idx !== -1) {
    treatments[idx] = { ...treatments[idx], ...updates };
    saveTreatments(treatments);
  }
}

export function markPrise(treatmentId: string, date: string, heure: string): void {
  const treatments = getTreatments();
  const t = treatments.find(t => t.id === treatmentId);
  if (!t) return;
  const prise = t.prises.find(p => p.date === date && p.heure === heure);
  if (prise) {
    prise.pris = true;
    prise.prisAt = new Date().toISOString();
  } else {
    t.prises.push({ date, heure, pris: true, prisAt: new Date().toISOString() });
  }
  saveTreatments(treatments);
}

// Generate expected prises for a treatment
export function generatePrises(treatment: Treatment): PriseRecord[] {
  const prises: PriseRecord[] = [];
  const start = new Date(treatment.dateDebut);
  for (let d = 0; d < treatment.dureeJours; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    for (const heure of treatment.heures) {
      const existing = treatment.prises.find(p => p.date === dateStr && p.heure === heure);
      prises.push(existing || { date: dateStr, heure, pris: false });
    }
  }
  return prises;
}

// Adherence calculation
export function calculateAdherence(treatment: Treatment): number {
  const allPrises = generatePrises(treatment);
  const today = new Date().toISOString().split('T')[0];
  const pastPrises = allPrises.filter(p => p.date <= today);
  if (pastPrises.length === 0) return 100;
  const taken = pastPrises.filter(p => p.pris).length;
  return Math.round((taken / pastPrises.length) * 100);
}

// Get today's prises across all active treatments
export function getTodayPrises(): { treatment: Treatment; prise: PriseRecord }[] {
  const today = new Date().toISOString().split('T')[0];
  const treatments = getTreatments().filter(t => t.actif);
  const result: { treatment: Treatment; prise: PriseRecord }[] = [];
  for (const t of treatments) {
    const allPrises = generatePrises(t);
    const todayPrises = allPrises.filter(p => p.date === today);
    for (const p of todayPrises) {
      result.push({ treatment: t, prise: p });
    }
  }
  return result.sort((a, b) => a.prise.heure.localeCompare(b.prise.heure));
}

// ---------- Access requests (shared across all users on device) ----------
export function getAccessRequests(): AccessRequest[] {
  const data = localStorage.getItem(ACCESS_REQUESTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAccessRequests(requests: AccessRequest[]): void {
  localStorage.setItem(ACCESS_REQUESTS_KEY, JSON.stringify(requests));
}

// Patient-side: only requests targeting current patient
export function getMyAccessRequests(): AccessRequest[] {
  const uid = getCurrentPatientId();
  if (!uid) return [];
  return getAccessRequests().filter(r => r.patientUserId === uid);
}

// Doctor-side: requests this doctor has issued
export function getDoctorAccessRequests(medecinId: string): AccessRequest[] {
  return getAccessRequests().filter(r => r.medecinId === medecinId);
}

export function createAccessRequest(req: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>): AccessRequest {
  const all = getAccessRequests();
  const newReq: AccessRequest = {
    ...req,
    id: generateId(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  all.push(newReq);
  saveAccessRequests(all);
  logActivity({
    patientUserId: req.patientUserId,
    type: 'access_request',
    medecinId: req.medecinId,
    medecinNom: req.medecinNom,
    medecinSpecialite: req.medecinSpecialite,
    details: 'Demande d\'accès au dossier',
  });
  return newReq;
}

export function updateAccessRequest(id: string, updates: Partial<AccessRequest>): void {
  const all = getAccessRequests();
  const idx = all.findIndex(r => r.id === id);
  if (idx !== -1) {
    const before = all[idx];
    all[idx] = { ...before, ...updates };
    saveAccessRequests(all);
    if (updates.status && updates.status !== before.status) {
      const typeMap: Record<string, ActivityEntry['type'] | null> = {
        accepted: 'access_accepted',
        refused: 'access_refused',
        revoked: 'access_revoked',
        completed: 'prescription_issued',
      };
      const t = typeMap[updates.status];
      if (t) {
        logActivity({
          patientUserId: before.patientUserId,
          type: t,
          medecinId: before.medecinId,
          medecinNom: before.medecinNom,
          medecinSpecialite: before.medecinSpecialite,
          details:
            updates.status === 'accepted' ? 'Accès accordé'
            : updates.status === 'refused' ? 'Demande refusée'
            : updates.status === 'revoked' ? 'Accès révoqué par le patient'
            : 'Ordonnance émise',
        });
      }
    }
  }
}

export function hasActiveDoctorAccess(medecinId: string, patientUserId: string): boolean {
  return getAccessRequests().some(
    r => r.medecinId === medecinId && r.patientUserId === patientUserId && r.status === 'accepted',
  );
}

// Family
export function getFamilyProfiles(): FamilyProfile[] {
  const data = localStorage.getItem(FAMILY_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveFamilyProfiles(profiles: FamilyProfile[]): void {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(profiles));
}

export function getActiveFamilyId(): string | null {
  return localStorage.getItem(ACTIVE_FAMILY_KEY);
}

export function setActiveFamilyId(id: string | null): void {
  if (id) localStorage.setItem(ACTIVE_FAMILY_KEY, id);
  else localStorage.removeItem(ACTIVE_FAMILY_KEY);
}

// ---------- Activity log ----------
export function getAllActivity(): ActivityEntry[] {
  const data = localStorage.getItem(ACTIVITY_KEY);
  return data ? JSON.parse(data) : [];
}

export function logActivity(entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string; clientId?: string }): ActivityEntry {
  const all = getAllActivity();
  // Dedup: if a clientId is provided and already present, skip.
  if (entry.clientId && all.some(a => a.clientId === entry.clientId)) {
    return all.find(a => a.clientId === entry.clientId)!;
  }
  const newEntry: ActivityEntry = {
    ...entry,
    id: generateId(),
    createdAt: entry.createdAt || new Date().toISOString(),
  };
  all.push(newEntry);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(all));
  return newEntry;
}

/**
 * Online-or-offline activity logger. If the device is offline we queue the
 * activity payload (with a stable clientId) so the patient's journal stays
 * coherent once the doctor's device comes back online — without duplicates.
 */
export function logActivitySafe(
  doctorId: string,
  entry: Omit<ActivityEntry, 'id' | 'createdAt' | 'clientId'>,
): ActivityEntry | null {
  const clientId = generateId();
  const createdAt = new Date().toISOString();
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueAction({
      doctorId,
      kind: 'activity',
      payload: { ...entry, clientId, createdAt },
    });
    return null;
  }
  return logActivity({ ...entry, clientId, createdAt });
}

export function getMyActivity(): ActivityEntry[] {
  const uid = getCurrentPatientId();
  if (!uid) return [];
  return getAllActivity()
    .filter(a => a.patientUserId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------- Pending actions queue (offline) ----------
export function getPendingActions(): PendingAction[] {
  const data = localStorage.getItem(PENDING_ACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function savePendingActions(actions: PendingAction[]) {
  localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
}

export function getDoctorPendingActions(doctorId: string): PendingAction[] {
  return getPendingActions().filter(a => a.doctorId === doctorId);
}

export function enqueueAction(action: Omit<PendingAction, 'id' | 'createdAt'>): PendingAction {
  const all = getPendingActions();
  const item: PendingAction = {
    ...action,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  savePendingActions(all);
  return item;
}

export function removePendingAction(id: string): void {
  savePendingActions(getPendingActions().filter(a => a.id !== id));
}

function markPendingFailed(id: string, err: string): void {
  const all = getPendingActions();
  const idx = all.findIndex(a => a.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], status: 'failed', lastError: err };
    savePendingActions(all);
  }
}

function processOne(doctorId: string, a: PendingAction): boolean {
  try {
    if (a.kind === 'access_request') {
      createAccessRequest(a.payload);
    } else if (a.kind === 'prescription') {
      const { patientUserId, treatments } = a.payload;
      for (const t of treatments) addTreatmentForPatient(patientUserId, t);
      getAccessRequests()
        .filter(r => r.medecinId === doctorId && r.patientUserId === patientUserId && r.status === 'accepted')
        .forEach(r => updateAccessRequest(r.id, { status: 'completed', resolvedAt: new Date().toISOString() }));
    } else if (a.kind === 'activity') {
      // Dedup happens inside logActivity via clientId.
      logActivity(a.payload);
    }
    removePendingAction(a.id);
    return true;
  } catch (e: any) {
    markPendingFailed(a.id, String(e?.message || e));
    return false;
  }
}

/**
 * Flush queued actions for a doctor. Returns count processed.
 */
export function flushPendingActions(doctorId: string): number {
  const actions = getDoctorPendingActions(doctorId);
  let processed = 0;
  for (const a of actions) if (processOne(doctorId, a)) processed++;
  return processed;
}

/** Retry a single pending action manually. */
export function retryPendingAction(id: string): boolean {
  const a = getPendingActions().find(x => x.id === id);
  if (!a) return false;
  return processOne(a.doctorId, a);
}

// ---------- QR shares (24h temporary access) ----------
const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

export function getQRShares(): QRShare[] {
  const data = localStorage.getItem(QR_SHARES_KEY);
  const all: QRShare[] = data ? JSON.parse(data) : [];
  // Auto-clean expired
  const now = Date.now();
  const valid = all.filter(s => new Date(s.expiresAt).getTime() > now);
  if (valid.length !== all.length) localStorage.setItem(QR_SHARES_KEY, JSON.stringify(valid));
  return valid;
}

export function createQRShare(patientUserId: string): QRShare {
  const now = Date.now();
  const share: QRShare = {
    token: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
    patientUserId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TWENTY_FOUR_H).toISOString(),
  };
  const all = getQRShares();
  all.push(share);
  localStorage.setItem(QR_SHARES_KEY, JSON.stringify(all));
  return share;
}

export function getMyQRShares(): QRShare[] {
  const uid = getCurrentPatientId();
  if (!uid) return [];
  return getQRShares().filter(s => s.patientUserId === uid);
}

export function revokeQRShare(token: string): void {
  const all = getQRShares().filter(s => s.token !== token);
  localStorage.setItem(QR_SHARES_KEY, JSON.stringify(all));
}

export function resolveQRShare(token: string): QRShare | null {
  return getQRShares().find(s => s.token === token) || null;
}

/**
 * Validate a QR token from a doctor's perspective.
 * Returns a discriminated result the route can render directly.
 */
export type QRValidation =
  | { ok: true; patientUserId: string; expiresAt: string }
  | { ok: false; reason: 'not_found' | 'expired' | 'revoked' };

export function validateQRTokenForDoctor(token: string): QRValidation {
  // getQRShares() auto-purges expired tokens; check raw too for clearer errors.
  const raw = localStorage.getItem(QR_SHARES_KEY);
  const all: QRShare[] = raw ? JSON.parse(raw) : [];
  const found = all.find(s => s.token === token);
  if (!found) return { ok: false, reason: 'not_found' };
  if (new Date(found.expiresAt).getTime() <= Date.now()) return { ok: false, reason: 'expired' };
  // Token still alive -> ok
  return { ok: true, patientUserId: found.patientUserId, expiresAt: found.expiresAt };
}

