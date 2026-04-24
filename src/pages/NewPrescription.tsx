import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, WifiOff } from 'lucide-react';
import { getSession, getUsers } from '@/lib/auth';
import {
  addTreatmentForPatient,
  hasActiveDoctorAccess,
  getAccessRequests,
  updateAccessRequest,
  generateId,
  enqueueAction,
  type Treatment,
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

const LAST_PRESCRIPTION_KEY = 'hp_doctor_last_prescription';

interface MedicLine {
  medicament: string;
  posologie: string;
  frequence: number;
  heures: string[];
  dureeJours: number;
}

const emptyLine = (): MedicLine => ({
  medicament: '',
  posologie: '',
  frequence: 1,
  heures: ['08:00'],
  dureeJours: 7,
});

export default function NewPrescription() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const session = getSession();
  const [meds, setMeds] = useState<MedicLine[]>([emptyLine()]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!session || !patientId) return <div className="p-5">Erreur</div>;

  const patient = getUsers().find(u => u.id === patientId);
  const access = hasActiveDoctorAccess(session.userId, patientId);

  if (!access && !submitted) {
    return (
      <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <p className="text-destructive">Accès au dossier non autorisé.</p>
      </div>
    );
  }

  const updateMed = (i: number, patch: Partial<MedicLine>) => {
    setMeds(prev => prev.map((m, idx) => idx === i ? { ...m, ...patch } : m));
  };

  const updateFrequence = (i: number, freq: number) => {
    const defaultHeures = ['08:00', '14:00', '20:00', '22:00'].slice(0, freq);
    updateMed(i, { frequence: freq, heures: defaultHeures });
  };

  const updateHeure = (i: number, hi: number, value: string) => {
    setMeds(prev => prev.map((m, idx) => {
      if (idx !== i) return m;
      const heures = [...m.heures];
      heures[hi] = value;
      return { ...m, heures };
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = meds.every(m => m.medicament.trim() && m.posologie.trim() && m.dureeJours > 0);
    if (!valid) return;

    const today = new Date().toISOString().split('T')[0];
    const treatments: Treatment[] = meds.map(m => ({
      id: generateId(),
      medicament: m.medicament.trim(),
      posologie: m.posologie.trim(),
      frequence: m.frequence,
      heures: m.heures,
      dureeJours: m.dureeJours,
      dateDebut: today,
      notes: notes.trim(),
      ordonnanceBase64: '',
      prises: [],
      actif: true,
      createdAt: new Date().toISOString(),
      medecinId: session.userId,
    }));

    // Always store the last prescription locally so the doctor can re-export it.
    localStorage.setItem(
      LAST_PRESCRIPTION_KEY,
      JSON.stringify({
        doctorId: session.userId,
        patientUserId: patientId,
        patientName: `${patient?.prenom ?? ''} ${patient?.nom ?? ''}`.trim(),
        date: new Date().toISOString(),
        notes: notes.trim(),
        treatments,
      }),
    );

    if (!navigator.onLine) {
      enqueueAction({
        doctorId: session.userId,
        kind: 'prescription',
        payload: { patientUserId: patientId, treatments },
      });
      toast({
        title: 'Hors ligne',
        description: 'L\'ordonnance sera transmise dès le retour du réseau.',
      });
      setSubmitted(true);
      return;
    }

    for (const t of treatments) addTreatmentForPatient(patientId, t);

    getAccessRequests()
      .filter(r => r.medecinId === session.userId && r.patientUserId === patientId && r.status === 'accepted')
      .forEach(r => updateAccessRequest(r.id, { status: 'completed', resolvedAt: new Date().toISOString() }));

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto flex flex-col items-center justify-center min-h-screen">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4 animate-fade-in">
          <Check className="h-8 w-8 text-success" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground text-center">Ordonnance émise</h1>
        <p className="text-sm text-muted-foreground text-center mt-2 max-w-xs">
          Les traitements ont été ajoutés au carnet de {patient?.prenom} {patient?.nom}.
          Votre accès au dossier a été révoqué automatiquement.
        </p>
        <button
          onClick={() => navigate('/medecin')}
          className="mt-8 w-full max-w-xs rounded-xl bg-primary py-4 font-semibold text-primary-foreground active:scale-[0.97]"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Nouvelle ordonnance</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Pour <span className="font-semibold text-foreground">{patient?.prenom} {patient?.nom}</span>
      </p>

      {!navigator.onLine && (
        <div className="mt-4 rounded-xl border-2 border-warning/30 bg-warning/5 p-3 flex items-center gap-2 animate-fade-up">
          <WifiOff className="h-4 w-4 text-warning flex-shrink-0" />
          <p className="text-xs text-foreground">
            Hors ligne — l'ordonnance sera mise en file d'attente et envoyée dès le retour du réseau.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {meds.map((m, i) => (
          <div key={i} className="rounded-2xl border-2 border-border bg-card p-4 space-y-3 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-primary uppercase tracking-wide">Médicament {i + 1}</p>
              {meds.length > 1 && (
                <button type="button" onClick={() => setMeds(prev => prev.filter((_, idx) => idx !== i))} className="text-destructive p-1 active:scale-[0.96]">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <input
              value={m.medicament}
              onChange={e => updateMed(i, { medicament: e.target.value })}
              placeholder="Nom du médicament (ex. Coartem)"
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <input
              value={m.posologie}
              onChange={e => updateMed(i, { posologie: e.target.value })}
              placeholder="Posologie (ex. 1 comprimé / 500mg)"
              className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Fréquence/jour</label>
                <select
                  value={m.frequence}
                  onChange={e => updateFrequence(i, Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}x</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Durée (jours)</label>
                <input
                  type="number"
                  min={1}
                  value={m.dureeJours}
                  onChange={e => updateMed(i, { dureeJours: Number(e.target.value) })}
                  className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Heures de prise</label>
              <div className="flex flex-wrap gap-2">
                {m.heures.map((h, hi) => (
                  <input
                    key={hi}
                    type="time"
                    value={h}
                    onChange={e => updateHeure(i, hi, e.target.value)}
                    className="rounded-xl border-2 border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setMeds(prev => [...prev, emptyLine()])}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted-foreground active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Ajouter un médicament
        </button>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Instructions spéciales</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ex. Prendre avec un repas, éviter le soleil…"
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground transition-transform active:scale-[0.97]"
        >
          Émettre l'ordonnance
        </button>
        <p className="text-xs text-center text-muted-foreground">
          Votre accès au dossier sera révoqué automatiquement.
        </p>
      </form>
    </div>
  );
}
