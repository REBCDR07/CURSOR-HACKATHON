import DashboardLayout from "@/components/DashboardLayout";
import PrescriptionCard from "@/components/PrescriptionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportPatientPDF } from "@/lib/exportPdf";
import { toast } from "sonner";

export default function PatientOrdonnancesPage() {
  const { user } = useAuth();
  const { prescriptions, patientInfos, treatments } = useAppData();

  if (!user) return null;

  const myPrescriptions = prescriptions.filter((p) => p.patientId === user.id);

  const handleExportAll = () => {
    const infos = patientInfos[user.id] || null;
    const myTreatments = treatments.filter(t => t.patientId === user.id);
    exportPatientPDF(`${user.prenom} ${user.nom}`, infos, myTreatments, myPrescriptions);
    toast.success("PDF exporté !");
  };

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-3 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Mes Ordonnances</h1>
          <p className="mt-1 text-sm text-muted-foreground">Toutes vos prescriptions médicales</p>
        </div>
        {myPrescriptions.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportAll} className="shrink-0">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tout exporter</span>
          </Button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {myPrescriptions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">Aucune ordonnance pour le moment</p>
          </div>
        ) : (
          myPrescriptions.map((p) => (
            <PrescriptionCard key={p.id} prescription={p} showMarkPris />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
