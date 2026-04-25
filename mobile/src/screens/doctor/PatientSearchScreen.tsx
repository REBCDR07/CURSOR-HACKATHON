import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Heading, Input, Muted, Screen, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUsers } from '../../lib/auth';
import { isOnline } from '../../lib/network';
import {
  createAccessRequest,
  enqueueAction,
  getAccessRequests,
  getProfileFor,
  hasActiveDoctorAccess,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';
import type { UserAccount } from '../../types/domain';

export function PatientSearchScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<UserAccount[]>([]);
  const [online, setOnline] = useState(true);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const [users, net] = await Promise.all([getUsers(), isOnline()]);
    setPatients(users.filter((u) => u.role === 'patient'));
    setOnline(net);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, tick]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      return (
        p.nom.toLowerCase().includes(q) ||
        p.prenom.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [patients, query]);

  if (!session) return null;

  const requestAccess = async (patientId: string) => {
    const payload = {
      patientUserId: patientId,
      medecinId: session.userId,
      medecinNom: `Dr. ${session.prenom} ${session.nom}`,
      medecinSpecialite: session.specialite || 'Medecin',
    };

    if (!online) {
      await enqueueAction({ doctorId: session.userId, kind: 'access_request', payload });
      showToast("Demande mise en file d'attente (hors ligne).", { tone: 'warning' });
    } else {
      await createAccessRequest(payload);
      showToast('Demande envoyee au patient.', { tone: 'success' });
    }

    setTick((v) => v + 1);
  };

  const statusFor = async (patientId: string) => {
    const all = await getAccessRequests();
    const reqs = all.filter((r) => r.patientUserId === patientId && r.medecinId === session.userId);
    if (reqs.length === 0) return null;
    return reqs[reqs.length - 1].status;
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <Heading>Patients</Heading>
        <Subheading>Recherche et demandes d'acces</Subheading>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color={colors.muted} />
          <View style={{ flex: 1 }}>
            <Input value={query} onChangeText={setQuery} placeholder="Nom, email ou ID" />
          </View>
        </View>

        {!online ? (
          <Card style={styles.offlineCard}>
            <Text style={styles.offlineTitle}>Mode hors ligne</Text>
            <Muted>Les demandes seront synchronisees plus tard.</Muted>
          </Card>
        ) : null}

        {filtered.length === 0 ? (
          <Card>
            <Muted>Aucun patient.</Muted>
          </Card>
        ) : (
          filtered.map((p) => (
            <PatientRow
              key={p.id}
              patient={p}
              doctorId={session.userId}
              onRequestAccess={requestAccess}
              onOpenRecord={(patientId) => navigation.navigate('PatientRecord', { patientId })}
              statusFor={statusFor}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function PatientRow({
  patient,
  doctorId,
  onRequestAccess,
  onOpenRecord,
  statusFor,
}: {
  patient: UserAccount;
  doctorId: string;
  onRequestAccess: (patientId: string) => Promise<void>;
  onOpenRecord: (patientId: string) => void;
  statusFor: (patientId: string) => Promise<'pending' | 'accepted' | 'refused' | 'revoked' | 'completed' | null>;
}) {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'refused' | 'revoked' | 'completed' | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [profileText, setProfileText] = useState('');

  const loadStatus = useCallback(async () => {
    const [s, access, profile] = await Promise.all([
      statusFor(patient.id),
      hasActiveDoctorAccess(doctorId, patient.id),
      getProfileFor(patient.id),
    ]);
    setStatus(s);
    setHasAccess(access);
    if (!profile) {
      setProfileText('Profil non renseigne');
      return;
    }

    const parts: string[] = [];
    if (profile.groupeSanguin) parts.push(`Groupe ${profile.groupeSanguin}`);
    if (profile.allergies.length) parts.push(`${profile.allergies.length} allergie(s)`);
    if (profile.maladiesChroniques.length) parts.push(`${profile.maladiesChroniques.length} maladie(s)`);
    setProfileText(parts.length ? parts.join(' • ') : 'Aucune donnee publique');
  }, [doctorId, patient.id, statusFor]);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  return (
    <Card style={styles.patientCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.patientName}>{patient.prenom} {patient.nom}</Text>
        <Muted>{patient.email}</Muted>
        <Muted>{profileText}</Muted>
      </View>

      {hasAccess ? (
        <Pressable style={styles.openBtn} onPress={() => onOpenRecord(patient.id)}>
          <Ionicons name="open-outline" size={14} color="#fff" />
          <Text style={styles.openBtnText}>Ouvrir</Text>
        </Pressable>
      ) : status === 'pending' ? (
        <Badge label="En attente" tone="warning" />
      ) : (
        <Pressable style={styles.askBtn} onPress={() => onRequestAccess(patient.id)}>
          <Ionicons name="send-outline" size={14} color={colors.primary} />
          <Text style={styles.askBtnText}>{status === 'refused' ? 'Renvoyer' : 'Demander'}</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  offlineTitle: {
    color: '#92400e',
    fontFamily: fontFamilies.bodyBold,
    marginBottom: 2,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientName: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fontFamilies.bodyBold,
  },
  openBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  openBtnText: {
    color: '#fff',
    fontFamily: fontFamilies.bodyBold,
  },
  askBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  askBtnText: {
    color: colors.primary,
    fontFamily: fontFamilies.bodyBold,
  },
});
