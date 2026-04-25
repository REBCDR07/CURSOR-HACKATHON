import { getSession } from './auth';
import { generateId, todayIsoDate } from './ids';
import { readJSON, readString, removeKey, writeJSON, writeString } from './kv';
import type {
  AccessRequest,
  ActivityEntry,
  FamilyProfile,
  PatientProfile,
  PendingAction,
  PriseRecord,
  QRShare,
  QRValidation,
  Treatment,
} from '../types/domain';

const PROFILES_MAP_KEY = 'hp_profiles_map';
const TREATMENTS_MAP_KEY = 'hp_treatments_map';
const ACCESS_REQUESTS_KEY = 'hp_access_requests';
const FAMILY_KEY = 'hp_family';
const ACTIVE_FAMILY_KEY = 'hp_active_family';
const ACTIVITY_KEY = 'hp_activity_log';
const PENDING_ACTIONS_KEY = 'hp_pending_actions';
const QR_SHARES_KEY = 'hp_qr_shares';

const LEGACY_PROFILE_KEY = 'hp_profile';
const LEGACY_TREATMENTS_KEY = 'hp_treatments';

const TWENTY_FOUR_H = 24 * 60 * 60 * 1000;

async function getCurrentPatientId(): Promise<string | null> {
  const session = await getSession();
  if (!session || session.role !== 'patient') return null;
  return session.userId;
}

async function readMap<T>(key: string): Promise<Record<string, T>> {
  return readJSON<Record<string, T>>(key, {});
}

