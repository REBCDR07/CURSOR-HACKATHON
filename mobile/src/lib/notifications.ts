import { Platform } from 'react-native';
import { showToast } from './toast';
import { getTodayPrises } from './storage';

type NotificationsModule = typeof import('expo-notifications');

let reminderInterval: ReturnType<typeof setInterval> | null = null;
let configured = false;
let foregroundSub: { remove: () => void } | null = null;
let notificationsModulePromise: Promise<NotificationsModule | null> | null = null;
let reminderDay = '';
const sentReminderKeys = new Set<string>();

const isWeb = Platform.OS === 'web';
const ADVANCE_MINUTES = 15;

async function getNotificationsModule(): Promise<NotificationsModule | null> {
  if (isWeb) return null;
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications').catch(() => null);
  }
  return notificationsModulePromise;
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }

  return h * 60 + m;
}

function resetDailyReminderRegistryIfNeeded(): void {
  const day = new Date().toISOString().split('T')[0];
  if (day === reminderDay) return;

  reminderDay = day;
  sentReminderKeys.clear();
}

function markSentOnce(key: string): boolean {
  if (sentReminderKeys.has(key)) return false;
  sentReminderKeys.add(key);
  return true;
}

async function sendWebNotification(title: string, body: string): Promise<void> {
  showToast(`${title}: ${body}`, { tone: 'info', durationMs: 3600 });

  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, { body });
  } catch {
    // Ignore browser notification failures but keep in-app toast.
  }
}

export function configureNotifications(): void {
  if (configured) return;
  configured = true;

  if (isWeb) return;

  void (async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    foregroundSub = Notifications.addNotificationReceivedListener(() => {});
  })();
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return false;
    return Notification.permission === 'granted';
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  return current.granted;
}

export async function requestNotificationPermission(): Promise<boolean> {
  configureNotifications();

  if (isWeb) {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    const asked = await Notification.requestPermission();
    return asked === 'granted';
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function sendNotification(title: string, body: string): Promise<void> {
  if (isWeb) {
    await sendWebNotification(title, body);
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) return;

  configureNotifications();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}

async function runReminderCheck(): Promise<void> {
  resetDailyReminderRegistryIfNeeded();

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const items = await getTodayPrises();

  for (const { treatment, prise } of items) {
    if (prise.pris) continue;

    const targetMinutes = parseTimeToMinutes(prise.heure);
    if (targetMinutes === null) continue;

    const diff = targetMinutes - nowMinutes;
    const baseKey = `${treatment.id}:${prise.date}:${prise.heure}`;

    if (diff > 0 && diff <= ADVANCE_MINUTES && markSentOnce(`${baseKey}:advance`)) {
      await sendNotification(
        'Rappel proche',
        `${treatment.medicament} dans ${diff} min (${prise.heure}).`,
      );
      continue;
    }

    if (diff <= 0 && diff >= -2 && markSentOnce(`${baseKey}:due`)) {
      await sendNotification(
        "C'est l'heure de votre prise",
        `${treatment.medicament} — ${treatment.posologie}`,
      );
      continue;
    }

    if (diff < -20 && markSentOnce(`${baseKey}:late`)) {
      await sendNotification(
        'Prise en retard',
        `${treatment.medicament} prevu a ${prise.heure} n'est pas encore marque comme pris.`,
      );
    }
  }
}

export function generateSMSText(medicament: string, heure: string): string {
  return `Rappel HealthPocket: prends ${medicament} maintenant (${heure}).`;
}

export function startReminderCheck(): void {
  if (reminderInterval) return;

  void runReminderCheck();

  reminderInterval = setInterval(() => {
    void runReminderCheck();
  }, 60_000);
}

export function areRemindersRunning(): boolean {
  return reminderInterval !== null;
}

export function stopReminderCheck(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
  if (foregroundSub) {
    foregroundSub.remove();
    foregroundSub = null;
  }
  configured = false;
}
