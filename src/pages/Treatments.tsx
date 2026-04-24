import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { getTreatments, calculateAdherence, updateTreatment, saveTreatments, type Treatment } from '@/lib/storage';

export default function Treatments() {
  const navigate = useNavigate();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filter, setFilter] = useState<'actif' | 'archive'>('actif');

  const reload = () => setTreatments(getTreatments());
  useEffect(reload, []);

  const filtered = treatments.filter(t => filter === 'actif' ? t.actif : !t.actif);

  const handleArchive = (id: string) => {
    updateTreatment(id, { actif: false });
    reload();
  };

  const handleDelete = (id: string) => {
    const ts = getTreatments().filter(t => t.id !== id);
    saveTreatments(ts);
    reload();
  };

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Traitements</h1>
        <button
          onClick={() => navigate('/traitements/ajouter')}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['actif', 'archive'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-[0.96] ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {f === 'actif' ? 'En cours' : 'Archivés'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">
            {filter === 'actif' ? 'Aucun traitement en cours' : 'Aucun traitement archivé'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => {
            const adherence = calculateAdherence(t);
            return (
              <div
                key={t.id}
                className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{t.medicament}</p>
                    <p className="text-sm text-muted-foreground">{t.posologie} — {t.frequence}x/jour</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.heures.join(', ')} • {t.dureeJours}j depuis {t.dateDebut}
                    </p>
                    {/* Adherence bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Adhésion</span>
                        <span className="tabular-nums font-semibold">{adherence}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${adherence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-3">
                    {t.actif && (
                      <button
                        onClick={() => handleArchive(t.id)}
                        className="text-xs font-semibold text-muted-foreground px-2 py-1 rounded-lg hover:bg-muted active:scale-[0.96]"
                      >
                        Archiver
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-xs text-destructive p-1 rounded-lg hover:bg-destructive/10 active:scale-[0.96]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {t.notes && (
                  <p className="text-xs text-muted-foreground mt-2 italic border-t border-border pt-2">{t.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
