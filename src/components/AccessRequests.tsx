import { useEffect, useState } from 'react';
import { Check, X, Eye } from 'lucide-react';
import { getMyAccessRequests, updateAccessRequest, type AccessRequest } from '@/lib/storage';

export default function AccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  const reload = () => setRequests(getMyAccessRequests());
  useEffect(reload, []);

  const setStatus = (id: string, status: AccessRequest['status']) => {
    updateAccessRequest(id, { status, resolvedAt: new Date().toISOString() });
    reload();
  };

  const pending = requests.filter(r => r.status === 'pending');
  const accepted = requests.filter(r => r.status === 'accepted');
  const history = requests.filter(r => r.status === 'refused' || r.status === 'revoked' || r.status === 'completed');

  if (requests.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '150ms' }}>
      <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <Eye className="h-4 w-4 text-primary" />
        Demandes d'accès médecin
      </h2>

      {pending.length > 0 && (
        <div className="space-y-2 mb-3">
          <p className="text-xs font-semibold text-warning">En attente ({pending.length})</p>
          {pending.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border-2 border-warning/30 bg-warning/5 p-3">
              <div>
                <p className="font-semibold text-sm text-foreground">{r.medecinNom}</p>
                <p className="text-xs text-muted-foreground">{r.medecinSpecialite}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStatus(r.id, 'accepted')} className="rounded-lg bg-success p-2 text-success-foreground active:scale-[0.96]">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => setStatus(r.id, 'refused')} className="rounded-lg bg-destructive p-2 text-destructive-foreground active:scale-[0.96]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="space-y-2 mb-3">
          <p className="text-xs font-semibold text-success">Accès accordé ({accepted.length})</p>
          {accepted.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border-2 border-success/30 bg-success/5 p-3">
              <div>
                <p className="font-semibold text-sm text-foreground">{r.medecinNom}</p>
                <p className="text-xs text-muted-foreground">{r.medecinSpecialite}</p>
              </div>
              <button onClick={() => setStatus(r.id, 'revoked')} className="rounded-lg border-2 border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive active:scale-[0.96]">
                Révoquer
              </button>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Historique</p>
          {history.slice(0, 5).map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5 text-xs text-muted-foreground">
              <span>{r.medecinNom}</span>
              <span>
                {r.status === 'refused' ? 'Refusé' : r.status === 'revoked' ? 'Révoqué' : 'Terminé'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
