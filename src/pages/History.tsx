import { useEffect, useState } from 'react';
import { getTreatments, generatePrises, calculateAdherence, type Treatment } from '@/lib/storage';
import { Search } from 'lucide-react';

export default function History() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setTreatments(getTreatments());
  }, []);

  const filtered = treatments.filter(t =>
    t.medicament.toLowerCase().includes(search.toLowerCase()) ||
    t.notes.toLowerCase().includes(search.toLowerCase())
  );

  // Build timeline entries
  const timelineEntries = filtered
    .sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-4">Historique</h1>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un traitement..."
          className="w-full rounded-xl border-2 border-border bg-card pl-10 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {timelineEntries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucun historique disponible</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {timelineEntries.map((t, i) => {
              const adherence = calculateAdherence(t);
              const isExpanded = expanded === t.id;
              const prises = isExpanded ? generatePrises(t) : [];

              return (
                <div
                  key={t.id}
                  className="relative pl-10 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 ${
                    t.actif ? 'border-primary bg-primary' : 'border-muted-foreground bg-card'
                  }`} />

                  <button
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    className="w-full text-left rounded-2xl border-2 border-border bg-card p-4 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-foreground">{t.medicament}</p>
                        <p className="text-sm text-muted-foreground">{t.posologie} — {t.frequence}x/jour</p>
                        <p className="text-xs text-muted-foreground mt-1">{t.dateDebut} • {t.dureeJours} jours</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          t.actif ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {t.actif ? 'Actif' : 'Terminé'}
                        </span>
                        <p className="tabular-nums text-sm font-semibold text-foreground mt-1">{adherence}%</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 border-t border-border pt-3 space-y-2">
                        {t.notes && <p className="text-sm text-muted-foreground italic">{t.notes}</p>}
                        <p className="text-xs font-semibold text-muted-foreground">Détail des prises :</p>
                        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                          {prises.slice(-20).map((p, j) => (
                            <div
                              key={j}
                              className={`rounded-lg px-2 py-1 text-center text-xs ${
                                p.pris ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <div className="font-semibold">{p.heure}</div>
                              <div>{p.date.slice(5)}</div>
                            </div>
                          ))}
                        </div>
                        {t.ordonnanceBase64 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Ordonnance :</p>
                            <img src={t.ordonnanceBase64} alt="Ordonnance" className="rounded-xl max-h-32 object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
