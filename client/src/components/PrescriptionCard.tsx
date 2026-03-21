import { Treatment } from "@/contexts/AppDataContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Check, Pill, Clock, Calendar, Download, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { exportPrescriptionPDF } from "@/lib/exportPdf";
import { toast } from "sonner";


interface Props {
  prescription: Treatment;
  showMarkPris?: boolean;
}

export default function PrescriptionCard({ prescription, showMarkPris = false }: Props) {
  const { markPrise } = useAppData();

  const handleExport = () => {
    // Adapter exportPrescriptionPDF to Treatment if needed
    // exportPrescriptionPDF(prescription);
    toast.success("Ordonnance exportée en PDF !");
  };

  const isPris = prescription.heuresPrise.every(h => h.pris);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm animate-fade-up">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Pill className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-semibold text-sm truncate">{prescription.nomMedicament}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {prescription.prescribedBy?.pseudo || "Médecin"} · {prescription.prescribedBy?.email || ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isPris && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-0.5 text-xs font-medium">
              <Check className="h-3 w-3" /> Terminé
            </span>
          )}
          <button onClick={handleExport} className="rounded-lg p-1.5 hover:bg-secondary text-muted-foreground transition-colors" title="Exporter PDF">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg bg-secondary p-2 sm:p-2.5">
          <p className="text-[10px] sm:text-xs text-muted-foreground">Posologie</p>
          <p className="text-xs sm:text-sm font-medium mt-0.5">{prescription.posologie}</p>
        </div>
        <div className="rounded-lg bg-secondary p-2 sm:p-2.5 flex items-start gap-1">
          <Clock className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0 hidden sm:block" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Fréquence</p>
            <p className="text-xs sm:text-sm font-medium mt-0.5">{prescription.frequence}</p>
          </div>
        </div>
        <div className="rounded-lg bg-secondary p-2 sm:p-2.5 flex items-start gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0 hidden sm:block" />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Durée</p>
            <p className="text-xs sm:text-sm font-medium mt-0.5">{prescription.duree}j</p>
          </div>
        </div>
      </div>

      {prescription.notes && (
        <div className="mt-3 text-xs text-muted-foreground bg-secondary rounded-lg p-2.5 italic flex items-start gap-2">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{prescription.notes}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {format(new Date(prescription.createdAt), "d MMMM yyyy", { locale: fr })}
        </p>
      </div>
    </div>
  );
}
