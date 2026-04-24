import jsPDF from 'jspdf';
import { PatientProfile, Treatment, calculateAdherence } from './storage';

export function exportCarnetPDF(profile: PatientProfile, treatments: Treatment[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('HealthPocket BJ — Carnet de Santé', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Code d'accès
  const code = profile.id.substring(0, 8).toUpperCase();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Code d'accès: ${code}`, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Profil
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Profil Patient', 20, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const infos = [
    `Pseudo: ${profile.pseudo || 'Anonyme'}`,
    `Âge: ${profile.age || 'Non renseigné'}`,
    `Sexe: ${profile.sexe || 'Non renseigné'}`,
    `Groupe sanguin: ${profile.groupeSanguin || 'Non renseigné'}`,
    `Allergies: ${profile.allergies.length ? profile.allergies.join(', ') : 'Aucune'}`,
    `Électrophorèse: ${profile.electrophorese || 'Non renseigné'}`,
    `Maladies chroniques: ${profile.maladiesChroniques.length ? profile.maladiesChroniques.join(', ') : 'Aucune'}`,
  ];
  for (const info of infos) {
    doc.text(info, 20, y);
    y += 6;
  }
  y += 6;

  // Traitements actifs
  const actifs = treatments.filter(t => t.actif);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Traitements Actifs (${actifs.length})`, 20, y);
  y += 8;

  for (const t of actifs) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${t.medicament}`, 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`  Posologie: ${t.posologie} — ${t.frequence}x/jour`, 24, y);
    y += 5;
    doc.text(`  Horaires: ${t.heures.join(', ')}`, 24, y);
    y += 5;
    doc.text(`  Durée: ${t.dureeJours} jours — Début: ${t.dateDebut}`, 24, y);
    y += 5;
    doc.text(`  Adhésion: ${calculateAdherence(t)}%`, 24, y);
    y += 5;
    if (t.notes) {
      doc.text(`  Notes: ${t.notes}`, 24, y);
      y += 5;
    }
    y += 4;
  }

  // Footer
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — HealthPocket BJ`, pageWidth / 2, 285, { align: 'center' });

  doc.save(`healthpocket_${code}.pdf`);
}
