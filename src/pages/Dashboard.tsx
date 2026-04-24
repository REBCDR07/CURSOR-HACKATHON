import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileDown, Bell, LogOut, TrendingUp, Calendar, Pill, Activity, Activity as ActivityIcon, QrCode } from 'lucide-react';
import { getProfile, getTodayPrises, getTreatments, calculateAdherence, type PatientProfile, type Treatment, type PriseRecord } from '@/lib/storage';
import { requestNotificationPermission, startReminderCheck } from '@/lib/notifications';
import { exportCarnetPDF } from '@/lib/exportPdf';
import { getSession, logout } from '@/lib/auth';
import TreatmentCard from '@/components/TreatmentCard';
import AccessRequests from '@/components/AccessRequests';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [todayPrises, setTodayPrises] = useState<{ treatment: Treatment; prise: PriseRecord }[]>([]);
  const [globalAdherence, setGlobalAdherence] = useState(100);
  const [tick, setTick] = useState(0);
  const session = getSession();

  const reload = () => setTick(t => t + 1);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);

    const tp = getTodayPrises();
    setTodayPrises(tp);

    const treatments = getTreatments().filter(t => t.actif);
    if (treatments.length > 0) {
      const avg = Math.round(treatments.reduce((s, t) => s + calculateAdherence(t), 0) / treatments.length);
      setGlobalAdherence(avg);
    }

    requestNotificationPermission().then(() => startReminderCheck());
  }, [tick]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const activeTreatments = getTreatments().filter(t => t.actif);
  const allTreatments = getTreatments();
  const completedTreatments = allTreatments.filter(t => !t.actif);
  const todayTaken = todayPrises.filter(p => p.prise.pris).length;
  const todayTotal = todayPrises.length;

  // Build weekly adherence data for chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });

    let taken = 0, total = 0;
    for (const t of activeTreatments) {
      for (const h of t.heures) {
        total++;
        const prise = t.prises.find(p => p.date === dateStr && p.heure === h);
        if (prise?.pris) taken++;
      }
    }
    return { day: dayName, adherence: total > 0 ? Math.round((taken / total) * 100) : 0 };
  });

  // Treatment distribution for pie chart
  const treatmentsByFreq = [
    { name: '1x/jour', value: activeTreatments.filter(t => t.frequence === 1).length, color: 'hsl(153, 42%, 18%)' },
    { name: '2x/jour', value: activeTreatments.filter(t => t.frequence === 2).length, color: 'hsl(37, 90%, 43%)' },
    { name: '3x+/jour', value: activeTreatments.filter(t => t.frequence >= 3).length, color: 'hsl(160, 84%, 30%)' },
  ].filter(d => d.value > 0);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const displayName = session ? `${session.prenom}` : profile?.pseudo || 'Patient';

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{greeting()},</p>
          <h1 className="font-heading text-2xl font-bold text-foreground leading-tight mt-0.5">
            {displayName}
          </h1>
          {profile?.age && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile.age} ans{profile.groupeSanguin ? ` • ${profile.groupeSanguin}` : ''}
            </p>
          )}
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl text-muted-foreground hover:bg-muted active:scale-[0.96]" title="Déconnexion">
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Metrics grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '80ms' }}>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{globalAdherence}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Adhésion globale</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <Pill className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{todayTaken}/{todayTotal}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Prises aujourd'hui</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-warning" />
            </div>
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{activeTreatments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Traitements actifs</p>
        </div>
        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
              <Calendar className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
          <p className="tabular-nums text-3xl font-bold font-heading text-foreground">{completedTreatments.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Traitements terminés</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-5 grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '120ms' }}>
        <button
          onClick={() => navigate('/activite')}
          className="rounded-2xl border-2 border-border bg-card p-3 flex items-center gap-2 active:scale-[0.97]"
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ActivityIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-foreground">Journal</p>
            <p className="text-[11px] text-muted-foreground">Activité médecin</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/partage')}
          className="rounded-2xl border-2 border-border bg-card p-3 flex items-center gap-2 active:scale-[0.97]"
        >
          <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-warning" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-foreground">QR partage</p>
            <p className="text-[11px] text-muted-foreground">Lien 24h</p>
          </div>
        </button>
      </div>

      {/* Access requests from doctors */}
      <div className="mt-6">
        <AccessRequests />
      </div>


      {activeTreatments.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '160ms' }}>
          <h2 className="font-heading text-base font-bold text-foreground mb-3">Adhésion cette semaine</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(153, 42%, 18%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(153, 42%, 18%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(215, 14%, 34%)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(215, 14%, 34%)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '2px solid hsl(220, 13%, 91%)', fontSize: '13px' }}
                  formatter={(value: number) => [`${value}%`, 'Adhésion']}
                />
                <Area type="monotone" dataKey="adherence" stroke="hsl(153, 42%, 18%)" strokeWidth={2} fill="url(#adherenceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Treatment distribution */}
      {treatmentsByFreq.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <h2 className="font-heading text-base font-bold text-foreground mb-3">Répartition des traitements</h2>
          <div className="flex items-center gap-4">
            <div className="h-28 w-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={treatmentsByFreq} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45} strokeWidth={0}>
                    {treatmentsByFreq.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {treatmentsByFreq.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold text-foreground tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's prises */}
      <div className="mt-8 animate-fade-up" style={{ animationDelay: '300ms' }}>
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Aujourd'hui</h2>
        {todayPrises.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucun traitement prévu aujourd'hui</p>
            <button onClick={() => navigate('/traitements/ajouter')} className="mt-3 text-sm font-semibold text-primary">
              Ajouter un traitement →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayPrises.map(({ treatment, prise }, i) => (
              <div key={`${treatment.id}-${prise.heure}`} className="animate-fade-up" style={{ animationDelay: `${350 + i * 80}ms` }}>
                <TreatmentCard treatment={treatment} prise={prise} onUpdate={reload} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex gap-3 animate-fade-up" style={{ animationDelay: '400ms' }}>
        <button
          onClick={() => navigate('/traitements/ajouter')}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground transition-transform active:scale-[0.96]"
        >
          <Plus className="h-5 w-5" />
          Ajouter
        </button>
        <button
          onClick={() => { if (profile) exportCarnetPDF(profile, getTreatments()); }}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-5 py-4 font-semibold text-foreground transition-transform active:scale-[0.96]"
        >
          <FileDown className="h-5 w-5" />
          PDF
        </button>
        <button
          onClick={() => requestNotificationPermission()}
          className="flex items-center justify-center rounded-xl border-2 border-border bg-card px-4 py-4 text-foreground transition-transform active:scale-[0.96]"
        >
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
