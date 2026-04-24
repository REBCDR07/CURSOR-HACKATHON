import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Camera } from 'lucide-react';
import { addTreatment, generateId, type Treatment } from '@/lib/storage';

export default function AddTreatment() {
  const navigate = useNavigate();
  const [medicament, setMedicament] = useState('');
  const [posologie, setPosologie] = useState('');
  const [frequence, setFrequence] = useState(1);
  const [heures, setHeures] = useState<string[]>(['08:00']);
  const [dureeJours, setDureeJours] = useState(7);
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [ordonnanceBase64, setOrdonnanceBase64] = useState('');

  const addHeure = () => {
    if (heures.length < 6) setHeures([...heures, '12:00']);
  };
  const removeHeure = (i: number) => {
    setHeures(heures.filter((_, idx) => idx !== i));
  };
  const updateHeure = (i: number, val: string) => {
    const h = [...heures];
    h[i] = val;
    setHeures(h);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOrdonnanceBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicament.trim()) return;

    const treatment: Treatment = {
      id: generateId(),
      medicament: medicament.trim(),
      posologie: posologie.trim(),
      frequence,
      heures,
      dureeJours,
      dateDebut,
      notes: notes.trim(),
      ordonnanceBase64,
      prises: [],
      actif: true,
      createdAt: new Date().toISOString(),
    };

    addTreatment(treatment);
    navigate('/');
  };

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.96]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">Nouveau traitement</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Médicament */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Médicament *</label>
          <input
            type="text"
            value={medicament}
            onChange={e => setMedicament(e.target.value)}
            placeholder="Ex: Coartem, Metformine..."
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Posologie */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Posologie</label>
          <input
            type="text"
            value={posologie}
            onChange={e => setPosologie(e.target.value)}
            placeholder="Ex: 500mg, 2 comprimés..."
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Fréquence */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Fréquence (prises/jour)</label>
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setFrequence(n);
                  setHeures(prev => {
                    if (n > prev.length) return [...prev, ...Array(n - prev.length).fill('12:00')];
                    return prev.slice(0, n);
                  });
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold transition-all active:scale-[0.96] ${
                  frequence === n ? 'bg-primary text-primary-foreground' : 'border-2 border-border bg-card text-foreground'
                }`}
              >
                {n}x
              </button>
            ))}
          </div>
        </div>

        {/* Heures */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Heures de prise</label>
          <div className="space-y-2">
            {heures.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={h}
                  onChange={e => updateHeure(i, e.target.value)}
                  className="flex-1 rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
                {heures.length > 1 && (
                  <button type="button" onClick={() => removeHeure(i)} className="p-2 text-muted-foreground active:scale-[0.96]">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            {heures.length < 6 && (
              <button type="button" onClick={addHeure} className="flex items-center gap-1 text-sm font-semibold text-primary active:scale-[0.96]">
                <Plus className="h-4 w-4" /> Ajouter une heure
              </button>
            )}
          </div>
        </div>

        {/* Durée */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-1.5">Durée (jours)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={dureeJours}
              onChange={e => setDureeJours(Number(e.target.value))}
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-1.5">Date de début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={e => setDateDebut(e.target.value)}
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Effets secondaires, instructions spéciales..."
            rows={3}
            className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Photo ordonnance */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Photo d'ordonnance</label>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-4 py-4 text-muted-foreground transition-colors hover:border-primary active:scale-[0.98]">
            <Camera className="h-5 w-5" />
            <span className="text-sm font-medium">
              {ordonnanceBase64 ? 'Photo ajoutée ✓' : 'Prendre une photo ou choisir un fichier'}
            </span>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
          {ordonnanceBase64 && (
            <img src={ordonnanceBase64} alt="Ordonnance" className="mt-2 rounded-xl max-h-40 object-cover" />
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground text-lg transition-transform active:scale-[0.96]"
        >
          Enregistrer le traitement
        </button>
      </form>
    </div>
  );
}
