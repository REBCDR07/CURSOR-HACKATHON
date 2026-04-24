import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Pill, Activity, AlertCircle, Lock, Calendar, Download } from 'lucide-react';
import { getSession, getUsers } from '@/lib/auth';
import {
  getProfileFor,
  getTreatmentsFor,
  hasActiveDoctorAccess,
  calculateAdherence,
  type Treatment,
} from '@/lib/storage';
import { exportPrescriptionPDF } from '@/lib/exportPrescription';

const LAST_PRESCRIPTION_KEY = 'hp_doctor_last_prescription';

export default function PatientRecord() {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const session = getSession();

  if (!session || !patientId) {
    return <div className="p-5">Patient introuvable.</div>;
  }

  const patient = getUsers().find(u => u.id === patientId);
  const access = hasActiveDoctorAccess(session.userId, patientId);

  if (!access) {
    return (
      <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-6 active:scale-[0.97]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="rounded-2xl border-2 border-warning/30 bg-warning/5 p-6 text-center">
          <Lock className="h-8 w-8 text-warning mx-auto mb-3" />
          <p className="font-semibold text-foreground">Accès non autorisé</p>
          <p className="text-sm text-muted-foreground mt-1">Le patient n'a pas (encore) accepté votre demande.</p>
        </div>
      </div>
    );
  }

  const profile = getProfileFor(patientId);
  const treatments = getTreatmentsFor(patientId);
  const active = treatments.filter(t => t.actif);
  const completed = treatments.filter(t => !t.actif);
  const avgAdherence = active.length > 0
    ? Math.round(active.reduce((s, t) => s + calculateAdherence(t), 0) / active.length)
    : 0;

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate('/medecin/recherche')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      {/* Patient header */}
      <div className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-in">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Dossier patient</p>
        <h1 className="font-heading text-2xl font-bold text-foreground mt-1">
          {patient?.prenom} {patient?.nom}
        </h1>
        <p className="text-sm text-muted-foreground">{patient?.email}</p>
        {profile && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {profile.age && <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">{profile.age} ans</span>}
            {profile.sexe && <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">{profile.sexe === 'M' ? 'Homme' : 'Femme'}</span>}
            {profile.groupeSanguin && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive font-semibold">{profile.groupeSanguin}</span>}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="rounded-xl border-2 border-border bg-card p-3 text-center">
          <Activity className="h-4 w-4 text-primary mx-auto mb-1" />
          <p className="tabular-nums text-xl font-bold font-heading text-foreground">{avgAdherence}%</p>
          <p className="text-[10px] text-muted-foreground">Adhésion</p>
        </div>
        <div className="rounded-xl border-2 border-border bg-card p-3 text-center">
          <Pill className="h-4 w-4 text-success mx-auto mb-1" />
          <p className="tabular-nums text-xl font-bold font-heading text-foreground">{active.length}</p>
          <p className="text-[10px] text-muted-foreground">Actifs</p>
        </div>
        <div className="rounded-xl border-2 border-border bg-card p-3 text-center">
          <Calendar className="h-4 w-4 text-warning mx-auto mb-1" />
          <p className="tabular-nums text-xl font-bold font-heading text-foreground">{completed.length}</p>
          <p className="text-[10px] text-muted-foreground">Terminés</p>
        </div>
      </div>

      {/* Allergies */}
      {profile?.allergies && profile.allergies.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <h3 className="font-bold text-sm text-destructive">Allergies</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.allergies.map((a, i) => (
              <span key={i} className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Chronic conditions */}
      {profile?.maladiesChroniques && profile.maladiesChroniques.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-bold text-sm text-foreground mb-2">Maladies chroniques</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.maladiesChroniques.map((m, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">{m}</span>
            ))}
          </div>
        </div>
      )}

      {profile?.electrophorese && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-bold text-sm text-foreground mb-1">Électrophorèse Hb</h3>
          <p className="text-sm text-muted-foreground">{profile.electrophorese}</p>
        </div>
      )}

      {/* Active treatments */}
      <div className="mt-6 animate-fade-up" style={{ animationDelay: '240ms' }}>
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Traitements en cours</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun traitement actif</p>
        ) : (
          <div className="space-y-2">
            {active.map(t => (
              <div key={t.id} className="rounded-xl border-2 border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{t.medicament}</p>
                    <p className="text-xs text-muted-foreground">{t.posologie} • {t.frequence}x/jour • {t.dureeJours}j</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Heures : {t.heures.join(', ')}</p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success flex-shrink-0">
                    {calculateAdherence(t)}%
                  </span>
                </div>
                {t.notes && <p className="text-xs text-muted-foreground italic mt-1.5">"{t.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed treatments */}
      {completed.length > 0 && (
        <div className="mt-6 animate-fade-up" style={{ animationDelay: '280ms' }}>
          <h2 className="font-heading text-base font-bold text-foreground mb-2">Historique ({completed.length})</h2>
          <div className="space-y-1.5">
            {completed.slice(-5).reverse().map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{t.medicament}</p>
                  <p className="text-xs text-muted-foreground">{t.posologie}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{calculateAdherence(t)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last prescription export */}
      {(() => {
        try {
          const raw = localStorage.getItem(LAST_PRESCRIPTION_KEY);
          if (!raw) return null;
          const last = JSON.parse(raw) as { doctorId: string; patientUserId: string; patientName: string; date: string; notes: string; treatments: Treatment[] };
          if (last.doctorId !== session.userId || last.patientUserId !== patientId) return null;
          return (
            <button
              onClick={() => exportPrescriptionPDF({
                doctorName: `Dr. ${session.prenom} ${session.nom}`,
                doctorSpecialite: session.specialite,
                patientName: last.patientName,
                date: last.date,
                notes: last.notes,
                treatments: last.treatments,
                doctorId: session.userId,
                patientUserId: patientId,
              })}
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 py-3.5 text-sm font-semibold text-primary active:scale-[0.97] animate-fade-up"
              style={{ animationDelay: '300ms' }}
            >
              <Download className="h-4 w-4" />
              Exporter dernière ordonnance (PDF)
            </button>
          );
        } catch { return null; }
      })()}

      {/* CTA */}
      <button
        onClick={() => navigate(`/medecin/patient/${patientId}/ordonnance`)}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.97] animate-fade-up"
        style={{ animationDelay: '320ms' }}
      >
        <FileText className="h-5 w-5" />
        Rédiger une ordonnance
      </button>
      <p className="text-xs text-center text-muted-foreground mt-2">
        Votre accès sera révoqué automatiquement après émission
      </p>
    </div>
  );
}
