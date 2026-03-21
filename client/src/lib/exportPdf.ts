import { jsPDF } from "jspdf";
import { PatientInfos, Treatment, Prescription } from "@/contexts/AppDataContext";

export function exportPatientPDF(
  patientName: string,
  infos: PatientInfos | null,
  treatments: Treatment[],
  prescriptions: Prescription[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text: string, size = 10, bold = false) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, pageWidth - 40);
    doc.text(lines, 20, y);
    y += lines.length * (size * 0.5) + 2;
  };

  const addSection = (title: string) => {
    y += 4;
    doc.setDrawColor(158, 24, 43); // red wine
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 6;
    addLine(title, 13, true);
    y += 2;
  };

  // Header
  doc.setFillColor(158, 24, 43);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("MonCarnet Santé", 20, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dossier médical — ${patientName}`, 20, 23);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 20, 30);
  doc.setTextColor(0, 0, 0);
  y = 45;

  // Profile
  if (infos) {
    addSection("Informations personnelles");
    addLine(`Sexe : ${infos.sexe === "H" ? "Homme" : "Femme"}  ·  Né(e) le ${infos.dateNaissance}  ·  ${infos.villeNaissance}`);
    addLine(`Adresse : ${infos.adresse}, ${infos.codePostal} ${infos.ville}`);
    addLine(`Téléphone : ${infos.telephone}`);

    addSection("Données médicales");
    addLine(`Taille : ${infos.taille} cm  ·  Poids : ${infos.poids} kg`);
    addLine(`Groupe sanguin : ${infos.groupeSanguin}  ·  Électrophorèse : ${infos.electrophorese}`);
    if (infos.allergies.length > 0) addLine(`Allergies : ${infos.allergies.join(", ")}`);
    if (infos.pathologies) addLine(`Pathologies : ${infos.pathologies}`);
    if (infos.traitements) addLine(`Traitements déclarés : ${infos.traitements}`);
    if (infos.vaccins.length > 0) addLine(`Vaccins : ${infos.vaccins.join(", ")}`);

    addSection("Personne d'urgence");
    addLine(`${infos.personneUrgence.nom} (${infos.personneUrgence.lien}) — Tél : ${infos.personneUrgence.tel}`);
  }

  // Treatments
  if (treatments.length > 0) {
    addSection("Traitements en cours");
    treatments.filter(t => t.active).forEach((t) => {
      addLine(`• ${t.medicament} — ${t.posologie}, ${t.frequence}, ${t.duree} jours`, 10, true);
      if (t.notes) addLine(`  Notes : ${t.notes}`);
    });
  }

  // Prescriptions
  if (prescriptions.length > 0) {
    addSection("Ordonnances");
    prescriptions.forEach((p) => {
      addLine(`• ${p.medicament} — prescrit par ${p.doctorName} (${p.doctorSpecialite})`, 10, true);
      addLine(`  ${p.posologie}, ${p.frequence}, ${p.duree} jours`);
      if (p.notes) addLine(`  Notes : ${p.notes}`);
      addLine(`  Date : ${new Date(p.createdAt).toLocaleDateString("fr-FR")}`);
    });
  }

  // Footer
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Document généré par MonCarnet Santé — Confidentiel", 20, y);

  doc.save(`MonCarnet_${patientName.replace(/\s/g, "_")}.pdf`);
}

export function exportPrescriptionPDF(prescription: Prescription) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(158, 24, 43);
  doc.rect(0, 0, pw, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ORDONNANCE MÉDICALE", 20, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${prescription.doctorName} — ${prescription.doctorSpecialite}`, 20, 23);
  doc.text(`Date : ${new Date(prescription.createdAt).toLocaleDateString("fr-FR")}`, 20, 30);

  doc.setTextColor(0, 0, 0);
  let y = 50;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Patient : ${prescription.patientName}`, 20, y); y += 8;
  doc.text(`Poids : ${prescription.poids} kg`, 20, y); y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(prescription.medicament, 20, y); y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Posologie : ${prescription.posologie}`, 20, y); y += 7;
  doc.text(`Fréquence : ${prescription.frequence}`, 20, y); y += 7;
  doc.text(`Durée : ${prescription.duree} jours`, 20, y); y += 10;

  if (prescription.notes) {
    doc.text(`Notes : ${prescription.notes}`, 20, y); y += 10;
  }

  y += 20;
  doc.setDrawColor(158, 24, 43);
  doc.line(20, y, 80, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Signature du médecin", 20, y);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Document généré par MonCarnet Santé — Confidentiel", 20, 280);

  doc.save(`Ordonnance_${prescription.medicament.replace(/\s/g, "_")}.pdf`);
}
