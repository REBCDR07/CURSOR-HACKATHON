import { useAppData, AccessRequest } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Check, X, Stethoscope } from "lucide-react";

interface Props {
  request: AccessRequest;
  showActions?: boolean;
}

export default function AccessRequestCard({ request, showActions = false }: Props) {
  const { respondAccessRequest } = useAppData();

  const statusStyles: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    expired: "bg-muted text-muted-foreground border-border",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    approved: "Accordé",
    rejected: "Rejeté",
    expired: "Expiré",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-up">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10 text-info shrink-0">
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{request.doctorId.pseudo || request.doctorId.email}</p>
          <p className="text-xs text-muted-foreground">
            Médecin · {request.doctorId.email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Demande accès à votre dossier médical
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[request.status]}`}>
          {statusLabels[request.status] || request.status}
        </span>
      </div>

      {showActions && request.status === "pending" && (
        <div className="mt-3 flex gap-2 pl-[52px]">
          <Button size="sm" variant="success" onClick={() => respondAccessRequest(request._id, "accepted")}>
            <Check className="h-3.5 w-3.5" />
            Accepter
          </Button>
          <Button size="sm" variant="outline" onClick={() => respondAccessRequest(request._id, "rejected")}>
            <X className="h-3.5 w-3.5" />
            Rejeter
          </Button>
        </div>
      )}
    </div>
  );
}
