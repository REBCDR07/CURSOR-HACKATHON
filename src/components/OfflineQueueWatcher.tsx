import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { getSession } from '@/lib/auth';
import { flushPendingActions, getDoctorPendingActions } from '@/lib/storage';

/**
 * Mounted globally. When the device comes back online and the current user
 * is a doctor with queued actions, flush them automatically.
 */
export default function OfflineQueueWatcher() {
  useEffect(() => {
    const tryFlush = () => {
      const session = getSession();
      if (!session || session.role !== 'medecin') return;
      const pending = getDoctorPendingActions(session.userId);
      if (pending.length === 0) return;
      const n = flushPendingActions(session.userId);
      if (n > 0) {
        toast({
          title: 'Actions synchronisées',
          description: `${n} action(s) hors ligne envoyée(s) avec succès.`,
        });
      }
    };

    window.addEventListener('online', tryFlush);
    // Also try at mount in case we recovered while the app was closed
    if (navigator.onLine) tryFlush();
    return () => window.removeEventListener('online', tryFlush);
  }, []);

  return null;
}
