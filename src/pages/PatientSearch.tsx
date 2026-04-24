import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Send, Check, Filter, X } from 'lucide-react';
import { getSession, getUsers } from '@/lib/auth';
import {
  getProfileFor,
  createAccessRequest,
  hasActiveDoctorAccess,
  getAccessRequests,
  enqueueAction,
  type PatientProfile,
} from '@/lib/storage';
import { toast } from '@/hooks/use-toast';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientSearch() {
  const navigate = useNavigate();
  const session = getSession();
  const [query, setQuery] = useState('');
  const [filterField, setFilterField] = useState<'all' | 'nom' | 'id'>('all');
  const [bloodFilter, setBloodFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tick, setTick] = useState(0);

  const patients = getUsers().filter(u => u.role === 'patient');
  const filtered = patients.filter(p => {
    const profile = getProfileFor(p.id);
    if (bloodFilter && profile?.groupeSanguin !== bloodFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (filterField === 'nom') {
      return p.nom.toLowerCase().includes(q) || p.prenom.toLowerCase().includes(q);
    }
    if (filterField === 'id') {
      return p.id.toLowerCase().includes(q);
    }
    return (
      p.email.toLowerCase().includes(q) ||
      p.nom.toLowerCase().includes(q) ||
      p.prenom.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const requestAccess = (patientUserId: string) => {
    if (!session) return;
    const payload = {
      patientUserId,
      medecinId: session.userId,
      medecinNom: `Dr. ${session.prenom} ${session.nom}`,
      medecinSpecialite: session.specialite || 'Médecin',
    };
    if (!navigator.onLine) {
      enqueueAction({ doctorId: session.userId, kind: 'access_request', payload });
      toast({
        title: 'Hors ligne',
        description: 'Demande mise en file d\'attente — envoyée dès le retour du réseau.',
      });
    } else {
      createAccessRequest(payload);
      toast({ title: 'Demande envoyée', description: 'Le patient sera notifié.' });
    }
    setTick(t => t + 1);
  };

  const requestStatusFor = (patientUserId: string) => {
    if (!session) return null;
    const reqs = getAccessRequests().filter(
      r => r.patientUserId === patientUserId && r.medecinId === session.userId,
    );
    if (reqs.length === 0) return null;
    return reqs[reqs.length - 1].status;
  };

  const renderPublicPreview = (profile: PatientProfile | null) => {
    if (!profile) return <span className="text-xs text-muted-foreground">Pas de profil renseigné</span>;
    const visible = profile.donneesPubliques || [];
    const items: string[] = [];
    if (visible.includes('groupeSanguin') && profile.groupeSanguin) items.push(`Groupe ${profile.groupeSanguin}`);
    if (visible.includes('allergies') && profile.allergies?.length) items.push(`${profile.allergies.length} allergie(s)`);
    if (visible.includes('maladiesChroniques') && profile.maladiesChroniques?.length) items.push(`${profile.maladiesChroniques.length} maladie(s) chronique(s)`);
    if (items.length === 0) return <span className="text-xs text-muted-foreground">Aucune donnée publique</span>;
    return <span className="text-xs text-muted-foreground">{items.join(' • ')}</span>;
  };

  const placeholder =
    filterField === 'nom' ? 'Nom ou prénom du patient'
    : filterField === 'id' ? 'Identifiant unique'
    : 'Email, nom, prénom ou ID';

  const activeFiltersCount = (bloodFilter ? 1 : 0) + (filterField !== 'all' ? 1 : 0);

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Rechercher un patient</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-5">Email, nom, ID ou groupe sanguin</p>

      <div className="relative animate-fade-up" style={{ animationDelay: '60ms' }}>
        <Search className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-border bg-card pl-11 pr-12 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
        />
        <button
          onClick={() => setShowFilters(s => !s)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg active:scale-[0.96] ${
            activeFiltersCount > 0 || showFilters ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
          aria-label="Filtres"
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 rounded-xl border-2 border-border bg-card p-3 space-y-3 animate-fade-up">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Champ recherché</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                { v: 'all', l: 'Tout' },
                { v: 'nom', l: 'Nom' },
                { v: 'id', l: 'ID patient' },
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setFilterField(opt.v)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    filterField === opt.v ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Groupe sanguin</p>
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_GROUPS.map(g => (
                <button
                  key={g || 'any'}
                  onClick={() => setBloodFilter(g)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    bloodFilter === g ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {g || 'Tous'}
                </button>
              ))}
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => { setBloodFilter(''); setFilterField('all'); }}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
            >
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>
      )}

      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucun patient trouvé</p>
          </div>
        ) : (
          filtered.map((p, i) => {
            const profile = getProfileFor(p.id);
            const status = requestStatusFor(p.id);
            const hasAccess = session ? hasActiveDoctorAccess(session.userId, p.id) : false;
            return (
              <div
                key={p.id}
                className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up"
                style={{ animationDelay: `${100 + i * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {p.prenom} {p.nom}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                    {profile?.groupeSanguin && (
                      <span className="inline-block mt-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                        {profile.groupeSanguin}
                      </span>
                    )}
                    <div className="mt-1.5">{renderPublicPreview(profile)}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  {hasAccess ? (
                    <button
                      onClick={() => navigate(`/medecin/patient/${p.id}`)}
                      className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.97]"
                    >
                      Ouvrir le dossier
                    </button>
                  ) : status === 'pending' ? (
                    <button disabled className="flex-1 rounded-lg border-2 border-warning/30 bg-warning/5 py-2.5 text-sm font-semibold text-warning">
                      Demande en attente…
                    </button>
                  ) : status === 'refused' ? (
                    <button
                      onClick={() => requestAccess(p.id)}
                      className="flex-1 rounded-lg border-2 border-border bg-card py-2.5 text-sm font-semibold text-foreground active:scale-[0.97]"
                    >
                      Refusée — Renvoyer
                    </button>
                  ) : (
                    <button
                      onClick={() => requestAccess(p.id)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground active:scale-[0.97]"
                    >
                      <Send className="h-4 w-4" />
                      Demander l'accès
                    </button>
                  )}
                  {status === 'completed' && (
                    <span className="flex items-center gap-1 rounded-lg border-2 border-success/30 bg-success/5 px-3 py-2.5 text-xs font-semibold text-success">
                      <Check className="h-3 w-3" /> Émise
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
