import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Heart, User, Stethoscope, LayoutDashboard, FileText, Bell, Pill, Clock, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const patientLinks = [
  { to: "/patient/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { to: "/patient/traitements", icon: Pill, label: "Traitements" },
  { to: "/patient/infos", icon: User, label: "Mes Infos" },
  { to: "/patient/ordonnances", icon: FileText, label: "Ordonnances" },
  { to: "/patient/rappels", icon: Clock, label: "Rappels" },
  { to: "/patient/notifications", icon: Bell, label: "Notifications" },
];

const doctorLinks = [
  { to: "/doctor/dashboard", icon: LayoutDashboard, label: "Accueil" },
  { to: "/doctor/patients", icon: User, label: "Patients" },
  { to: "/doctor/demandes", icon: Bell, label: "Demandes" },
  { to: "/doctor/ordonnances", icon: FileText, label: "Ordonnances" },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = user.role === "patient" ? patientLinks : doctorLinks;

  const displayName =
    [user.prenom, user.nom].filter(Boolean).join(" ").trim() || user.pseudo || user.email;

  const initials = (() => {
    const p = user.prenom?.trim();
    const n = user.nom?.trim();
    if (p && n) return `${p[0]}${n[0]}`.toUpperCase();
    if (p && p.length >= 2) return p.slice(0, 2).toUpperCase();
    if (p) return p[0].toUpperCase();
    const ps = user.pseudo?.trim();
    if (ps) return (ps.length >= 2 ? ps.slice(0, 2) : ps[0]).toUpperCase();
    const em = user.email?.trim();
    if (em) return em.slice(0, 2).toUpperCase();
    return "?";
  })();

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-2.5 px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold leading-none">MonCarnet</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Santé</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden rounded-lg p-1.5 hover:bg-secondary">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3">
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          user.role === "patient" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"
        )}>
          {user.role === "patient" ? <User className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />}
          {user.role === "patient" ? "Patient" : "Médecin"}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <button
              key={link.to}
              onClick={() => { navigate(link.to); setMobileOpen(false); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-display font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => { logout(); navigate("/"); setMobileOpen(false); }}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-sm font-bold">MonCarnet</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-secondary">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-card shadow-xl animate-slide-in-left" style={{ animationFillMode: "forwards" }}>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-border bg-card shrink-0">
        {navContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card">
        <nav className="flex items-center justify-around py-2">
          {links.slice(0, 5).map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <button
                key={link.to}
                onClick={() => navigate(link.to)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
