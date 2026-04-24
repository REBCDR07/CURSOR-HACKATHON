import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Lock, Clock, Eye, AlertCircle, Pill, Activity, Calendar, ShieldCheck,
} from 'lucide-react';
import { getSession, getUsers } from '@/lib/auth';
import {
  validateQRTokenForDoctor,
  getProfileFor,
  getTreatmentsFor,
  calculateAdherence,
  logActivitySafe,
  type QRValidation,
} from '@/lib/storage';

/**
 * Doctor-side shared-record viewer.
 *
 * Flow:
 *   1. Validate the QR token (404 / expired / revoked → blocking screen).
 *   2. Resolve the patient and render their record in **read-only** mode.
 *   3. Log a `record_viewed` audit entry to the patient's activity feed.
 *
 * The read-only viewer intentionally omits all action buttons (no
 * prescription, no treatment edit) — QR shares are for one-shot consultation
 * lookups, not write operations.
 */
export default function SharedRecord() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const session = getSession();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, []);

  const validation: QRValidation = useMemo(
    () => token ? validateQRTokenForDoctor(token) : { ok: false, reason: 'not_found' },
    [token, now],
  );

  // Audit-log a single view per token+session
  useEffect(() => {
    if (!session || session.role !== 'medecin') return;
    if (!validation.ok) return;
    const auditKey = `hp_qr_audit_${token}_${session.userId}`;
    if (sessionStorage.getItem(auditKey)) return;
    sessionStorage.setItem(auditKey, '1');
    logActivitySafe(session.userId, {
      patientUserId: validation.patientUserId,
      type: 'record_viewed',
      medecinId: session.userId,
      medecinNom: `Dr. ${session.prenom} ${session.nom}`,
      medecinSpecialite: session.specialite,
      details: 'Consultation via QR code partagé',
    });
  }, [validation, session, token]);

  // Auth gate: only logged-in doctors may use this URL.
  if (!session) {
    return (
      <div className="pb-24 px-5 pt-10 max-w-[480px] mx-auto">
        <div className="rounded-2xl border-2 border-warning/30 bg-warning/5 p-6 text-center">
          <Lock className="h-8 w-8 text-warning mx-auto mb-3" />
          <p className="font-semibold text-foreground">Connexion requise</p>
          <p className="text-sm text-muted-foreground mt-1">
            Connecte-toi à ton compte médecin pour ouvrir ce dossier partagé.
          </p>
          <button
            onClick={() => navigate('/connexion')}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.96]"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (session.role !== 'medecin') {
    return (
      <div className="pb-24 px-5 pt-10 max-w-[480px] mx-auto">
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
          <Lock className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="font-semibold text-foreground">Réservé aux professionnels</p>
          <p className="text-sm text-muted-foreground mt-1">
            Les liens QR ne peuvent être ouverts que depuis un compte médecin.
          </p>
        </div>
      </div>
    );
  }

  if (validation.ok === false) {
    const msg =
      validation.reason === 'expired' ? 'Ce QR code a expiré (24h).'
      : validation.reason === 'revoked' ? 'Ce QR code a été révoqué par le patient.'
      : 'QR code introuvable ou invalide.';
    return (
      <div className="pb-24 px-5 pt-10 max-w-[480px] mx-auto">
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
          <Lock className="h-8 w-8 text-destructive mx-auto mb-3" />
          <p className="font-semibold text-foreground">Accès refusé</p>
          <p className="text-sm text-muted-foreground mt-1">{msg}</p>
          <button
            onClick={() => navigate('/medecin')}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.96]"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const patient = getUsers().find(u => u.id === validation.patientUserId);
  const profile = getProfileFor(validation.patientUserId);
  const treatments = getTreatmentsFor(validation.patientUserId);
  const active = treatments.filter(t => t.actif);
  const completed = treatments.filter(t => !t.actif);
  const avgAdherence = active.length > 0
    ? Math.round(active.reduce((s, t) => s + calculateAdherence(t), 0) / active.length)
    : 0;

  // Countdown
  const msLeft = new Date(validation.expiresAt).getTime() - now;
  const hLeft = Math.floor(msLeft / 3_600_000);
  const mLeft = Math.floor((msLeft % 3_600_000) / 60_000);

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate('/medecin')} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Tableau de bord
      </button>

      {/* Read-only banner */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 flex items-center gap-3 animate-fade-in">
        <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary">Accès partagé — lecture seule</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3" />
            Expire dans {hLeft}h {mLeft}min
          </p>
        </div>
        <Eye className="h-5 w-5 text-primary flex-shrink-0" />
      </div>

      {/* Patient header */}
      <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '60ms' }}>
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Dossier partagé</p>
        <h1 className="font-heading text-2xl font-bold text-foreground mt-1">
          {patient ? `${patient.prenom} ${patient.nom}` : 'Patient'}
        </h1>
        {patient && <p className="text-sm text-muted-foreground">{patient.email}</p>}
        {profile && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {profile.age && <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">{profile.age} ans</span>}
            {profile.sexe && <span className="rounded-full bg-muted px-2.5 py-1 text-foreground">{profile.sexe === 'M' ? 'Homme' : 'Femme'}</span>}
            {profile.groupeSanguin && <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-destructive font-semibold">{profile.groupeSanguin}</span>}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-3 gap-2 animate-fade-up" style={{ animationDelay: '120ms' }}>
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
        <div className="mt-4 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
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

      {profile?.maladiesChroniques && profile.maladiesChroniques.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-bold text-sm text-foreground mb-2">Maladies chroniques</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.maladiesChroniques.map((m, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">{m}</span>
            ))}
          </div>
        </div>
      )}

      {profile?.electrophorese && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <h3 className="font-bold text-sm text-foreground mb-1">Électrophorèse Hb</h3>
          <p className="text-sm text-muted-foreground">{profile.electrophorese}</p>
        </div>
      )}

      {/* Treatments */}
      <div className="mt-6 animate-fade-up" style={{ animationDelay: '280ms' }}>
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

      {completed.length > 0 && (
        <div className="mt-6 animate-fade-up" style={{ animationDelay: '320ms' }}>
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

      <p className="text-xs text-center text-muted-foreground mt-6">
        Lecture seule — aucune modification possible via ce lien partagé.
      </p>
    </div>
  );
}
