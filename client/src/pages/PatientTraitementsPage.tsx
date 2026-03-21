import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData, Treatment } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pill, Check, Clock, Trash2, X, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function PatientTraitementsPage() {
  const { user } = useAuth();
  const { treatments, addTreatment, markPrise, isLoading } = useAppData();
  const [showAdd, setShowAdd] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [form, setForm] = useState({
    nomMedicament: "", posologie: "", frequence: "2x / jour",
    heuresPrise: ["08:00", "20:00"], duree: 7, notes: "",
  });
  const [heureInput, setHeureInput] = useState("");

  if (!user) return null;

  const myTreatments = treatments;
  const activeTreatments = myTreatments; // Backend currently only returns active-ish or all

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTreatment({
      nomMedicament: form.nomMedicament,
      posologie: form.posologie,
      frequence: form.frequence,
      heuresPrise: form.heuresPrise,
      duree: form.duree,
      notes: form.notes,
    });
    setForm({ nomMedicament: "", posologie: "", frequence: "2x / jour", heuresPrise: ["08:00", "20:00"], duree: 7, notes: "" });
    setShowAdd(false);
  };

  const addHeure = () => {
    if (heureInput && !form.heuresPrise.includes(heureInput)) {
      setForm({ ...form, heuresPrise: [...form.heuresPrise, heureInput].sort() });
      setHeureInput("");
    }
  };

  const removeHeure = (h: string) => {
    setForm({ ...form, heuresPrise: form.heuresPrise.filter((x) => x !== h) });
  };

  const getNextPrise = (t: Treatment) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const upcoming = t.heuresPrise.find(h => !h.pris && h.heure >= currentTime);
    return upcoming ? upcoming.heure : null;
  };

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-4 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Mes Traitements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez vos médicaments et suivez vos prises</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span className="hidden sm:inline">{showAdd ? "Annuler" : "Ajouter"}</span>
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mt-5 rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 animate-scale-in" style={{ animationFillMode: "forwards" }}>
          <h3 className="font-display font-semibold flex items-center gap-2">
            <Pill className="h-4 w-4 text-primary" /> Nouveau traitement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Nom du médicament</Label>
              <Input value={form.nomMedicament} onChange={(e) => setForm({ ...form, nomMedicament: e.target.value })} placeholder="Ex: Paracétamol 500mg" className="mt-1" required />
            </div>
            <div>
              <Label className="text-xs">Posologie / Dose</Label>
              <Input value={form.posologie} onChange={(e) => setForm({ ...form, posologie: e.target.value })} placeholder="Ex: 2 comprimés" className="mt-1" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Fréquence</Label>
              <select value={form.frequence} onChange={(e) => setForm({ ...form, frequence: e.target.value })} className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option>1x / jour</option>
                <option>2x / jour</option>
                <option>3x / jour</option>
                <option>4x / jour</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Durée (jours)</Label>
              <Input type="number" value={form.duree} onChange={(e) => setForm({ ...form, duree: +e.target.value })} className="mt-1" min={1} required />
            </div>
            <div>
              <Label className="text-xs">Heures de prise</Label>
              <div className="flex gap-1 mt-1">
                <Input type="time" value={heureInput} onChange={(e) => setHeureInput(e.target.value)} className="flex-1" />
                <Button type="button" variant="outline" size="icon" onClick={addHeure}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.heuresPrise.map((h) => (
                  <span key={h} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                    {h}
                    <button type="button" onClick={() => removeHeure(h)} className="hover:text-primary/60">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Instructions spéciales, effets secondaires…" className="mt-1" rows={2} />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Ajouter le traitement
          </Button>
        </form>
      )}

      {/* Active treatments */}
      <div className="mt-6 space-y-4">
        {activeTreatments.length === 0 && !showAdd && (
          <div className="py-12 text-center rounded-xl border border-dashed border-border">
            <Pill className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucun traitement actif</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Ajouter mon premier traitement
            </Button>
          </div>
        )}

        {activeTreatments.map((t, idx) => {
          const nextPrise = getNextPrise(t);
          const adherence = Math.round(t.adhesion || 0);

          return (
            <div
              key={t._id}
              className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm opacity-0 animate-fade-up"
              style={{ animationDelay: `${100 + idx * 80}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm sm:text-base">{t.nomMedicament}</h3>
                    <p className="text-xs text-muted-foreground">{t.posologie} · {t.frequence} · {t.duree} jours</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {nextPrise && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2 py-0.5 text-xs font-medium">
                      <Clock className="h-3 w-3" /> {nextPrise}
                    </span>
                  )}
                </div>
              </div>

              {t.notes && (
                <div className="mt-2 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2 italic ml-0 sm:ml-[52px] flex items-start gap-2">
                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{t.notes}</span>
                </div>
              )}

              {/* Prises du jour */}
              <div className="mt-3 ml-0 sm:ml-[52px]">
                <p className="text-xs text-muted-foreground mb-2">Prises prévues</p>
                <div className="flex flex-wrap gap-2">
                  {t.heuresPrise.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => { if (!p.pris) markPrise(t._id, p._id); }}
                      disabled={p.pris}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.97]",
                        p.pris
                          ? "bg-success/10 text-success"
                          : "bg-secondary hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {p.pris ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {p.heure}
                      {p.pris && " ✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adherence bar */}
              <div className="mt-3 ml-0 sm:ml-[52px]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Adhésion</span>
                  <span className="font-medium">{adherence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${adherence}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Past treatments */}
      {pastTreatments.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 font-display font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Traitements passés ({pastTreatments.length})
          </button>
          {showPast && (
            <div className="mt-3 space-y-3">
              {pastTreatments.map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card/60 p-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <Pill className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{t.medicament}</p>
                      <p className="text-xs text-muted-foreground">{t.posologie} · {t.frequence} · {t.duree} jours</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
