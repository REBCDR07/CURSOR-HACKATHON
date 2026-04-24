import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Eye, EyeOff, ArrowLeft, User, Stethoscope } from 'lucide-react';
import { signup, signupDoctor, type UserRole } from '@/lib/auth';
import { saveProfile, createDefaultProfile } from '@/lib/storage';

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>('patient');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [numeroRPPS, setNumeroRPPS] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nom.trim() || !prenom.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (role === 'medecin' && (!specialite.trim() || !numeroRPPS.trim())) {
      setError('Spécialité et numéro RPPS requis pour un compte médecin.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      const result = role === 'patient'
        ? await signup(nom.trim(), prenom.trim(), email.trim(), password)
        : await signupDoctor(nom.trim(), prenom.trim(), email.trim(), password, specialite.trim(), numeroRPPS.trim());
      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'inscription.');
        setLoading(false);
        return;
      }
      if (role === 'patient') {
        const profile = createDefaultProfile();
        profile.pseudo = `${prenom} ${nom}`;
        saveProfile(profile);
        navigate('/dashboard');
      } else {
        navigate('/medecin');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-8 active:scale-[0.97]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>

        <div className="flex items-center gap-2.5 mb-8 animate-fade-in">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-2xl font-bold text-foreground">HealthPocket</span>
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-1">Créer un compte</h1>
        <p className="text-sm text-muted-foreground mb-6">Rejoignez HealthPocket BJ.</p>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-2xl bg-muted">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === 'patient' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('medecin')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              role === 'medecin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Médecin
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium mb-5 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Prénom</label>
              <input
                type="text"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="Kofi"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Nom</label>
              <input
                type="text"
                value={nom}
                onChange={e => setNom(e.target.value)}
                placeholder="Agossou"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="kofi@exemple.bj"
              className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {role === 'medecin' && (
            <>
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-foreground mb-1.5">Spécialité</label>
                <input
                  type="text"
                  value={specialite}
                  onChange={e => setSpecialite(e.target.value)}
                  placeholder="Médecine générale"
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-foreground mb-1.5">Numéro RPPS / ONMB</label>
                <input
                  type="text"
                  value={numeroRPPS}
                  onChange={e => setNumeroRPPS(e.target.value)}
                  placeholder="ONMB-123456"
                  className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-4 font-bold text-lg text-primary-foreground transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            {loading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Déjà un compte ?{' '}
          <Link to="/connexion" className="font-semibold text-primary">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
