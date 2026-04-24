import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, ShieldCheck, ShieldX, FileText, Send, Activity as ActivityIcon, Download } from 'lucide-react';
import { getMyActivity, type ActivityEntry } from '@/lib/storage';

const meta: Record<ActivityEntry['type'], { label: string; tone: string; bg: string; Icon: any }> = {
  access_request: { label: 'Demande d\'accès', tone: 'text-warning', bg: 'bg-warning/5 border-warning/30', Icon: Send },
  access_accepted: { label: 'Accès accordé', tone: 'text-success', bg: 'bg-success/5 border-success/30', Icon: ShieldCheck },
  access_refused: { label: 'Demande refusée', tone: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30', Icon: ShieldX },
  access_revoked: { label: 'Accès révoqué', tone: 'text-destructive', bg: 'bg-destructive/5 border-destructive/30', Icon: ShieldX },
  prescription_issued: { label: 'Ordonnance émise', tone: 'text-primary', bg: 'bg-primary/5 border-primary/30', Icon: FileText },
  prescription_exported: { label: 'Ordonnance exportée (PDF)', tone: 'text-primary', bg: 'bg-primary/5 border-primary/30', Icon: Download },
  record_viewed: { label: 'Dossier consulté', tone: 'text-muted-foreground', bg: 'bg-muted border-border', Icon: Eye },
};

export default function ActivityPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    setItems(getMyActivity());
    const i = setInterval(() => setItems(getMyActivity()), 4000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Journal d'activité</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">Consultations, accès médecin et ordonnances</p>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <ActivityIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Aucune activité pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a, i) => {
            const m = meta[a.type];
            return (
              <div
                key={a.id}
                className={`rounded-2xl border-2 ${m.bg} p-4 animate-fade-up`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-9 w-9 rounded-xl bg-card flex items-center justify-center flex-shrink-0 ${m.tone}`}>
                    <m.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-bold uppercase tracking-wide ${m.tone}`}>{m.label}</p>
                    <p className="font-semibold text-foreground text-sm mt-0.5">{a.medecinNom}</p>
                    {a.medecinSpecialite && (
                      <p className="text-xs text-muted-foreground">{a.medecinSpecialite}</p>
                    )}
                    {a.details && <p className="text-xs text-muted-foreground mt-1">{a.details}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      {new Date(a.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
