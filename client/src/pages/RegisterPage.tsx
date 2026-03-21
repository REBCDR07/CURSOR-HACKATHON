import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, User, Stethoscope, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("patient");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    prenom: "", nom: "", pseudo: "", email: "", password: "", confirmPassword: "",
    specialite: "", clinique: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    
    setIsLoading(true);
    try {
      const created = await register({
        prenom: form.prenom, nom: form.nom, pseudo: form.pseudo, email: form.email,
        password: form.password, role,
        specialite: form.specialite, clinique: form.clinique,
      });
      navigate(created.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard", { replace: true });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-2.5 opacity-0 animate-slide-in-left" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-primary-foreground">MonCarnet Santé</span>
        </div>
        <div className="opacity-0 animate-fade-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
          <h2 className="font-display text-4xl font-bold text-primary-foreground leading-tight text-balance" style={{ lineHeight: "1.1" }}>
            Rejoignez la{" "}
            <span className="text-primary-foreground/70">communauté santé.</span>
          </h2>
          <p className="mt-4 text-primary-foreground/70 max-w-md text-lg">
            Créez votre compte en quelques secondes et prenez le contrôle de vos données médicales.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/40">© 2026 MonCarnet Santé — Cursor Hackathon</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">MonCarnet Santé</span>
          </div>

          <h1 className="font-display text-2xl font-bold" style={{ lineHeight: "1.1" }}>Inscription</h1>
          <p className="mt-2 text-sm text-muted-foreground">Créez votre espace santé sécurisé</p>

          {/* Role selector */}
          <div className="mt-5 flex gap-2 p-1 rounded-xl bg-secondary">
            {(["patient", "doctor"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all",
                  role === r ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {r === "patient" ? <User className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                {r === "patient" ? "Patient" : "Médecin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Prénom</Label>
                <Input value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} className="mt-1" required minLength={2} />
              </div>
              <div>
                <Label className="text-xs">Nom</Label>
                <Input value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} className="mt-1" required minLength={2} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Pseudo (pour recherche médecin)</Label>
              <Input value={form.pseudo} onChange={(e) => setForm({...form, pseudo: e.target.value})} className="mt-1" required minLength={3} />
            </div>

            {role === "doctor" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Spécialité</Label>
                  <select
                    value={form.specialite}
                    onChange={(e) => setForm({...form, specialite: e.target.value})}
                    className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choisir…</option>
                    <option>Généraliste</option>
                    <option>Pédiatre</option>
                    <option>Cardiologue</option>
                    <option>Dermatologue</option>
                    <option>Gynécologue</option>
                    <option>Ophtalmologue</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Clinique / Hôpital</Label>
                  <Input value={form.clinique} onChange={(e) => setForm({...form, clinique: e.target.value})} className="mt-1" required />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1" required />
            </div>
            <div>
              <Label className="text-xs">Mot de passe</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="mt-1" required minLength={8} />
            </div>
            <div>
              <Label className="text-xs">Confirmer mot de passe</Label>
              <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({...form, confirmPassword: e.target.value})} className="mt-1" required />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
