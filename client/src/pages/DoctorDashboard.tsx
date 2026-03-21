import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import AccessRequestCard from "@/components/AccessRequestCard";
import PrescriptionCard from "@/components/PrescriptionCard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { userService } from "@/services/user.service";
import { Users, FileText, Clock, Stethoscope, Search, ChevronRight, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { accessRequests, treatments, requestAccess } = useAppData();
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!user) return null;

  const myRequests = accessRequests;
  const pendingRequests = myRequests.filter((r) => r.status === "pending");
  const approvedRequests = myRequests.filter((r) => r.status === "approved");
  const myPrescriptions = treatments;

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (quickSearch.length >= 3) {
        setIsSearching(true);
        try {
          const res = await userService.searchPatient(quickSearch);
          setSearchResult(res.data);
        } catch (error) {
          setSearchResult(null);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResult(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [quickSearch]);

  const handleRequestAccess = async (pseudo: string) => {
    await requestAccess(pseudo);
    setQuickSearch("");
    setSearchResult(null);
  };

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>
          Bonjour, Dr {user.pseudo || user.email}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">Espace professionnel de santé</p>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Patients suivis" value={approvedRequests.length} icon={Users} color="primary" delay={100} />
        <StatCard label="Ordonnances émises" value={myPrescriptions.length} icon={FileText} color="info" delay={160} />
        <StatCard label="Demandes en attente" value={pendingRequests.length} icon={Clock} color="warning" delay={220} />
        <StatCard label="Statut" value="Actif" icon={Stethoscope} color="success" delay={280} />
      </div>

      <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
        <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Rechercher un patient</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder="Entrez le pseudo exact du patient (ex: kofi)..."
            className="pl-10"
          />
        </div>
        
        {isSearching && <p className="mt-2 text-xs text-muted-foreground">Recherche en cours...</p>}
        
        {searchResult && (
          <div className="mt-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between w-full px-4 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-xs">
                  {searchResult.pseudo[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{searchResult.pseudo}</p>
                  <p className="text-xs text-muted-foreground">{searchResult.age} ans · {searchResult.sexe}</p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleRequestAccess(searchResult.pseudo)}>
                <Send className="h-3.5 w-3.5 mr-1" /> Demander accès
              </Button>
            </div>
          </div>
        )}
      </div>

      {approvedRequests.length > 0 && (
        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "400ms", animationFillMode: "forwards" }}>
          <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Mes patients autorisés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {approvedRequests.map((r) => (
              <button
                key={r._id}
                onClick={() => navigate(`/doctor/patients?id=${r.patientId._id}`)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-success font-display font-bold text-xs shrink-0">
                  {r.patientId.pseudo[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.patientId.pseudo}</p>
                  <p className="text-xs text-muted-foreground">Dossier accessible</p>
                </div>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {pendingRequests.length > 0 && (
        <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "450ms", animationFillMode: "forwards" }}>
          <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Demandes en attente</h2>
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <AccessRequestCard key={r._id} request={r} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 opacity-0 animate-fade-up" style={{ animationDelay: "550ms", animationFillMode: "forwards" }}>
        <h2 className="font-display text-base sm:text-lg font-semibold mb-3">Ordonnances récentes</h2>
        {myPrescriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Aucune ordonnance émise</p>
        ) : (
          <div className="space-y-3">
            {myPrescriptions.slice(0, 5).map((p) => (
              <PrescriptionCard key={p._id} prescription={p} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
