import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import AuthGuard from "@/components/AuthGuard";
import OfflineQueueWatcher from "@/components/OfflineQueueWatcher";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Treatments from "./pages/Treatments";
import AddTreatment from "./pages/AddTreatment";
import History from "./pages/History";
import Profile from "./pages/Profile";
import ActivityPage from "./pages/Activity";
import QRSharePage from "./pages/QRShare";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientSearch from "./pages/PatientSearch";
import PatientRecord from "./pages/PatientRecord";
import NewPrescription from "./pages/NewPrescription";
import DoctorRequests from "./pages/DoctorRequests";
import DoctorProfile from "./pages/DoctorProfile";
import DoctorQueue from "./pages/DoctorQueue";
import SharedRecord from "./pages/SharedRecord";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const publicRoutes = ['/', '/connexion', '/inscription'];
  const isShare = location.pathname.startsWith('/partage/');
  const showNav = !publicRoutes.includes(location.pathname) && !isShare;

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Signup />} />

        {/* Patient routes */}
        <Route path="/dashboard" element={<AuthGuard role="patient"><Dashboard /></AuthGuard>} />
        <Route path="/traitements" element={<AuthGuard role="patient"><Treatments /></AuthGuard>} />
        <Route path="/traitements/ajouter" element={<AuthGuard role="patient"><AddTreatment /></AuthGuard>} />
        <Route path="/historique" element={<AuthGuard role="patient"><History /></AuthGuard>} />
        <Route path="/profil" element={<AuthGuard role="patient"><Profile /></AuthGuard>} />
        <Route path="/activite" element={<AuthGuard role="patient"><ActivityPage /></AuthGuard>} />
        <Route path="/partage" element={<AuthGuard role="patient"><QRSharePage /></AuthGuard>} />

        {/* Doctor routes */}
        <Route path="/medecin" element={<AuthGuard role="medecin"><DoctorDashboard /></AuthGuard>} />
        <Route path="/medecin/recherche" element={<AuthGuard role="medecin"><PatientSearch /></AuthGuard>} />
        <Route path="/medecin/demandes" element={<AuthGuard role="medecin"><DoctorRequests /></AuthGuard>} />
        <Route path="/medecin/profil" element={<AuthGuard role="medecin"><DoctorProfile /></AuthGuard>} />
        <Route path="/medecin/file-attente" element={<AuthGuard role="medecin"><DoctorQueue /></AuthGuard>} />
        <Route path="/medecin/patient/:patientId" element={<AuthGuard role="medecin"><PatientRecord /></AuthGuard>} />
        <Route path="/medecin/patient/:patientId/ordonnance" element={<AuthGuard role="medecin"><NewPrescription /></AuthGuard>} />

        {/* Shared QR access — doctor-only but no AuthGuard wrapper because the page handles auth itself with custom messaging */}
        <Route path="/partage/:token" element={<SharedRecord />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OfflineQueueWatcher />
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
