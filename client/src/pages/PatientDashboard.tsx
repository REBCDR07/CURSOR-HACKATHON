import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import AccessRequestCard from "@/components/AccessRequestCard";
import PrescriptionCard from "@/components/PrescriptionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Pill, TrendingUp, Bell, FileText, Clock, Plus, Download, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportPatientPDF } from "@/lib/exportPdf";
import { toast } from "sonner";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { accessRequests, treatments, markPrise, dossier } = useAppData();
  const navigate = useNavigate();

  if (!user) return null;

  const pendingRequests = accessRequests.filter((r) => r.status === "pending");
  const myPrescriptions = treatments.filter((t) => !!t.prescribedBy);
  const myTreatments = treatments;
  
  // Adherence calculation
  const totalAdherence = myTreatments.length > 0 
    ? Math.round(myTreatments.reduce((acc, t) => acc + (t.adhesion || 0), 0) / myTreatments.length)
    : 0;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const upcomingDoses = myTreatments.flatMap((t) =>
    t.heuresPrise
      .filter((h) => !h.pris)
      .map((h) => ({ 
        treatmentId: t._id, 
        medicament: t.nomMedicament, 
        posologie: t.posologie, 
        heure: h.heure, 
        heurePriseId: h._id,
        past: h.heure < currentTime 
      }))
  ).sort((a, b) => a.heure.localeCompare(b.heure));

  const handleExportPDF = () => {
    exportPatientPDF(`${user.pseudo || user.email}`, dossier?.sante, myTreatments, []);
    toast.success("PDF exporté avec succès");
  };

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
        <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>
          Bonjour, {user.pseudo || user.email}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">Tableau de bord de suivi de santé</p>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Traitements actifs" value={myTreatments.length} icon={Pill} color="primary" delay={100} />
        <StatCard label="Adhésion" value={`${totalAdherence}%`} icon={TrendingUp} color="success" delay={160} />
        <StatCard label="Demandes médecin" value={pendingRequests.length} icon={Bell} color="warning" delay={220} />
        <StatCard label="Ordonnances" value={myPrescriptions.length} icon={FileText} color="info" delay={280} />
      </div>

      {/* Quick actions */}
      <div className="mt-5 flex flex-wrap gap-2 opacity-0 animate-fade-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
        <Button variant="outline" size="sm" onClick={() => navigate("/patient/traitements")}>
          <Plus className="h-3.5 w-3.5" /> Traitement
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/patient/infos")}>
          <User className="h-3.5 w-3.5" /> Mes Infos
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/patient/rappels")}>
          <Bell className="h-3.5 w-3.5" /> Rappels
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/patient/ordonnances")}>
          <FileText className="h-3.5 w-3.5" /> Ordonnances
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="h-3.5 w-3.5" /> Export PDF
        </Button>
      </div>

      {/* Upcoming doses */}
      {upcomingDoses.length > 0 && (
        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <h2 className="font-display text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Prises prévues
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {upcomingDoses.slice(0, 6).map((d) => (
              <button
                key={d.heurePriseId}
                onClick={() => markPrise(d.treatmentId, d.heurePriseId)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm text-left transition-all active:scale-[0.97]",
                  d.past ? "border-warning/30 bg-warning/5" : "hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                  d.past ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                )}>
                  <Pill className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{d.medicament}</p>
                  <p className="text-xs text-muted-foreground">{d.posologie}</p>
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-lg shrink-0",
                  d.past ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"
                )}>
                  {d.heure}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending access requests */}
      {pendingRequests.length > 0 && (
        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
          <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Demandes d'accès en attente</h2>
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <AccessRequestCard key={r.id} request={r} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Recent prescriptions */}
      <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
        <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Ordonnances récentes</h2>
        {myPrescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Aucune ordonnance pour le moment</p>
        ) : (
          <div className="space-y-3">
            {myPrescriptions.slice(0, 3).map((p) => (
              <PrescriptionCard key={p.id} prescription={p} showMarkPris />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
