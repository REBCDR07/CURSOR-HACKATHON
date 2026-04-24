import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, RefreshCw, Trash2, CheckCircle2, AlertTriangle,
  WifiOff, FileText, Send, Activity as ActivityIcon, CloudUpload,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import {
  getDoctorPendingActions,
  flushPendingActions,
  retryPendingAction,
  removePendingAction,
  type PendingAction,
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

const KIND_META: Record<PendingAction['kind'], { label: string; Icon: any; tone: string }> = {
  access_request: { label: 'Demande d\'accès', Icon: Send, tone: 'text-warning' },
  prescription: { label: 'Ordonnance', Icon: FileText, tone: 'text-primary' },
  activity: { label: 'Journal d\'activité', Icon: ActivityIcon, tone: 'text-muted-foreground' },
};

export default function DoctorQueue() {
  const navigate = useNavigate();
  const session = getSession();
  const [items, setItems] = useState<PendingAction[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  const reload = () => {
    if (!session) return;
    setItems(getDoctorPendingActions(session.userId));
  };

  useEffect(() => {
    reload();
    const onOnline = () => { setOnline(true); reload(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const i = setInterval(reload, 4000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(i);
    };
  }, [session?.userId]);

  const handleFlushAll = () => {
    if (!session) return;
    if (!navigator.onLine) {
      toast({ title: 'Hors ligne', description: 'Connecte-toi à internet pour synchroniser.' });
      return;
    }
    const n = flushPendingActions(session.userId);
    toast({ title: n > 0 ? 'Synchronisé' : 'Rien à envoyer', description: `${n} action(s) traitée(s).` });
    reload();
  };

  const handleRetry = (id: string) => {
    if (!navigator.onLine) {
      toast({ title: 'Hors ligne', description: 'Reviens en ligne pour relancer.' });
      return;
    }
    const ok = retryPendingAction(id);
    toast({
      title: ok ? 'Action envoyée' : 'Échec',
      description: ok ? 'L\'action a été traitée.' : 'Impossible pour l\'instant — réessaie plus tard.',
    });
    reload();
  };

  const handleRemove = (id: string) => {
    removePendingAction(id);
    reload();
  };

  const failed = items.filter(i => i.status === 'failed').length;

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate('/medecin')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">File d'attente</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Actions hors ligne en attente de synchronisation
      </p>

      {/* Status banner */}
      <div className={`mt-4 rounded-2xl border-2 p-4 flex items-center gap-3 ${
        !online ? 'border-warning/30 bg-warning/5'
          : items.length > 0 ? 'border-primary/30 bg-primary/5'
          : 'border-success/30 bg-success/5'
      }`}>
        {!online ? (
          <WifiOff className="h-5 w-5 text-warning flex-shrink-0" />
        ) : items.length > 0 ? (
          <CloudUpload className="h-5 w-5 text-primary flex-shrink-0" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {!online ? 'Mode hors ligne'
              : items.length === 0 ? 'Tout est synchronisé'
              : `${items.length} action(s) en file`}
          </p>
          <p className="text-xs text-muted-foreground">
            {failed > 0 ? `${failed} en échec — relance manuellement.` :
             items.length > 0 ? 'Sera envoyé au retour du réseau.' : 'Aucune action en attente.'}
          </p>
        </div>
        {online && items.length > 0 && (
          <button
            onClick={handleFlushAll}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.96] flex-shrink-0 flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tout envoyer
          </button>
        )}
      </div>

      {/* Items */}
      <div className="mt-6 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Rien en file d'attente</p>
          </div>
        ) : (
          items.map((a, i) => {
            const m = KIND_META[a.kind];
            return (
              <div
                key={a.id}
                className={`rounded-xl border-2 p-3 animate-fade-up ${
                  a.status === 'failed' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${m.tone}`}>
                    <m.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{m.label}</p>
                      {a.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          <AlertTriangle className="h-3 w-3" /> Échec
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.kind === 'prescription' && a.payload?.treatments?.length
                        ? `${a.payload.treatments.length} médicament(s) — patient #${String(a.payload.patientUserId || '').slice(0,6)}`
                        : a.kind === 'access_request'
                        ? `Patient #${String(a.payload?.patientUserId || '').slice(0,6)}`
                        : a.payload?.details || ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Créée {new Date(a.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    {a.lastError && (
                      <p className="text-[11px] text-destructive mt-1 italic">{a.lastError}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleRetry(a.id)}
                    disabled={!online}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Relancer
                  </button>
                  <button
                    onClick={() => handleRemove(a.id)}
                    className="rounded-lg border-2 border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive active:scale-[0.96] flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Annuler
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
