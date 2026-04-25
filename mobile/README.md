# HealthPocket Mobile (Expo)

Application mobile React Native/Expo du projet HealthPocket.

## Stack

- Expo SDK 54
- React Native 0.81
- React Navigation (stack + tabs)
- AsyncStorage + chiffrement applicatif
- Expo SecureStore (cle maitre chiffrement)
- Expo Camera (scan QR natif)
- Expo Notifications
- Expo Print + Sharing (export PDF)
- EAS Build/Submit (config ready)

## Demarrage

```bash
cd mobile
npm install
npm run start
```

Puis ouvrir dans:

- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

Verification:

```bash
npm run typecheck
npm run build:web
```

## Fonctionnalites migrees

### Public

- Landing
- Connexion
- Inscription patient / medecin

### Patient

- Dashboard (prises du jour, adherence, raccourcis)
- Traitements (liste, archivage, suppression)
- Ajout traitement
- Historique
- Profil medical (edition + demandes d'acces)
- Journal d'activite
- Partage QR (generation/revocation token)
- Export PDF carnet
- Rappels notifications locales

### Medecin

- Dashboard (stats, synchronisation, export derniere ordonnance)
- Recherche patient + demande d'acces
- Suivi des demandes
- Profil medecin
- File d'attente hors-ligne
- Dossier patient autorise
- Nouvelle ordonnance
- Consultation dossier partage via token QR
- Scan QR camera natif (expo-camera)
- Export PDF ordonnance

## Donnees, chiffrement et hors-ligne

- Donnees persistees localement dans AsyncStorage.
- Chiffrement automatique des cles sensibles avec envelope chiffree.
- Cle maitre stockee dans SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`).
- Migration automatique des anciennes valeurs en clair vers le format chiffre.
- Queue offline medecin pour:
  - demandes d'acces
  - ordonnances
  - logs activite
- Synchronisation manuelle + auto via etat reseau.

## EAS build

Configuration fournie dans `eas.json`.

Commandes:

```bash
npm run eas:build:preview
npm run eas:build:android
npm run eas:build:ios
npm run eas:submit:android
npm run eas:submit:ios
```

## Limites actuelles

- Pas de backend: donnees locales a l'appareil uniquement.
- UI volontairement simple (base fonctionnelle complete, pas design final).
- Validation QR cote medecin basee sur token; scan image galerie non implemente.
- Gestion de rotation de cle et re-chiffrement global non implementee.

## Prochaines etapes recommandees

1. Ajouter backend/API pour synchronisation multi-appareils.
2. Ajouter rotation de cle et workflow rekey.
3. Ajouter tests e2e mobile et unit tests metier.
4. Finaliser branding/design system mobile.
