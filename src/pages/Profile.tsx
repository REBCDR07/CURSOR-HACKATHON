import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, X, Shield, FileDown, Share2 } from 'lucide-react';
import { getProfile, saveProfile, createDefaultProfile, getTreatments, type PatientProfile } from '@/lib/storage';
import { exportCarnetPDF } from '@/lib/exportPdf';
import { generateSMSText } from '@/lib/notifications';
import AccessRequests from '@/components/AccessRequests';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile>(createDefaultProfile());
  const [saved, setSaved] = useState(false);
  const [newAllergie, setNewAllergie] = useState('');
  const [newMaladie, setNewMaladie] = useState('');
  const [showShareLink, setShowShareLink] = useState(false);

  useEffect(() => {
    const p = getProfile();
    if (p) setProfile(p);
  }, []);

  const handleSave = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addAllergie = () => {
    if (newAllergie.trim()) {
      setProfile(p => ({ ...p, allergies: [...p.allergies, newAllergie.trim()] }));
      setNewAllergie('');
    }
  };

  const removeAllergie = (i: number) => {
    setProfile(p => ({ ...p, allergies: p.allergies.filter((_, idx) => idx !== i) }));
  };

  const addMaladie = () => {
    if (newMaladie.trim()) {
      setProfile(p => ({ ...p, maladiesChroniques: [...p.maladiesChroniques, newMaladie.trim()] }));
      setNewMaladie('');
    }
  };

  const removeMaladie = (i: number) => {
    setProfile(p => ({ ...p, maladiesChroniques: p.maladiesChroniques.filter((_, idx) => idx !== i) }));
  };

  const shareLink = `${window.location.origin}/partage/${profile.id}`;

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Mon Profil</h1>

      <div className="space-y-5">
        {/* Identité */}
        <section className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Identité
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">Pseudo</label>
              <input
                type="text"
                value={profile.pseudo}
                onChange={e => setProfile(p => ({ ...p, pseudo: e.target.value }))}
                placeholder="Anonyme par défaut"
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Âge</label>
                <input
                  type="number"
                  min={0}
                  max={150}
                  value={profile.age || ''}
                  onChange={e => setProfile(p => ({ ...p, age: e.target.value ? Number(e.target.value) : null }))}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Sexe</label>
                <select
                  value={profile.sexe}
                  onChange={e => setProfile(p => ({ ...p, sexe: e.target.value as 'M' | 'F' | '' }))}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1">Groupe sanguin</label>
              <select
                value={profile.groupeSanguin}
                onChange={e => setProfile(p => ({ ...p, groupeSanguin: e.target.value }))}
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
              >
                <option value="">—</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Informations médicales */}
        <section className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
          <h2 className="font-bold text-foreground mb-3">Informations médicales</h2>

          {/* Allergies */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Allergies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.allergies.map((a, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-sm text-destructive font-medium">
                  {a}
                  <button onClick={() => removeAllergie(i)} className="active:scale-[0.9]"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAllergie}
                onChange={e => setNewAllergie(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergie())}
                placeholder="Ajouter une allergie"
                className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button onClick={addAllergie} className="rounded-xl bg-muted px-3 py-2 text-muted-foreground active:scale-[0.96]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Électrophorèse */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Électrophorèse hémoglobine</label>
            <select
              value={profile.electrophorese}
              onChange={e => setProfile(p => ({ ...p, electrophorese: e.target.value }))}
              className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="">—</option>
              <option value="AA">AA (Normal)</option>
              <option value="AS">AS (Trait drépanocytaire)</option>
              <option value="SS">SS (Drépanocytose)</option>
              <option value="AC">AC</option>
              <option value="SC">SC</option>
              <option value="CC">CC</option>
            </select>
          </div>

          {/* Maladies chroniques */}
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Maladies chroniques</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.maladiesChroniques.map((m, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-warning/10 px-3 py-1 text-sm text-warning font-medium">
                  {m}
                  <button onClick={() => removeMaladie(i)} className="active:scale-[0.9]"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMaladie}
                onChange={e => setNewMaladie(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMaladie())}
                placeholder="Ex: Hypertension, Diabète..."
                className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button onClick={addMaladie} className="rounded-xl bg-muted px-3 py-2 text-muted-foreground active:scale-[0.96]">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Demandes d'accès */}
        <AccessRequests />

        {/* Actions */}
        <section className="space-y-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-lg transition-all active:scale-[0.96] ${
              saved ? 'bg-success text-success-foreground' : 'bg-primary text-primary-foreground'
            }`}
          >
            <Save className="h-5 w-5" />
            {saved ? 'Profil sauvegardé ✓' : 'Sauvegarder'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => exportCarnetPDF(profile, getTreatments())}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3 font-semibold text-foreground active:scale-[0.96]"
            >
              <FileDown className="h-4 w-4" /> Export PDF
            </button>
            <button
              onClick={() => {
                setShowShareLink(!showShareLink);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border bg-card py-3 font-semibold text-foreground active:scale-[0.96]"
            >
              <Share2 className="h-4 w-4" /> Partager
            </button>
          </div>

          {showShareLink && (
            <div className="rounded-2xl border-2 border-primary/20 bg-accent p-4 animate-scale-in">
              <p className="text-sm font-semibold text-foreground mb-2">Lien de partage temporaire</p>
              <p className="text-xs text-muted-foreground mb-2">Ce lien permet à un médecin de voir vos informations publiques.</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(shareLink)}
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.96]"
                >
                  Copier
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ID patient : <span className="font-mono font-semibold">{profile.id.substring(0, 8).toUpperCase()}</span>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