async function writeMap<T>(key: string, map: Record<string, T>): Promise<void> {
  await writeJSON(key, map);
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

export async function getProfileFor(userId: string): Promise<PatientProfile | null> {
  const map = await readMap<PatientProfile>(PROFILES_MAP_KEY);
  return map[userId] ?? null;
}

export async function saveProfileFor(userId: string, profile: PatientProfile): Promise<void> {
  const map = await readMap<PatientProfile>(PROFILES_MAP_KEY);
  map[userId] = profile;
  await writeMap(PROFILES_MAP_KEY, map);
}

export async function getProfile(): Promise<PatientProfile | null> {
  const uid = await getCurrentPatientId();
  if (uid) {
    const profile = await getProfileFor(uid);
    if (profile) return profile;

    const legacy = await readString(LEGACY_PROFILE_KEY);
    if (!legacy) return null;

    try {
      const parsed = JSON.parse(legacy) as PatientProfile;
      await saveProfileFor(uid, parsed);
      await removeKey(LEGACY_PROFILE_KEY);
      return parsed;
    } catch {
      return null;
    }
  }

  const legacy = await readString(LEGACY_PROFILE_KEY);
  if (!legacy) return null;
  try {
    return JSON.parse(legacy) as PatientProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: PatientProfile): Promise<void> {
  const uid = await getCurrentPatientId();
  if (uid) {
    await saveProfileFor(uid, profile);
    return;
  }
  await writeString(LEGACY_PROFILE_KEY, JSON.stringify(profile));
}

export async function getTreatmentsFor(userId: string): Promise<Treatment[]> {
  const map = await readMap<Treatment[]>(TREATMENTS_MAP_KEY);
  return map[userId] ?? [];
}

export async function saveTreatmentsFor(userId: string, treatments: Treatment[]): Promise<void> {
  const map = await readMap<Treatment[]>(TREATMENTS_MAP_KEY);
  map[userId] = treatments;
  await writeMap(TREATMENTS_MAP_KEY, map);
}

export async function getTreatments(): Promise<Treatment[]> {
  const uid = await getCurrentPatientId();
  if (uid) {
    const map = await readMap<Treatment[]>(TREATMENTS_MAP_KEY);
    if (map[uid]) return map[uid];

    const legacy = await readString(LEGACY_TREATMENTS_KEY);
    if (!legacy) return [];

    try {
      const parsed = JSON.parse(legacy) as Treatment[];
      await saveTreatmentsFor(uid, parsed);
      await removeKey(LEGACY_TREATMENTS_KEY);
      return parsed;
    } catch {
      return [];
    }
  }

  const legacy = await readString(LEGACY_TREATMENTS_KEY);
  if (!legacy) return [];
  try {
    return JSON.parse(legacy) as Treatment[];
  } catch {
    return [];
  }
}

export async function saveTreatments(treatments: Treatment[]): Promise<void> {
  const uid = await getCurrentPatientId();
  if (uid) {
    await saveTreatmentsFor(uid, treatments);
    return;
  }
  await writeString(LEGACY_TREATMENTS_KEY, JSON.stringify(treatments));
}

export async function addTreatment(treatment: Treatment): Promise<void> {
  const treatments = await getTreatments();
  treatments.push(treatment);
  await saveTreatments(treatments);
}

export async function addTreatmentForPatient(patientUserId: string, treatment: Treatment): Promise<void> {
  const treatments = await getTreatmentsFor(patientUserId);
  treatments.push(treatment);
  await saveTreatmentsFor(patientUserId, treatments);
}

export async function updateTreatment(id: string, updates: Partial<Treatment>): Promise<void> {
  const treatments = await getTreatments();
  const index = treatments.findIndex((t) => t.id === id);
  if (index === -1) return;
  treatments[index] = { ...treatments[index], ...updates };
  await saveTreatments(treatments);
}

export async function markPrise(treatmentId: string, date: string, heure: string): Promise<void> {
  const treatments = await getTreatments();
  const treatment = treatments.find((t) => t.id === treatmentId);
  if (!treatment) return;

  const existing = treatment.prises.find((p) => p.date === date && p.heure === heure);
  if (existing) {
    existing.pris = true;
    existing.prisAt = new Date().toISOString();
  } else {
    treatment.prises.push({ date, heure, pris: true, prisAt: new Date().toISOString() });
  }

  await saveTreatments(treatments);
}

export function generatePrises(treatment: Treatment): PriseRecord[] {
  const prises: PriseRecord[] = [];
  const start = new Date(treatment.dateDebut);

  for (let day = 0; day < treatment.dureeJours; day += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (const heure of treatment.heures) {
      const existing = treatment.prises.find((p) => p.date === dateStr && p.heure === heure);
      prises.push(existing ?? { date: dateStr, heure, pris: false });
    }
  }

  return prises;
}

export function calculateAdherence(treatment: Treatment): number {
  const allPrises = generatePrises(treatment);
  const today = todayIsoDate();
  const past = allPrises.filter((p) => p.date <= today);
  if (past.length === 0) return 100;
  const taken = past.filter((p) => p.pris).length;
  return Math.round((taken / past.length) * 100);
}

export async function getTodayPrises(): Promise<Array<{ treatment: Treatment; prise: PriseRecord }>> {
  const today = todayIsoDate();
  const treatments = (await getTreatments()).filter((t) => t.actif);

  const results: Array<{ treatment: Treatment; prise: PriseRecord }> = [];
  for (const treatment of treatments) {
    const all = generatePrises(treatment);
    const todayPrises = all.filter((p) => p.date === today);
    for (const prise of todayPrises) {
      results.push({ treatment, prise });
    }
  }

  return results.sort((a, b) => a.prise.heure.localeCompare(b.prise.heure));
}

export async function getAccessRequests(): Promise<AccessRequest[]> {
  return readJSON<AccessRequest[]>(ACCESS_REQUESTS_KEY, []);
}

export async function saveAccessRequests(requests: AccessRequest[]): Promise<void> {
  await writeJSON(ACCESS_REQUESTS_KEY, requests);
}

export async function getMyAccessRequests(): Promise<AccessRequest[]> {
  const uid = await getCurrentPatientId();
  if (!uid) return [];
  const all = await getAccessRequests();
  return all.filter((r) => r.patientUserId === uid);
}

export async function getDoctorAccessRequests(medecinId: string): Promise<AccessRequest[]> {
  const all = await getAccessRequests();
  return all.filter((r) => r.medecinId === medecinId);
}

export async function createAccessRequest(
  req: Omit<AccessRequest, 'id' | 'createdAt' | 'status'>,
): Promise<AccessRequest> {
  const all = await getAccessRequests();
  const newReq: AccessRequest = {
    ...req,
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
  all.push(newReq);
  await saveAccessRequests(all);

  await logActivity({
    patientUserId: req.patientUserId,
    type: 'access_request',
    medecinId: req.medecinId,
    medecinNom: req.medecinNom,
    medecinSpecialite: req.medecinSpecialite,
    details: "Demande d'accès au dossier",
  });

  return newReq;
}

export async function updateAccessRequest(id: string, updates: Partial<AccessRequest>): Promise<void> {
  const all = await getAccessRequests();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return;

  const before = all[index];
  all[index] = { ...before, ...updates };
  await saveAccessRequests(all);

  if (!updates.status || updates.status === before.status) return;

  const typeMap: Record<AccessRequest['status'], ActivityEntry['type'] | null> = {
    pending: null,
    accepted: 'access_accepted',
    refused: 'access_refused',
    revoked: 'access_revoked',
    completed: 'prescription_issued',
  };

  const activityType = typeMap[updates.status];
  if (!activityType) return;

  const details =
    updates.status === 'accepted'
      ? 'Accès accordé'
      : updates.status === 'refused'
      ? 'Demande refusée'
      : updates.status === 'revoked'
      ? 'Accès révoqué par le patient'
      : 'Ordonnance émise';

  await logActivity({
    patientUserId: before.patientUserId,
    type: activityType,
    medecinId: before.medecinId,
    medecinNom: before.medecinNom,
    medecinSpecialite: before.medecinSpecialite,
    details,
  });
}

export async function hasActiveDoctorAccess(medecinId: string, patientUserId: string): Promise<boolean> {
  const all = await getAccessRequests();
  return all.some(
    (r) => r.medecinId === medecinId && r.patientUserId === patientUserId && r.status === 'accepted',
  );
}

export async function getAllActivity(): Promise<ActivityEntry[]> {
  return readJSON<ActivityEntry[]>(ACTIVITY_KEY, []);
}

export async function logActivity(
  entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string; clientId?: string },
): Promise<ActivityEntry> {
  const all = await getAllActivity();
  if (entry.clientId) {
    const existing = all.find((a) => a.clientId === entry.clientId);
    if (existing) return existing;
  }

  const newEntry: ActivityEntry = {
    ...entry,
    id: generateId(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };

  all.push(newEntry);
  await writeJSON(ACTIVITY_KEY, all);
  return newEntry;
}

export async function logActivitySafe(
  doctorId: string,
  entry: Omit<ActivityEntry, 'id' | 'createdAt' | 'clientId'>,
  isOnline: boolean,
): Promise<ActivityEntry | null> {
  const clientId = generateId();
  const createdAt = new Date().toISOString();

  if (!isOnline) {
    await enqueueAction({
      doctorId,
      kind: 'activity',
      payload: { ...entry, clientId, createdAt },
    });
    return null;
  }

  return logActivity({ ...entry, clientId, createdAt });
}

export async function getMyActivity(): Promise<ActivityEntry[]> {
  const uid = await getCurrentPatientId();
  if (!uid) return [];

  const all = await getAllActivity();
  return all
    .filter((a) => a.patientUserId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPendingActions(): Promise<PendingAction[]> {
  return readJSON<PendingAction[]>(PENDING_ACTIONS_KEY, []);
}

async function savePendingActions(actions: PendingAction[]): Promise<void> {
  await writeJSON(PENDING_ACTIONS_KEY, actions);
}

export async function getDoctorPendingActions(doctorId: string): Promise<PendingAction[]> {
  const all = await getPendingActions();
  return all.filter((a) => a.doctorId === doctorId);
}

export async function enqueueAction(action: Omit<PendingAction, 'id' | 'createdAt'>): Promise<PendingAction> {
  const all = await getPendingActions();
  const item: PendingAction = {
    ...action,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  all.push(item);
  await savePendingActions(all);
  return item;
}

export async function removePendingAction(id: string): Promise<void> {
  const all = await getPendingActions();
  await savePendingActions(all.filter((a) => a.id !== id));
}

async function markPendingFailed(id: string, message: string): Promise<void> {
  const all = await getPendingActions();
  const index = all.findIndex((a) => a.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], status: 'failed', lastError: message };
  await savePendingActions(all);
}

interface AccessRequestPayload {
  patientUserId: string;
  medecinId: string;
  medecinNom: string;
  medecinSpecialite: string;
}

interface PrescriptionPayload {
  patientUserId: string;
  treatments: Treatment[];
}

interface ActivityPayload {
  patientUserId: string;
  type: ActivityEntry['type'];
  medecinId: string;
  medecinNom: string;
  medecinSpecialite?: string;
  details?: string;
  clientId?: string;
  createdAt?: string;
}

async function processOne(doctorId: string, action: PendingAction): Promise<boolean> {
  try {
    if (action.kind === 'access_request') {
      await createAccessRequest(action.payload as AccessRequestPayload);
    }

    if (action.kind === 'prescription') {
      const payload = action.payload as PrescriptionPayload;
      for (const treatment of payload.treatments) {
        await addTreatmentForPatient(payload.patientUserId, treatment);
      }

      const requests = await getAccessRequests();
      for (const req of requests.filter(
        (r) => r.medecinId === doctorId && r.patientUserId === payload.patientUserId && r.status === 'accepted',
      )) {
        await updateAccessRequest(req.id, { status: 'completed', resolvedAt: new Date().toISOString() });
      }
    }

    if (action.kind === 'activity') {
      await logActivity(action.payload as ActivityPayload);
    }

    await removePendingAction(action.id);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de synchronisation';
    await markPendingFailed(action.id, message);
    return false;
  }
}

export async function flushPendingActions(doctorId: string): Promise<number> {
  const actions = await getDoctorPendingActions(doctorId);
  let processed = 0;

  for (const action of actions) {
    if (await processOne(doctorId, action)) {
      processed += 1;
    }
  }

  return processed;
}

export async function retryPendingAction(id: string): Promise<boolean> {
  const all = await getPendingActions();
  const action = all.find((a) => a.id === id);
  if (!action) return false;
  return processOne(action.doctorId, action);
}

export async function getQRShares(): Promise<QRShare[]> {
  const all = await readJSON<QRShare[]>(QR_SHARES_KEY, []);
  const now = Date.now();
  const valid = all.filter((s) => new Date(s.expiresAt).getTime() > now);
  if (valid.length !== all.length) {
    await writeJSON(QR_SHARES_KEY, valid);
  }
  return valid;
}

export async function createQRShare(patientUserId: string): Promise<QRShare> {
  const now = Date.now();
  const share: QRShare = {
    token: generateId(),
    patientUserId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TWENTY_FOUR_H).toISOString(),
  };

  const all = await getQRShares();
  all.push(share);
  await writeJSON(QR_SHARES_KEY, all);
  return share;
}

export async function getMyQRShares(): Promise<QRShare[]> {
  const uid = await getCurrentPatientId();
  if (!uid) return [];
  const all = await getQRShares();
  return all.filter((s) => s.patientUserId === uid);
}

export async function revokeQRShare(token: string): Promise<void> {
  const all = await getQRShares();
  await writeJSON(
    QR_SHARES_KEY,
    all.filter((s) => s.token !== token),
  );
}

export async function validateQRTokenForDoctor(token: string): Promise<QRValidation> {
  const all = await readJSON<QRShare[]>(QR_SHARES_KEY, []);
  const found = all.find((s) => s.token === token);
  if (!found) return { ok: false, reason: 'not_found' };
  if (new Date(found.expiresAt).getTime() <= Date.now()) return { ok: false, reason: 'expired' };
  return { ok: true, patientUserId: found.patientUserId, expiresAt: found.expiresAt };
}

export async function getFamilyProfiles(): Promise<FamilyProfile[]> {
  return readJSON<FamilyProfile[]>(FAMILY_KEY, []);
}

export async function saveFamilyProfiles(profiles: FamilyProfile[]): Promise<void> {
  await writeJSON(FAMILY_KEY, profiles);
}

export async function getActiveFamilyId(): Promise<string | null> {
  return readString(ACTIVE_FAMILY_KEY);
}

export async function setActiveFamilyId(id: string | null): Promise<void> {
  if (!id) {
    await removeKey(ACTIVE_FAMILY_KEY);
    return;
  }
  await writeString(ACTIVE_FAMILY_KEY, id);
}
