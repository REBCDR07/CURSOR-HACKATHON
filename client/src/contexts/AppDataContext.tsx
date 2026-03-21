import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { treatmentService } from "@/services/treatment.service";
import { accessService } from "@/services/access.service";
import { userService } from "@/services/user.service";
import api from "@/services/api";
import { toast } from "sonner";

export interface PatientInfos {
  pseudo: string;
  age: number;
  sexe: "H" | "F";
  taille: number;
  poids: number;
  groupeSanguin: string;
  electrophorese: string;
  allergies: string[];
  maladiesChroniques: string;
  vaccins: string[];
  contactsUrgence: any;
  consentement: boolean;
}

export interface AccessRequest {
  _id: string;
  doctorId: { _id: string; pseudo: string; email: string };
  patientId: any;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
}

export interface Treatment {
  _id: string;
  userId: string;
  nomMedicament: string;
  posologie: string;
  frequence: string;
  heuresPrise: Array<{ heure: string; pris: boolean; datePrise?: string; _id: string }>;
  duree: number;
  notes: string;
  adhesion: number;
  photoOrdonnance?: string;
  createdAt: string;
  prescribedBy?: { _id: string; pseudo: string; email: string };
}

interface AppDataContextType {
  dossier: any | null;
  treatments: Treatment[];
  accessRequests: AccessRequest[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  addTreatment: (data: any) => Promise<void>;
  markPrise: (treatmentId: string, heurePriseId: string) => Promise<void>;
  respondAccessRequest: (id: string, action: "accepted" | "rejected") => Promise<void>;
  requestAccess: (patientPseudo: string) => Promise<void>;
  apiBaseUrl: string;
  apiOrigin: string;
  appUrl: string;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, apiBaseUrl, apiOrigin, appUrl } = useAuth();
  const [dossier, setDossier] = useState<any | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      if (user?.role === "patient") {
        const [dossierRes, treatmentRes, accessRes] = await Promise.all([
          userService.getDossier(),
          treatmentService.getTreatments(),
          accessService.getPatientRequests()
        ]);
        setDossier(dossierRes.data);
        setTreatments(treatmentRes.data);
        setAccessRequests(accessRes.data);
      } else if (user?.role === "doctor") {
        const accessRes = await api.get('/access/doctor');
        setAccessRequests(accessRes.data.data);
        
        const treatmentRes = await treatmentService.getTreatments();
        setTreatments(treatmentRes.data);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [isAuthenticated, user?.role]);

  const addTreatment = async (data: any) => {
    try {
      await treatmentService.addTreatment(data);
      toast.success("Traitement ajouté !");
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout");
    }
  };

  const markPrise = async (treatmentId: string, heurePriseId: string) => {
    try {
      await treatmentService.markAsTaken(treatmentId, heurePriseId);
      toast.success("Prise enregistrée !");
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const respondAccessRequest = async (id: string, action: "accepted" | "rejected") => {
    try {
      if (action === "accepted") {
        await accessService.approveAccess(id);
        toast.success("Accès approuvé !");
      }
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la réponse");
    }
  };

  const requestAccess = async (patientPseudo: string) => {
    try {
      await accessService.requestAccess(patientPseudo);
      toast.success("Demande d'accès envoyée !");
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la demande");
    }
  };

  return (
    <AppDataContext.Provider
      value={{
        dossier,
        treatments,
        accessRequests,
        isLoading,
        refreshData,
        addTreatment,
        markPrise,
        respondAccessRequest,
        requestAccess,
        apiBaseUrl,
        apiOrigin,
        appUrl,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be inside AppDataProvider");
  return ctx;
}
