import DashboardLayout from "@/components/DashboardLayout";
import PrescriptionCard from "@/components/PrescriptionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";

export default function DoctorOrdonnancesPage() {
  const { user } = useAuth();
  const { prescriptions } = useAppData();

  if (!user) return null;

  const myPrescriptions = prescriptions.filter((p) => p.doctorId === user.id);

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-2xl font-bold" style={{ lineHeight: "1.1" }}>Ordonnances</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historique des ordonnances assignées</p>
      </div>

      <div className="mt-6 space-y-4">
        {myPrescriptions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Aucune ordonnance assignée</p>
          </div>
        ) : (
          myPrescriptions.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
