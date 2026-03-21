import { useState, useEffect } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, User, Stethoscope, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      // The role-based navigation will be handled by the effect or manually here
      // But since we want to be sure, let's use a small delay or check the user from context
    } catch (error) {
      // Error handled in context with toast
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to redirect once user is set
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      if (user.role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard");
      }
    }
  }, [user, navigate]);

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      await login(role === "patient" ? "kofi@mail.com" : "arnaud@mail.com", "demo123456");
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
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight text-balance" style={{ lineHeight: "1.1" }}>
            Votre santé,{" "}
            <span className="text-primary-foreground/70">entre vos mains.</span>
          </h2>
          <p className="mt-4 text-primary-foreground/70 max-w-md text-base lg:text-lg">
            Gérez votre dossier médical, recevez vos ordonnances et gardez le contrôle total sur vos données de santé.
          </p>
        </div>

        <p className="text-xs text-primary-foreground/40">
          © 2026 MonCarnet Santé — Cursor Hackathon
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-5 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-sm opacity-0 animate-fade-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">MonCarnet Santé</span>
          </div>

          <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Connexion</h1>
          <p className="mt-2 text-sm text-muted-foreground">Accédez à votre espace santé sécurisé</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label className="text-xs font-medium">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" className="mt-1.5" required />
            </div>
            <div>
              <Label className="text-xs font-medium">Mot de passe</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" required />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6">
            <p className="text-xs text-muted-foreground text-center mb-3">Accès démo rapide</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => demoLogin("patient")} className="text-xs">
                <User className="h-3.5 w-3.5" />
                Patient
              </Button>
              <Button variant="outline" size="sm" onClick={() => demoLogin("doctor")} className="text-xs">
                <Stethoscope className="h-3.5 w-3.5" />
                Médecin
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
