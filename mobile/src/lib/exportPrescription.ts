import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Treatment } from '../types/domain';
import { logActivitySafe } from './storage';

interface PrescriptionMeta {
  doctorName: string;
  doctorSpecialite?: string;
  patientName: string;
  date: string;
  notes?: string;
  treatments: Treatment[];
  doctorId?: string;
  patientUserId?: string;
  isOnline?: boolean;
}

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function exportPrescriptionPDF(meta: PrescriptionMeta): Promise<void> {
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a; }
        h1, h2 { margin: 0 0 12px; }
        .row { margin-bottom: 8px; }
        .item { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <h1>Ordonnance Medicale</h1>
      <div class="row"><strong>Medecin:</strong> ${esc(meta.doctorName)} ${meta.doctorSpecialite ? `- ${esc(meta.doctorSpecialite)}` : ''}</div>
      <div class="row"><strong>Patient:</strong> ${esc(meta.patientName)}</div>
      <div class="row"><strong>Date:</strong> ${esc(new Date(meta.date).toLocaleDateString('fr-FR'))}</div>

      <h2>Prescription</h2>
      ${meta.treatments
        .map(
          (t) => `
            <div class="item">
              <p><strong>${esc(t.medicament)}</strong></p>
              <p>Posologie: ${esc(t.posologie)} - ${t.frequence}x/jour</p>
              <p>Heures: ${esc(t.heures.join(', '))}</p>
              <p>Duree: ${t.dureeJours} jours - Debut: ${esc(t.dateDebut)}</p>
              ${t.notes ? `<p>Notes: ${esc(t.notes)}</p>` : ''}
            </div>
          `,
        )
        .join('')}

      ${meta.notes ? `<h2>Instructions</h2><p>${esc(meta.notes)}</p>` : ''}

      <p>Genere le ${new Date().toLocaleString('fr-FR')}.</p>
    </body>
  </html>`;

  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Partager l\'ordonnance PDF',
    });
  }

  if (meta.doctorId && meta.patientUserId) {
    await logActivitySafe(
      meta.doctorId,
      {
        patientUserId: meta.patientUserId,
        type: 'prescription_exported',
        medecinId: meta.doctorId,
        medecinNom: meta.doctorName,
        medecinSpecialite: meta.doctorSpecialite,
        details: `Ordonnance exportee en PDF (${meta.treatments.length} medicament(s))`,
      },
      meta.isOnline ?? true,
    );
  }
}
