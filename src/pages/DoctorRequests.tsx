import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { getDoctorAccessRequests, type AccessRequest } from '@/lib/storage';
import { getUsers } from '@/lib/auth';

const statusMeta = {
  pending: { label: 'En attente', tone: 'text-warning', bg: 'bg-warning/5 border-warning/30', Icon: Clock },
  accepted: { label: 'Acceptée', tone: 'text-success', bg: 'bg-success/5 border-success/30', Icon: CheckCircle2 },
  refused: { label: 'Refusée', tone: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30', Icon: XCircle },
  revoked: { label: 'Révoquée', tone: 'text-muted-foreground', bg: 'bg-muted border-border', Icon: XCircle },
  completed: { label: 'Ordonnance émise', tone: 'text-primary', bg: 'bg-primary/5 border-primary/30', Icon: FileText },
} as const;

export default function DoctorRequests() {
  const navigate = useNavigate();
  const session = getSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);

  useEffect(() => {
    if (!session) return;
    const all = getDoctorAccessRequests(session.userId);
    setRequests([...all].reverse());
    const interval = setInterval(() => {
      setRequests([...getDoctorAccessRequests(session.userId)].reverse());
    }, 3000);
    return () => clearInterval(interval);
  }, [session]);

  const users = getUsers();
  const patientName = (id: string) => {
    const u = users.find(u => u.id === id);
    return u ? `${u.prenom} ${u.nom}` : `Patient #${id.slice(0, 6)}`;
  };

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Mes demandes</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Suivi des demandes d'accès aux dossiers patients</p>

      {requests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune demande pour l'instant</p>
          <button onClick={() => navigate('/medecin/recherche')} className="mt-3 text-sm font-semibold text-primary">
            Rechercher un patient →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r, i) => {
            const meta = statusMeta[r.status];
            return (
              <div
                key={r.id}
                className={`rounded-2xl border-2 ${meta.bg} p-4 animate-fade-up`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{patientName(r.patientUserId)}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${meta.tone}`}>
                      <meta.Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{meta.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  {r.status === 'accepted' && (
                    <button
                      onClick={() => navigate(`/medecin/patient/${r.patientUserId}`)}
                      className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.96] flex items-center gap-1 flex-shrink-0"
                    >
                      Ouvrir <ExternalLink className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
