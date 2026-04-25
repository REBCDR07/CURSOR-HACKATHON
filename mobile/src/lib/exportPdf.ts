import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { PatientProfile, Treatment } from '../types/domain';
import { calculateAdherence } from './storage';

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function exportCarnetPDF(profile: PatientProfile, treatments: Treatment[]): Promise<void> {
  const actifs = treatments.filter((t) => t.actif);
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #0f172a; }
        h1, h2 { margin: 0 0 12px; }
        .meta { margin-bottom: 20px; color: #334155; }
        .block { margin-bottom: 18px; }
        .item { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <h1>HealthPocket - Carnet de sante</h1>
      <p class="meta">Code patient: ${esc(profile.id.slice(0, 8).toUpperCase())}</p>

      <div class="block">
        <h2>Profil</h2>
        <p>Pseudo: ${esc(profile.pseudo || 'Anonyme')}</p>
        <p>Age: ${esc(String(profile.age ?? 'Non renseigne'))}</p>
        <p>Sexe: ${esc(profile.sexe || 'Non renseigne')}</p>
        <p>Groupe sanguin: ${esc(profile.groupeSanguin || 'Non renseigne')}</p>
        <p>Allergies: ${esc(profile.allergies.join(', ') || 'Aucune')}</p>
        <p>Electrophorese: ${esc(profile.electrophorese || 'Non renseigne')}</p>
        <p>Maladies chroniques: ${esc(profile.maladiesChroniques.join(', ') || 'Aucune')}</p>
      </div>

      <div class="block">
        <h2>Traitements actifs (${actifs.length})</h2>
        ${actifs
          .map(
            (t) => `
              <div class="item">
                <p><strong>${esc(t.medicament)}</strong></p>
                <p>${esc(t.posologie)} - ${t.frequence}x/jour</p>
                <p>Heures: ${esc(t.heures.join(', '))}</p>
                <p>Duree: ${t.dureeJours} jours - Debut: ${esc(t.dateDebut)}</p>
                <p>Adherence: ${calculateAdherence(t)}%</p>
                ${t.notes ? `<p>Notes: ${esc(t.notes)}</p>` : ''}
              </div>
            `,
          )
          .join('')}
      </div>

      <p>Genere le ${new Date().toLocaleString('fr-FR')}.</p>
    </body>
  </html>`;

  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Partager le carnet PDF',
    });
  }
}
