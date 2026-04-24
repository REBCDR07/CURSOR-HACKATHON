import { useNavigate } from 'react-router-dom';
import { LogOut, Stethoscope, Mail, BadgeCheck } from 'lucide-react';
import { getSession, logout } from '@/lib/auth';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!session) return null;

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Mon profil</h1>

      <div className="mt-6 rounded-2xl border-2 border-border bg-card p-5 animate-fade-up">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Stethoscope className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">
          Dr. {session.prenom} {session.nom}
        </h2>
        {session.specialite && (
          <p className="text-sm text-muted-foreground mt-0.5">{session.specialite}</p>
        )}

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{session.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Compte médecin vérifié</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-destructive/30 bg-destructive/5 py-3.5 text-sm font-semibold text-destructive active:scale-[0.97]"
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>
    </div>
  );
}
