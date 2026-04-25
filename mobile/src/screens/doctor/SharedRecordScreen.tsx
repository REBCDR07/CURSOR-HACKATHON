import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Heading, Muted, Screen, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../lib/auth';
import {
  calculateAdherence,
  getProfileFor,
  getTreatmentsFor,
  logActivitySafe,
  validateQRTokenForDoctor,
} from '../../lib/storage';
import { isOnline } from '../../lib/network';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';
import type { PatientProfile, Treatment } from '../../types/domain';

type Props = NativeStackScreenProps<DoctorStackParamList, 'SharedRecord'>;

export function SharedRecordScreen({ route }: Props) {
  const { token } = route.params;
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState('Patient');
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || session.role !== 'medecin') {
      setError('Connexion medecin requise.');
      return;
    }

    const validation = await validateQRTokenForDoctor(token);
    if (!validation.ok) {
      setError(
        validation.reason === 'expired'
          ? 'QR code expire.'
          : validation.reason === 'revoked'
          ? 'QR code revoque.'
          : 'QR code invalide.',
      );
      return;
    }

    const [users, p, ts, online] = await Promise.all([
      getUsers(),
      getProfileFor(validation.patientUserId),
      getTreatmentsFor(validation.patientUserId),
      isOnline(),
    ]);

    const patient = users.find((u) => u.id === validation.patientUserId);
    setPatientName(patient ? `${patient.prenom} ${patient.nom}` : `Patient #${validation.patientUserId.slice(0, 6)}`);
    setProfile(p);
    setTreatments(ts);
    setExpiresAt(validation.expiresAt);
    setError(null);

    await logActivitySafe(
      session.userId,
      {
        patientUserId: validation.patientUserId,
        type: 'record_viewed',
        medecinId: session.userId,
        medecinNom: `Dr. ${session.prenom} ${session.nom}`,
        medecinSpecialite: session.specialite,
        details: 'Consultation via QR code partage',
      },
      online,
    );
  }, [session, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const active = useMemo(() => treatments.filter((t) => t.actif), [treatments]);
  const completed = useMemo(() => treatments.filter((t) => !t.actif), [treatments]);

  if (error) {
    return (
      <Screen>
        <Card style={styles.errorCard}>
          <View style={styles.errorRow}><Ionicons name="lock-closed-outline" size={18} color="#9f1239" /><Text style={styles.errorTitle}>Acces refuse</Text></View>
          <Muted>{error}</Muted>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Dossier partage</Heading>
        <Muted>{patientName}</Muted>
        {expiresAt ? <Muted>Expire le {new Date(expiresAt).toLocaleString('fr-FR')}</Muted> : null}

        <Badge label="Lecture seule" tone="warning" />

        <View style={styles.badges}>
          {profile?.groupeSanguin ? <Badge label={`Groupe ${profile.groupeSanguin}`} tone="danger" /> : null}
          <Badge label={`${active.length} actifs`} tone="default" />
          <Badge label={`${completed.length} termines`} tone="warning" />
        </View>

        {profile?.allergies.length ? (
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}><Ionicons name="alert-circle-outline" size={16} color="#9f1239" /><Text style={styles.alertTitle}>Allergies</Text></View>
            <Muted>{profile.allergies.join(', ')}</Muted>
          </Card>
        ) : null}

        {profile?.maladiesChroniques.length ? (
          <Card>
            <Subheading>Maladies chroniques</Subheading>
            <Muted>{profile.maladiesChroniques.join(', ')}</Muted>
          </Card>
        ) : null}

        <Subheading>Traitements en cours</Subheading>
        {active.length === 0 ? (
          <Card><Muted>Aucun traitement actif.</Muted></Card>
        ) : (
          active.map((t) => (
            <Card key={t.id}>
              <Text style={styles.treatName}>{t.medicament}</Text>
              <Muted>{t.posologie} - {t.frequence}x/jour</Muted>
              <Muted>{t.heures.join(', ')} - adherence {calculateAdherence(t)}%</Muted>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  errorCard: {
    marginTop: 24,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorTitle: {
    color: '#9f1239',
    fontFamily: fontFamilies.bodyBold,
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  alertCard: {
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertTitle: {
    color: '#9f1239',
    fontFamily: fontFamilies.bodyBold,
  },
  treatName: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
});
