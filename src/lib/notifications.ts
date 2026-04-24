import { getTodayPrises } from './storage';

let notificationInterval: ReturnType<typeof setInterval> | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else {
    // Fallback alert
    alert(`${title}\n${body}`);
  }
}

export function generateSMSText(medicament: string, heure: string): string {
  return `Rappel HealthPocket: Prends ton ${medicament} maintenant ! (${heure})`;
}

export function startReminderCheck() {
  if (notificationInterval) return;
  
  notificationInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todayPrises = getTodayPrises();
    for (const { treatment, prise } of todayPrises) {
      if (!prise.pris && prise.heure === currentTime) {
        sendNotification(
          "C'est l'heure de votre traitement",
          `${treatment.medicament} — ${treatment.posologie}`
        );
      }
    }
  }, 60000); // Check every minute
}

export function stopReminderCheck() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}
