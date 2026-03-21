import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import PatientInfosPage from "./pages/PatientInfosPage";
import PatientOrdonnancesPage from "./pages/PatientOrdonnancesPage";
import PatientNotificationsPage from "./pages/PatientNotificationsPage";
import PatientTraitementsPage from "./pages/PatientTraitementsPage";
import PatientRappelsPage from "./pages/PatientRappelsPage";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorPatientsPage from "./pages/DoctorPatientsPage";
import DoctorDemandesPage from "./pages/DoctorDemandesPage";
import DoctorOrdonnancesPage from "./pages/DoctorOrdonnancesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppDataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              <Route path="/patient/infos" element={<PatientInfosPage />} />
              <Route path="/patient/ordonnances" element={<PatientOrdonnancesPage />} />
              <Route path="/patient/notifications" element={<PatientNotificationsPage />} />
              <Route path="/patient/traitements" element={<PatientTraitementsPage />} />
              <Route path="/patient/rappels" element={<PatientRappelsPage />} />
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
              <Route path="/doctor/demandes" element={<DoctorDemandesPage />} />
              <Route path="/doctor/ordonnances" element={<DoctorOrdonnancesPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppDataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
