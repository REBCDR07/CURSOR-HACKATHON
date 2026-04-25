import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Badge,
  Card,
  Heading,
  Input,
  Label,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subheading,
  colors,
} from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUsers } from '../../lib/auth';
import { formatDateTimeFr } from '../../lib/ids';
import { readJSON } from '../../lib/kv';
import { isOnline, onNetworkChange } from '../../lib/network';
import { exportPrescriptionPDF } from '../../lib/exportPrescription';
import { flushPendingActions, getDoctorAccessRequests, getDoctorPendingActions } from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';
import type { AccessRequest, LastPrescription, PendingAction, UserAccount } from '../../types/domain';

const LAST_PRESCRIPTION_KEY = 'hp_doctor_last_prescription';

function lastWord(value?: string): string {
  if (!value) return '';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

export function DoctorDashboardScreen() {
  const { session, logout } = useAuth();
  const { showToast } = useToast();

  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [online, setOnline] = useState(true);
  const [lastPrescription, setLastPrescription] = useState<LastPrescription | null>(null);
  const [sharedToken, setSharedToken] = useState('');

  const load = useCallback(async () => {
    if (!session) return;
    const [reqs, pend, users, net] = await Promise.all([
      getDoctorAccessRequests(session.userId),
      getDoctorPendingActions(session.userId),
      getUsers(),
      isOnline(),
    ]);

    const patientUsers = users.filter((u: UserAccount) => u.role === 'patient');
    const last = await readJSON<LastPrescription | null>(LAST_PRESCRIPTION_KEY, null);

    setRequests(reqs);
    setPending(pend);
    setPatientsCount(patientUsers.length);
    setOnline(net);
    setLastPrescription(last && last.doctorId === session.userId ? last : null);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    const sub = onNetworkChange(setOnline);
    return () => sub();
  }, []);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);
  const accepted = useMemo(() => requests.filter((r) => r.status === 'accepted').length, [requests]);
  const completed = useMemo(() => requests.filter((r) => r.status === 'completed').length, [requests]);

  const displayPrenom = useMemo(() => {
    const result = lastWord(session?.prenom);
    return result || 'Medecin';
  }, [session?.prenom]);

  if (!session) return null;

  const syncNow = async () => {
    if (!online) {
      showToast('Toujours hors ligne.', { tone: 'warning' });
      return;
    }

    const n = await flushPendingActions(session.userId);
    showToast(`${n} action(s) traitee(s).`, { tone: 'success' });
    await load();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.rowBetween, compact && styles.rowBetweenCompact]}>
          <View>
            <Heading>Dr. {displayPrenom}</Heading>
            <Muted>{session.specialite || 'Espace medecin'}</Muted>
          </View>
          <Pressable style={styles.logoutRow} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logout}>Sortir</Text>
          </Pressable>
        </View>

        <View style={[styles.grid, compact && styles.gridCompact]}>
          <MetricCard icon="people-outline" value={patientsCount} label="Patients" compact={compact} />
          <MetricCard icon="time-outline" value={pendingCount} label="Demandes en attente" compact={compact} />
          <MetricCard icon="shield-checkmark-outline" value={accepted} label="Acces actifs" compact={compact} />
          <MetricCard icon="document-text-outline" value={completed} label="Ordonnances emises" compact={compact} />
        </View>

        {!online || pending.length > 0 ? (
          <Card style={styles.banner}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name={online ? 'cloud-upload-outline' : 'cloud-offline-outline'} size={16} color="#92400e" />
              <Text style={styles.bannerTitle}>{!online ? 'Mode hors ligne' : 'Actions en attente'}</Text>
            </View>
            <Muted>{pending.length} action(s) en file</Muted>
            <View style={{ marginTop: 8 }}>
              <SecondaryButton label="Voir la file" icon="list-outline" onPress={() => navigation.navigate('DoctorQueue')} />
            </View>
          </Card>
        ) : null}

        <PrimaryButton label="Voir file d'attente" icon="list-outline" onPress={() => navigation.navigate('DoctorQueue')} />
        <SecondaryButton label="Synchroniser" icon="sync-outline" onPress={syncNow} />

        <Card style={styles.qrCard}>
          <Subheading>Ouvrir un dossier partage</Subheading>
          <Label>Token QR</Label>
          <Input value={sharedToken} onChangeText={setSharedToken} placeholder="Coller le token du QR" autoCapitalize="none" />

          <View style={[styles.qrActions, compact && styles.qrActionsCompact]}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Ouvrir token"
                icon="open-outline"
                onPress={() => {
                  const token = sharedToken.trim();
                  if (!token) {
                    showToast('Token requis.', { tone: 'warning' });
                    return;
                  }
                  navigation.navigate('SharedRecord', { token });
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton label="Scanner QR" icon="scan-outline" onPress={() => navigation.navigate('DoctorScanQR')} />
            </View>
          </View>
        </Card>

        {lastPrescription ? (
          <Card>
            <Subheading>Derniere ordonnance</Subheading>
            <Text style={styles.reqName}>{lastPrescription.patientName}</Text>
            <Muted>{formatDateTimeFr(lastPrescription.date)}</Muted>
            <Muted>{lastPrescription.treatments.length} medicament(s)</Muted>
            <View style={{ marginTop: 8 }}>
              <SecondaryButton
                label="Exporter PDF"
                icon="download-outline"
                onPress={async () => {
                  await exportPrescriptionPDF({
                    doctorName: `Dr. ${session.prenom} ${session.nom}`,
                    doctorSpecialite: session.specialite,
                    patientName: lastPrescription.patientName,
                    date: lastPrescription.date,
                    notes: lastPrescription.notes,
                    treatments: lastPrescription.treatments,
                    doctorId: session.userId,
                    patientUserId: lastPrescription.patientUserId,
                    isOnline: online,
                  });
                  showToast('Export PDF lance.', { tone: 'success' });
                }}
              />
            </View>
          </Card>
        ) : null}

        <Subheading>Activite recente</Subheading>
        {requests.length === 0 ? (
          <Card><Muted>Aucune demande pour le moment.</Muted></Card>
        ) : (
          requests
            .slice(-6)
            .reverse()
            .map((r) => (
              <Card key={r.id} style={[styles.reqRow, compact && styles.reqRowCompact]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqName}>Patient #{r.patientUserId.slice(0, 6)}</Text>
                  <Muted>{formatDateTimeFr(r.createdAt)}</Muted>
                </View>
                <View style={compact ? styles.badgeWrapCompact : undefined}>
                  <Badge
                    label={
                      r.status === 'pending'
                        ? 'En attente'
                        : r.status === 'accepted'
                        ? 'Acceptee'
                        : r.status === 'completed'
                        ? 'Ordonnance'
                        : r.status === 'refused'
                        ? 'Refusee'
                        : 'Revoquee'
                    }
                    tone={
                      r.status === 'accepted'
                        ? 'success'
                        : r.status === 'pending'
                        ? 'warning'
                        : r.status === 'completed'
                        ? 'default'
                        : 'danger'
                    }
                  />
                </View>
              </Card>
            ))
        )}
      </ScrollView>
    </Screen>
  );
}

function MetricCard({
  icon,
  value,
  label,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  compact: boolean;
}) {
  return (
    <Card style={[styles.metric, compact && styles.metricCompact]}>
      <View style={styles.metricIconWrap}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Muted>{label}</Muted>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowBetweenCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoutRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  logout: {
    color: colors.danger,
    fontFamily: fontFamilies.bodyBold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCompact: {
    flexDirection: 'column',
  },
  metric: {
    width: '48%',
    paddingVertical: 14,
    gap: 3,
  },
  metricCompact: {
    width: '100%',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fontFamilies.title,
    letterSpacing: 0.3,
  },
  banner: {
    backgroundColor: '#fffbeb',
    borderColor: '#fcd34d',
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  bannerTitle: {
    color: '#92400e',
    fontFamily: fontFamilies.bodyBold,
  },
  qrCard: {
    gap: 8,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 8,
  },
  qrActionsCompact: {
    flexDirection: 'column',
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  reqName: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  badgeWrapCompact: {
    alignSelf: 'flex-start',
  },
});
