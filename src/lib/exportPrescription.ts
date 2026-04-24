import jsPDF from 'jspdf';
import type { Treatment } from './storage';
import { logActivitySafe } from './storage';

interface PrescriptionMeta {
  doctorName: string;
  doctorSpecialite?: string;
  patientName: string;
  date: string;
  notes?: string;
  treatments: Treatment[];
  // Optional IDs — when provided, an audit entry is added to the patient's activity log.
  doctorId?: string;
  patientUserId?: string;
}

export function exportPrescriptionPDF(meta: PrescriptionMeta) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Ordonnance Médicale', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('HealthPocket BJ', pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Doctor / Patient block
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Médecin :', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${meta.doctorName}${meta.doctorSpecialite ? ' — ' + meta.doctorSpecialite : ''}`, 50, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Patient :', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(meta.patientName, 50, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Date :', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(meta.date).toLocaleDateString('fr-FR'), 50, y);
  y += 10;

  doc.setLineWidth(0.3);
  doc.line(20, y, pageWidth - 20, y);
  y += 8;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Prescription', 20, y);
  y += 8;

  doc.setFontSize(11);
  for (const t of meta.treatments) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${t.medicament}`, 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Posologie : ${t.posologie} — ${t.frequence}x / jour`, 24, y); y += 5;
    doc.text(`Heures : ${t.heures.join(', ')}`, 24, y); y += 5;
    doc.text(`Durée : ${t.dureeJours} jours — Début : ${t.dateDebut}`, 24, y); y += 5;
    if (t.notes) { doc.text(`Notes : ${t.notes}`, 24, y); y += 5; }
    y += 4;
  }

  if (meta.notes) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('Instructions complémentaires', 20, y); y += 6;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(meta.notes, pageWidth - 40);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 4;
  }

  // Signature line
  if (y > 250) { doc.addPage(); y = 20; }
  y = Math.max(y, 240);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 80, y, pageWidth - 20, y);
  doc.setFontSize(10);
  doc.text('Signature du médecin', pageWidth - 50, y + 5, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Généré par HealthPocket BJ — ${new Date().toLocaleString('fr-FR')}`, pageWidth / 2, 290, { align: 'center' });

  const safeName = meta.patientName.replace(/\s+/g, '_').toLowerCase();
  doc.save(`ordonnance_${safeName}_${meta.date.split('T')[0]}.pdf`);

  // Audit log: add to the patient's activity feed if we have the IDs.
  if (meta.doctorId && meta.patientUserId) {
    logActivitySafe(meta.doctorId, {
      patientUserId: meta.patientUserId,
      type: 'prescription_exported',
      medecinId: meta.doctorId,
      medecinNom: meta.doctorName,
      medecinSpecialite: meta.doctorSpecialite,
      details: `Ordonnance exportée en PDF (${meta.treatments.length} médicament(s))`,
    });
  }
}
