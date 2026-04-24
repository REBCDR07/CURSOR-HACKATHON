import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Search, Users, FileText, LogOut, CheckCircle2, Clock, XCircle, Download, WifiOff, CloudUpload } from 'lucide-react';
import { getSession, logout, getUsers } from '@/lib/auth';
import { getDoctorAccessRequests, getDoctorPendingActions, flushPendingActions, type AccessRequest, type PendingAction, type Treatment } from '@/lib/storage';
import { exportPrescriptionPDF } from '@/lib/exportPrescription';
import { toast } from '@/hooks/use-toast';

const LAST_PRESCRIPTION_KEY = 'hp_doctor_last_prescription';

interface LastPrescription {
  doctorId: string;
  patientUserId: string;
  patientName: string;
  date: string;
  notes: string;
  treatments: Treatment[];
}

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [lastPrescription, setLastPrescription] = useState<LastPrescription | null>(null);

  const reload = () => {
    if (!session) return;
    setRequests(getDoctorAccessRequests(session.userId));
    setPending(getDoctorPendingActions(session.userId));
    const raw = localStorage.getItem(LAST_PRESCRIPTION_KEY);
    if (raw) {
      try {
        const p = JSON.parse(raw) as LastPrescription;
        if (p.doctorId === session.userId) setLastPrescription(p);
      } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    reload();
    const onOnline = () => { setOnline(true); reload(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const i = setInterval(reload, 4000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(i);
    };
  }, [session]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const totalPatients = getUsers().filter(u => u.role === 'patient').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const accepted = requests.filter(r => r.status === 'accepted').length;
  const completed = requests.filter(r => r.status === 'completed').length;

  const handleSync = () => {
    if (!session) return;
    if (!navigator.onLine) {
      toast({ title: 'Toujours hors ligne', description: 'Connecte-toi à internet pour synchroniser.' });
      return;
    }
    const n = flushPendingActions(session.userId);
    toast({ title: n > 0 ? 'Synchronisé' : 'Rien à envoyer', description: `${n} action(s) traitée(s).` });
    reload();
  };

  const handleExportLast = () => {
    if (!lastPrescription || !session) return;
    exportPrescriptionPDF({
      doctorName: `Dr. ${session.prenom} ${session.nom}`,
      doctorSpecialite: session.specialite,
      patientName: lastPrescription.patientName,
      date: lastPrescription.date,
      notes: lastPrescription.notes,
      treatments: lastPrescription.treatments,
      doctorId: session.userId,
      patientUserId: lastPrescription.patientUserId,
    });
  };

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="text-muted-foreground text-sm font-medium flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> Espace médecin
          </p>
          <h1 className="font-heading text-2xl font-bold text-foreground leading-tight mt-0.5">
            Dr. {session?.prenom} {session?.nom}
          </h1>
          {session?.specialite && (
            <p className="text-sm text-muted-foreground mt-0.5">{session.specialite}</p>
          )}
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl text-muted-foreground hover:bg-muted active:scale-[0.96]" title="Déconnexion">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{totalPatients}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Patients sur la plateforme</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Demandes en attente</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{accepted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Accès actifs</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center mb-2">
            <FileText className="h-4 w-4 text-accent-foreground" />
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{completed}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ordonnances émises</p>
        </div>
      </div>

      {/* Offline / queue banner */}
      {(!online || pending.length > 0) && (
        <div className={`mt-6 rounded-2xl border-2 p-4 animate-fade-up flex items-center justify-between gap-3 ${
          !online ? 'border-warning/30 bg-warning/5' : 'border-primary/30 bg-primary/5'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            {!online ? <WifiOff className="h-4 w-4 text-warning flex-shrink-0" /> : <CloudUpload className="h-4 w-4 text-primary flex-shrink-0" />}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {!online ? 'Mode hors ligne' : 'Synchronisation en attente'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pending.length > 0
                  ? `${pending.length} action(s) en file d'attente`
                  : 'Les actions seront envoyées au retour du réseau.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/medecin/file-attente')}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.96] flex-shrink-0"
          >
            Voir la file
          </button>
        </div>
      )}

      {/* Always-on link to the queue, even when empty (small chip) */}
      {online && pending.length === 0 && (
        <button
          onClick={() => navigate('/medecin/file-attente')}
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-2"
        >
          <CloudUpload className="h-3.5 w-3.5" /> File d'attente synchronisée
        </button>
      )}

      {/* Primary action */}
      <button
        onClick={() => navigate('/medecin/recherche')}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97] animate-fade-up"
        style={{ animationDelay: '160ms' }}
      >
        <Search className="h-5 w-5" />
        Rechercher un patient
      </button>

      {/* Last prescription export */}
      {lastPrescription && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <p className="text-xs font-bold text-primary uppercase tracking-wide">Dernière ordonnance</p>
          <p className="font-semibold text-foreground mt-1">{lastPrescription.patientName || 'Patient'}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(lastPrescription.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            {' • '}{lastPrescription.treatments.length} médicament(s)
          </p>
          <button
            onClick={handleExportLast}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 py-2.5 text-sm font-semibold text-primary active:scale-[0.97]"
          >
            <Download className="h-4 w-4" />
            Exporter en PDF
          </button>
        </div>
      )}

      {/* Recent requests */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Activité récente</h2>
        {requests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucune demande pour l'instant</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.slice(-6).reverse().map(r => {
              const Icon = r.status === 'pending' ? Clock
                : r.status === 'accepted' ? CheckCircle2
                : r.status === 'completed' ? FileText
                : XCircle;
              const tone = r.status === 'pending' ? 'text-warning'
                : r.status === 'accepted' ? 'text-success'
                : r.status === 'completed' ? 'text-primary'
                : 'text-destructive';
              const label = r.status === 'pending' ? 'En attente'
                : r.status === 'accepted' ? 'Acceptée — accès actif'
                : r.status === 'completed' ? 'Ordonnance émise'
                : r.status === 'refused' ? 'Refusée' : 'Révoquée';
              return (
                <div key={r.id} className="flex items-center justify-between rounded-xl border-2 border-border bg-card p-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${tone}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Patient #{r.patientUserId.slice(0, 6)}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                  {r.status === 'accepted' && (
                    <button
                      onClick={() => navigate(`/medecin/patient/${r.patientUserId}`)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground active:scale-[0.96]"
                    >
                      Ouvrir
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
