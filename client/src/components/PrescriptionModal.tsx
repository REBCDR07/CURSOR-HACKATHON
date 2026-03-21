import { useState } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Pill } from "lucide-react";

interface Props {
  patientId: string;
  patientName: string;
  patientPoids: number;
  doctorId: string;
  doctorName: string;
  doctorSpecialite: string;
  onClose: () => void;
}

export default function PrescriptionModal({ patientId, patientName, patientPoids, doctorId, doctorName, doctorSpecialite, onClose }: Props) {
  const { addPrescription } = useAppData();
  const [form, setForm] = useState({
    medicament: "",
    poids: patientPoids,
    posologie: "",
    frequence: "2x / jour",
    duree: 3,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPrescription({
      doctorId, doctorName, doctorSpecialite,
      patientId, patientName,
      ...form,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in p-0 sm:p-4">
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <h2 className="font-display text-base sm:text-lg font-bold">Assigner une ordonnance</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Nom du patient</Label>
              <Input value={patientName} disabled className="mt-1.5 bg-secondary" />
            </div>
            <div>
              <Label className="text-xs">Poids (kg)</Label>
              <Input type="number" value={form.poids} onChange={(e) => setForm({...form, poids: +e.target.value})} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Médicament</Label>
            <Input value={form.medicament} onChange={(e) => setForm({...form, medicament: e.target.value})} placeholder="Ex: Coartem 80/480mg" className="mt-1.5" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Posologie / Dose</Label>
              <Input value={form.posologie} onChange={(e) => setForm({...form, posologie: e.target.value})} placeholder="4 comprimés" className="mt-1.5" required />
            </div>
            <div>
              <Label className="text-xs">Fréquence</Label>
              <select
                value={form.frequence}
                onChange={(e) => setForm({...form, frequence: e.target.value})}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option>1x / jour</option>
                <option>2x / jour</option>
                <option>3x / jour</option>
                <option>4x / jour</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Durée (jours)</Label>
              <Input type="number" value={form.duree} onChange={(e) => setForm({...form, duree: +e.target.value})} className="mt-1.5" min={1} required />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes / Instructions</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Instructions spéciales..." className="mt-1.5" rows={3} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1">
              <Pill className="h-4 w-4" />
              Envoyer l'ordonnance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
