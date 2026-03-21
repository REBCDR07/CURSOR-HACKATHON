import DashboardLayout from "@/components/DashboardLayout";
import AccessRequestCard from "@/components/AccessRequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

export default function PatientNotificationsPage() {
  const { user } = useAuth();
  const { accessRequests } = useAppData();

  if (!user) return null;

  const myRequests = accessRequests.filter((r) => r.patientId === user.id);
  const pending = myRequests.filter((r) => r.status === "pending");
  const resolved = myRequests.filter((r) => r.status !== "pending");

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-2xl font-bold" style={{ lineHeight: "1.1" }}>Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez les demandes d'accès à votre dossier</p>
      </div>

      {pending.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display font-semibold mb-3">En attente ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <AccessRequestCard key={r.id} request={r} showActions />
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display font-semibold mb-3">Historique</h2>
          <div className="space-y-3">
            {resolved.map((r) => (
              <AccessRequestCard key={r.id} request={r} />
            ))}
          </div>
        </div>
      )}

      {myRequests.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">Aucune notification</p>
        </div>
      )}
    </DashboardLayout>
  );
}
