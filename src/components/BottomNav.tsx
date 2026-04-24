import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Pill, Clock, User, Search, FileText, Stethoscope } from 'lucide-react';
import { getSession } from '@/lib/auth';

const patientTabs = [
  { path: '/dashboard', label: 'Accueil', icon: Home },
  { path: '/traitements', label: 'Traitements', icon: Pill },
  { path: '/historique', label: 'Historique', icon: Clock },
  { path: '/profil', label: 'Profil', icon: User },
];

const doctorTabs = [
  { path: '/medecin', label: 'Accueil', icon: Stethoscope },
  { path: '/medecin/recherche', label: 'Patients', icon: Search },
  { path: '/medecin/demandes', label: 'Demandes', icon: FileText },
  { path: '/medecin/profil', label: 'Profil', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const tabs = session?.role === 'medecin' ? doctorTabs : patientTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
      <div className="mx-auto flex max-w-[480px] items-center justify-around">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors active:scale-[0.96] ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
