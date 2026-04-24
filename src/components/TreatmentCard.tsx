import { Check, AlertCircle } from 'lucide-react';
import { Treatment, PriseRecord, markPrise, calculateAdherence } from '@/lib/storage';
import { useState } from 'react';

interface TreatmentCardProps {
  treatment: Treatment;
  prise: PriseRecord;
  onUpdate: () => void;
  showAdherence?: boolean;
}

export default function TreatmentCard({ treatment, prise, onUpdate, showAdherence }: TreatmentCardProps) {
  const [justMarked, setJustMarked] = useState(false);

  const handleMark = () => {
    markPrise(treatment.id, prise.date, prise.heure);
    setJustMarked(true);
    setTimeout(() => {
      setJustMarked(false);
      onUpdate();
    }, 600);
  };

  const now = new Date();
  const [h, m] = prise.heure.split(':').map(Number);
  const priseTime = new Date();
  priseTime.setHours(h, m, 0, 0);
  const isLate = !prise.pris && priseTime < now && prise.date === now.toISOString().split('T')[0];

  return (
    <div
      className={`rounded-2xl border-2 bg-card p-4 transition-all duration-300 ${
        prise.pris || justMarked
          ? 'border-success/30 opacity-70'
          : isLate
          ? 'border-destructive/40'
          : 'border-border'
      } ${justMarked ? 'animate-check-pop' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground truncate">{treatment.medicament}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{treatment.posologie}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="tabular-nums text-2xl font-bold text-foreground leading-none">
              {prise.heure}
            </span>
            {isLate && (
              <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                En retard
              </span>
            )}
          </div>
          {showAdherence && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Adhésion</span>
                <span className="tabular-nums font-semibold">{calculateAdherence(treatment)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${calculateAdherence(treatment)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {!prise.pris && !justMarked ? (
          <button
            onClick={handleMark}
            className="flex h-14 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
          >
            <Check className="h-5 w-5" />
            Je l'ai pris
          </button>
        ) : (
          <div className="flex h-14 items-center justify-center gap-2 rounded-xl bg-success/10 px-4 text-success font-semibold">
            <Check className="h-5 w-5" />
            Pris ✓
          </div>
        )}
      </div>
    </div>
  );
}
