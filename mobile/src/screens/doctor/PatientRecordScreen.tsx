import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Heading, Muted, PrimaryButton, Screen, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../lib/auth';
import {
  calculateAdherence,
  getProfileFor,
  getTreatmentsFor,
  hasActiveDoctorAccess,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';
import type { PatientProfile, Treatment, UserAccount } from '../../types/domain';

type Props = NativeStackScreenProps<DoctorStackParamList, 'PatientRecord'>;

export function PatientRecordScreen({ navigation, route }: Props) {
  const { patientId } = route.params;
  const { session } = useAuth();
  const [patient, setPatient] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [allowed, setAllowed] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;

    const [users, p, ts, access] = await Promise.all([
      getUsers(),
      getProfileFor(patientId),
      getTreatmentsFor(patientId),
      hasActiveDoctorAccess(session.userId, patientId),
    ]);

    setPatient(users.find((u) => u.id === patientId) ?? null);
    setProfile(p);
    setTreatments(ts);
    setAllowed(access);
  }, [patientId, session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const active = useMemo(() => treatments.filter((t) => t.actif), [treatments]);
  const completed = useMemo(() => treatments.filter((t) => !t.actif), [treatments]);
  const avgAdherence = useMemo(() => {
    if (active.length === 0) return 0;
    return Math.round(active.reduce((sum, t) => sum + calculateAdherence(t), 0) / active.length);
  }, [active]);

  if (!session) return null;

  if (!allowed) {
    return (
      <Screen>
        <Card style={styles.denied}>
          <View style={styles.deniedRow}><Ionicons name="lock-closed-outline" size={18} color="#92400e" /><Text style={styles.deniedTitle}>Acces non autorise</Text></View>
          <Muted>Le patient n'a pas encore accepte votre demande.</Muted>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>{patient ? `${patient.prenom} ${patient.nom}` : 'Patient'}</Heading>
        {patient ? <Muted>{patient.email}</Muted> : null}

        <View style={styles.badges}>
          <Badge label={`Adherence ${avgAdherence}%`} tone="success" />
          <Badge label={`${active.length} actifs`} tone="default" />
          <Badge label={`${completed.length} termines`} tone="warning" />
          {profile?.groupeSanguin ? <Badge label={profile.groupeSanguin} tone="danger" /> : null}
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

        {profile?.electrophorese ? (
          <Card>
            <Subheading>Electrophorese</Subheading>
            <Muted>{profile.electrophorese}</Muted>
          </Card>
        ) : null}

        <Subheading>Traitements en cours</Subheading>
        {active.length === 0 ? (
          <Card><Muted>Aucun traitement actif.</Muted></Card>
        ) : (
          active.map((t) => (
            <Card key={t.id}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.treatName}>{t.medicament}</Text>
                  <Muted>{t.posologie} - {t.frequence}x/jour</Muted>
                  <Muted>{t.heures.join(', ')} - {t.dureeJours} jours</Muted>
                </View>
                <Badge label={`${calculateAdherence(t)}%`} tone="success" />
              </View>
            </Card>
          ))
        )}

        <PrimaryButton
          label="Nouvelle ordonnance"
          icon="document-text-outline"
          onPress={() => navigation.navigate('NewPrescription', { patientId })}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  denied: {
    marginTop: 20,
    borderColor: '#fcd34d',
    backgroundColor: '#fffbeb',
  },
  deniedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deniedTitle: {
    color: '#92400e',
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
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  treatName: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
});
