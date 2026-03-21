import DashboardLayout from "@/components/DashboardLayout";
import AccessRequestCard from "@/components/AccessRequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

export default function DoctorDemandesPage() {
  const { user } = useAuth();
  const { accessRequests } = useAppData();

  if (!user) return null;

  const myRequests = accessRequests.filter((r) => r.doctorId === user.id);
  const pending = myRequests.filter((r) => r.status === "pending");
  const accepted = myRequests.filter((r) => r.status === "accepted");
  const rejected = myRequests.filter((r) => r.status === "rejected");

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-2xl font-bold" style={{ lineHeight: "1.1" }}>Mes Demandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suivi de vos demandes d'accès aux dossiers patients</p>
      </div>

      {pending.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-warning animate-pulse-soft" />
            En attente ({pending.length})
          </h2>
          <div className="space-y-3">{pending.map((r) => <AccessRequestCard key={r.id} request={r} />)}</div>
        </div>
      )}

      {accepted.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-semibold mb-3">Accordées ({accepted.length})</h2>
          <div className="space-y-3">{accepted.map((r) => <AccessRequestCard key={r.id} request={r} />)}</div>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-semibold mb-3">Refusées ({rejected.length})</h2>
          <div className="space-y-3">{rejected.map((r) => <AccessRequestCard key={r.id} request={r} />)}</div>
        </div>
      )}

      {myRequests.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Aucune demande d'accès</p>
        </div>
      )}
    </DashboardLayout>
  );
}
