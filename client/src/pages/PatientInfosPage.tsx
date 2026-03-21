import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAppData } from "@/contexts/AppDataContext";
import { userService } from "@/services/user.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, User, Phone, Heart, AlertTriangle, Shield, Syringe, Camera, Download } from "lucide-react";
import { toast } from "sonner";
import { exportPatientPDF } from "@/lib/exportPdf";

export default function PatientInfosPage() {
  const { user } = useAuth();
  const { dossier, treatments, refreshData } = useAppData();

  const [form, setForm] = useState<any>({
    sexe: "H", age: 0, pseudo: "",
    taille: 0, poids: 0, groupeSanguin: "O+", electrophorese: "AA",
    allergies: [], maladiesChroniques: "", vaccins: [],
    contactsUrgence: { nom: "", lien: "", tel: "" },
    consentementDonnees: false,
  });

  useEffect(() => {
    if (dossier) {
      setForm({
        sexe: dossier.identite?.sexe || "H",
        age: dossier.identite?.age || 0,
        pseudo: dossier.identite?.pseudo || "",
        taille: dossier.identite?.taille || 0,
        poids: dossier.identite?.poids || 0,
        groupeSanguin: dossier.sante?.groupeSanguin || "O+",
        electrophorese: dossier.sante?.electrophorese || "AA",
        allergies: dossier.sante?.allergies || [],
        maladiesChroniques: dossier.sante?.maladiesChroniques || "",
        vaccins: dossier.sante?.vaccins || [],
        contactsUrgence: dossier.contactsUrgence || { nom: "", lien: "", tel: "" },
        consentementDonnees: dossier.consentement || false,
      });
    }
  }, [dossier]);

  const [allergyInput, setAllergyInput] = useState("");
  const [vaccinInput, setVaccinInput] = useState("");

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.updateProfile(form);
      toast.success("Informations mises à jour avec succès");
      refreshData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

  const handleExportPDF = () => {
    exportPatientPDF(`${user.pseudo || user.email}`, dossier?.sante, treatments, []);
    toast.success("Export PDF généré");
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setForm({ ...form, allergies: [...form.allergies, allergyInput.trim()] });
      setAllergyInput("");
    }
  };

  const removeAllergy = (idx: number) => {
    setForm({ ...form, allergies: form.allergies.filter((_, i) => i !== idx) });
  };

  const addVaccin = () => {
    if (vaccinInput.trim()) {
      setForm({ ...form, vaccins: [...form.vaccins, vaccinInput.trim()] });
      setVaccinInput("");
    }
  };

  const removeVaccin = (idx: number) => {
    setForm({ ...form, vaccins: form.vaccins.filter((_, i) => i !== idx) });
  };

  const Section = ({ icon: Icon, title, children, delay = 0 }: { icon: any; title: string; children: React.ReactNode; delay?: number }) => (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 opacity-0 animate-fade-up" style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display font-semibold text-sm sm:text-base">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex items-start justify-between gap-3 opacity-0 animate-fade-up" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold" style={{ lineHeight: "1.1" }}>Mes Informations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestion de votre dossier de santé personnel</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPDF} className="shrink-0">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </div>

      <form onSubmit={handleSave} className="mt-6 space-y-4 sm:space-y-5">
        <Section icon={User} title="Identité et Profil" delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Sexe</Label>
              <select value={form.sexe} onChange={(e) => setForm({...form, sexe: e.target.value as "H" | "F"})} className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="H">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Âge</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({...form, age: +e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Pseudo</Label>
              <Input value={form.pseudo} readOnly className="mt-1 bg-secondary/50" />
            </div>
          </div>
        </Section>

        <Section icon={Heart} title="Données Médicales" delay={220}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Taille (cm)</Label>
              <Input type="number" value={form.taille || ""} onChange={(e) => setForm({...form, taille: +e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Poids (kg)</Label>
              <Input type="number" value={form.poids || ""} onChange={(e) => setForm({...form, poids: +e.target.value})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Groupe sanguin</Label>
              <select value={form.groupeSanguin} onChange={(e) => setForm({...form, groupeSanguin: e.target.value})} className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Électrophorèse</Label>
              <select value={form.electrophorese} onChange={(e) => setForm({...form, electrophorese: e.target.value})} className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                {["AA","AS","SS","AC","SC","CC"].map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-xs">Allergies</Label>
            <div className="flex gap-2 mt-1">
              <Input value={allergyInput} onChange={(e) => setAllergyInput(e.target.value)} placeholder="Ajouter une allergie" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAllergy(); } }} />
              <Button type="button" variant="outline" size="sm" onClick={addAllergy}>+</Button>
            </div>
            {form.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.allergies.map((a, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-medium">
                    {a}
                    <button type="button" onClick={() => removeAllergy(i)} className="hover:text-destructive/70">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label className="text-xs">Maladies chroniques ou affections de longue durée</Label>
            <Textarea value={form.maladiesChroniques} onChange={(e) => setForm({...form, maladiesChroniques: e.target.value})} className="mt-1" rows={3} placeholder="Précisez vos pathologies..." />
          </div>
        </Section>

        <Section icon={Syringe} title="Suivi des Vaccinations" delay={280}>
          <div className="flex gap-2">
            <Input value={vaccinInput} onChange={(e) => setVaccinInput(e.target.value)} placeholder="Ajouter un vaccin (ex: Fièvre jaune)" className="flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVaccin(); } }} />
            <Button type="button" variant="outline" size="sm" onClick={addVaccin}>+</Button>
          </div>
          {form.vaccins.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.vaccins.map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-medium">
                  {v}
                  <button type="button" onClick={() => removeVaccin(i)} className="hover:text-success/70">×</button>
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section icon={AlertTriangle} title="Contact en cas d'Urgence" delay={340}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Nom complet</Label>
              <Input value={form.contactsUrgence.nom} onChange={(e) => setForm({...form, contactsUrgence: {...form.contactsUrgence, nom: e.target.value}})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Lien de parenté</Label>
              <Input value={form.contactsUrgence.lien} onChange={(e) => setForm({...form, contactsUrgence: {...form.contactsUrgence, lien: e.target.value}})} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Téléphone</Label>
              <Input value={form.contactsUrgence.tel} onChange={(e) => setForm({...form, contactsUrgence: {...form.contactsUrgence, tel: e.target.value}})} className="mt-1" />
            </div>
          </div>
        </Section>

        <Section icon={Shield} title="Confidentialité et Consentement" delay={380}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.consentementDonnees} onChange={(e) => setForm({...form, consentementDonnees: e.target.checked})} className="mt-1 h-4 w-4 rounded border-border text-primary accent-primary" />
            <span className="text-sm text-muted-foreground">
              J'autorise le partage de mes données de santé avec les professionnels de santé habilités dans le cadre de mon suivi médical.
            </span>
          </label>
        </Section>

        <div className="flex justify-end opacity-0 animate-fade-up" style={{ animationDelay: "420ms", animationFillMode: "forwards" }}>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Sauvegarder les modifications
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
