import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PrescriptionModal from "@/components/PrescriptionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Lock, Pill, User, Heart, Droplets, AlertCircle, Mail, MapPin, Phone, AlertTriangle, Syringe, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const { accessRequests, requestAccess } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [prescriptionTarget, setPrescriptionTarget] = useState<any | null>(null);
  const [expandedPatientId, setExpandedPatientId] = useState<string | null>(null);
  const [patientDossier, setPatientDossier] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!user) return null;

  // Real-time search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const res = await userService.searchPatient(searchQuery);
          setSearchResults([res.data]); // searchPatient currently returns a single match or 404
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const getAccessStatus = (patientId: string) => {
    const req = accessRequests.find((r) => r.patientId._id === patientId);
    return req?.status || null;
  };

  const handleToggleDossier = async (patientId: string) => {
    if (expandedPatientId === patientId) {
      setExpandedPatientId(null);
      setPatientDossier(null);
      return;
    }

    try {
      const res = await userService.getDossier(patientId);
      setPatientDossier(res.data);
      setExpandedPatientId(patientId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur d'accès au dossier");
    }
  };

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Recherche Patient</h1>
        <p className="mt-1 text-sm text-muted-foreground">Trouvez et accédez aux dossiers de vos patients via leur pseudo</p>
      </div>

      <div className="mt-6 relative opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Entrez le pseudo exact (ex: kofi)..."
          className="pl-10"
        />
      </div>

      <div className="mt-6 space-y-4">
        {isSearching && <p className="text-center py-4 text-sm text-muted-foreground">Recherche...</p>}
        
        {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun patient trouvé avec ce pseudo</p>
        )}

        {searchResults.map((patient) => {
          const status = getAccessStatus(patient._id);
          const hasAccess = status === "approved";
          const isExpanded = expandedPatientId === patient._id;

          return (
            <div key={patient._id} className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold shrink-0">
                    {patient.pseudo[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-sm sm:text-base truncate">{patient.pseudo}</h3>
                    <p className="text-xs text-muted-foreground">
                      {hasAccess ? "Accès accordé — dossier complet" : "Pseudo patient : " + patient.pseudo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!status && (
                    <Button size="sm" variant="warning" onClick={() => requestAccess(patient.pseudo)}>
                      <Lock className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Demander accès</span>
                    </Button>
                  )}
                  {status === "pending" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2.5 py-1 text-xs font-medium">
                      En attente
                    </span>
                  )}
                  {hasAccess && (
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => handleToggleDossier(patient._id)}>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">Dossier</span>
                      </Button>
                      <Button size="sm" onClick={() => setPrescriptionTarget(patient)}>
                        <Pill className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Prescrire</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient dossier details */}
              {isExpanded && patientDossier && (
                <div className="mt-4 space-y-4 animate-scale-in" style={{ animationFillMode: "forwards" }}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Identité</p>
                      <p className="text-sm font-medium">{patientDossier.identite.sexe === "H" ? "Homme" : "Femme"}</p>
                      <p className="text-xs text-muted-foreground">{patientDossier.identite.age} ans</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Sanguin</p>
                      <p className="text-sm font-medium">{patientDossier.sante.groupeSanguin}</p>
                      <p className="text-xs text-muted-foreground">Élec: {patientDossier.sante.electrophorese}</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Mesures</p>
                      <p className="text-sm font-medium">{patientDossier.identite.taille}cm / {patientDossier.identite.poids}kg</p>
                    </div>
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-[10px] uppercase text-muted-foreground mb-1">Allergies</p>
                      <p className="text-sm font-medium truncate">{patientDossier.sante.allergies.join(", ") || "Aucune"}</p>
                    </div>
                  </div>

                  {patientDossier.sante.maladiesChroniques && (
                    <div className="rounded-lg bg-secondary p-3">
                      <p className="text-xs text-muted-foreground mb-1">Maladies chroniques</p>
                      <p className="text-sm">{patientDossier.sante.maladiesChroniques}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Historique médical / Traitements</p>
                    <div className="space-y-2">
                      {patientDossier.historiqueMedical.map((t: any) => (
                        <div key={t._id} className="text-xs p-2 rounded-lg border border-border bg-background flex justify-between items-center">
                          <span>{t.nomMedicament} ({t.posologie})</span>
                          <span className="text-muted-foreground">{t.adhesion}% adhésion</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {prescriptionTarget && (
        <PrescriptionModal
          patientId={prescriptionTarget._id}
          patientName={prescriptionTarget.pseudo}
          patientPoids={70} // Should ideally come from dossier if available
          onClose={() => setPrescriptionTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}
