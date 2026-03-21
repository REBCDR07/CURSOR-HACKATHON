import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Pill, Users, ArrowRight, Stethoscope, User, Bell, FileText } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-base sm:text-lg font-bold">MonCarnet Santé</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-xs sm:text-sm">Se connecter</Button>
          <Button size="sm" onClick={() => navigate("/register")} className="text-xs sm:text-sm">S'inscrire</Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-20 pb-12 sm:pb-24">
        <div className="max-w-2xl opacity-0 animate-fade-up" style={{ animationDelay: "150ms", animationFillMode: "forwards" }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium mb-4 sm:mb-6">
            <Shield className="h-3.5 w-3.5" />
            Vos données médicales, sécurisées
          </div>
          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-balance" style={{ lineHeight: "1.05" }}>
            Votre carnet de santé
            <span className="text-primary"> numérique</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-sm sm:text-lg text-muted-foreground max-w-lg">
            Gérez votre dossier médical, recevez vos ordonnances et contrôlez l'accès à vos données de santé en toute sécurité.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => navigate("/register")} className="w-full sm:w-auto">
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/login")} className="w-full sm:w-auto">
              Accès démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: User, title: "Espace Patient", desc: "Renseignez vos informations médicales, recevez vos ordonnances et gérez vos rappels de médicaments.", delay: 300 },
            { icon: Stethoscope, title: "Espace Médecin", desc: "Recherchez des patients, demandez l'accès à leur dossier et assignez des ordonnances.", delay: 380 },
            { icon: Shield, title: "Contrôle Total", desc: "Le patient décide qui accède à ses données. Chaque demande est traçable et révocable.", delay: 460 },
            { icon: Bell, title: "Rappels Intelligents", desc: "Notifications push et fallback SMS pour ne jamais oublier vos prises de médicaments.", delay: 540 },
            { icon: FileText, title: "Export PDF", desc: "Exportez votre dossier médical complet ou vos ordonnances en PDF à tout moment.", delay: 620 },
            { icon: Pill, title: "Suivi d'Adhésion", desc: "Visualisez votre taux d'adhésion mensuel et marquez vos prises au quotidien.", delay: 700 },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 opacity-0 animate-fade-up"
              style={{ animationDelay: `${f.delay}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 sm:mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground opacity-0 animate-fade-in" style={{ animationDelay: "800ms", animationFillMode: "forwards" }}>
        © 2026 MonCarnet Santé — Cursor Hackathon · Données protégées CNIL
      </footer>
    </div>
  );
}
