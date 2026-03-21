import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Clock, Copy, Check, Pill, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PatientRappelsPage() {
  const { user } = useAuth();
  const { reminders, toggleReminder, removeReminder, treatments } = useAppData();
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [lastChecked, setLastChecked] = useState<string>("");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === "granted") {
        toast.success("Notifications activées !");
        new Notification("MonCarnet Santé", { body: "Les rappels de médicaments sont activés 💊", icon: "/placeholder.svg" });
      } else {
        toast.error("Notifications refusées. Vous recevrez des alertes dans l'app.");
      }
    }
  };

  // Periodic check (setInterval 10s as per spec)
  const checkReminders = useCallback(() => {
    if (!user) return;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const checkKey = `${now.toISOString().split("T")[0]}-${currentTime}`;

    if (checkKey === lastChecked) return;

    const myReminders = reminders.filter((r) => r.patientId === user.id && r.enabled);
    myReminders.forEach((r) => {
      if (r.heure === currentTime) {
        setLastChecked(checkKey);
        if (notifPermission === "granted") {
          new Notification("💊 Rappel médicament", {
            body: `Prends ton ${r.medicament} maintenant !`,
            tag: r.id,
          });
        } else {
          toast(`💊 Prends ton ${r.medicament} maintenant !`, { duration: 10000 });
        }
      }
    });
  }, [user, reminders, notifPermission, lastChecked]);

  useEffect(() => {
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  if (!user) return null;

  const myReminders = reminders.filter((r) => r.patientId === user.id);
  const enabledReminders = myReminders.filter((r) => r.enabled);
  const disabledReminders = myReminders.filter((r) => !r.enabled);

  const getSmsText = (medicament: string, heure: string) =>
    `Rappel : Prends ton ${medicament} à ${heure}. – MonCarnet Santé`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texte copié !");
  };

  return (
    <DashboardLayout>
      <div className="opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Rappels</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notifications pour ne jamais oublier vos médicaments</p>
      </div>

      {/* Notification permission */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5 opacity-0 animate-fade-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
              notifPermission === "granted" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            )}>
              {notifPermission === "granted" ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-medium text-sm">
                {notifPermission === "granted" ? "Notifications push activées" : "Notifications non activées"}
              </p>
              <p className="text-xs text-muted-foreground">
                {notifPermission === "granted"
                  ? "Vous recevrez une notification à chaque heure de prise"
                  : "Activez les notifications pour recevoir des rappels automatiques"}
              </p>
            </div>
          </div>
          {notifPermission !== "granted" && (
            <Button size="sm" onClick={requestPermission}>
              <Bell className="h-4 w-4" /> Activer
            </Button>
          )}
        </div>

        {notifPermission === "denied" && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>Les notifications ont été bloquées dans votre navigateur. Vous recevrez les rappels sous forme d'alertes dans l'application. Pour les SMS, copiez le texte ci-dessous.</p>
          </div>
        )}
      </div>

      {/* Active reminders */}
      <div className="mt-6 space-y-3">
        <h2 className="font-display font-semibold text-sm">Rappels actifs ({enabledReminders.length})</h2>

        {enabledReminders.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Aucun rappel actif. Ajoutez un traitement pour créer des rappels.</p>
        )}

        {enabledReminders.map((r, idx) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm opacity-0 animate-fade-up"
            style={{ animationDelay: `${200 + idx * 60}ms`, animationFillMode: "forwards" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{r.medicament}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.heure}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(getSmsText(r.medicament, r.heure))}
                  className="rounded-lg p-2 hover:bg-secondary text-muted-foreground transition-colors"
                  title="Copier texte SMS"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleReminder(r.id)}
                  className="rounded-lg p-2 hover:bg-warning/10 text-muted-foreground hover:text-warning transition-colors"
                  title="Désactiver"
                >
                  <BellOff className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* SMS fallback text */}
            <div className="mt-2 ml-12 rounded-lg bg-secondary p-2.5 text-xs text-muted-foreground">
              📱 SMS: <span className="italic">{getSmsText(r.medicament, r.heure)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Disabled reminders */}
      {disabledReminders.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="font-display font-semibold text-sm text-muted-foreground">Désactivés ({disabledReminders.length})</h2>
          {disabledReminders.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card/60 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 opacity-60">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">{r.medicament}</p>
                  <p className="text-xs text-muted-foreground">{r.heure}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleReminder(r.id)}>
                <Bell className="h-3.5 w-3.5" /> Réactiver
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
