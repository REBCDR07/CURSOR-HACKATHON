import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Card,
  Heading,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subheading,
  colors,
} from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { exportCarnetPDF } from '../../lib/exportPdf';
import {
  calculateAdherence,
  getProfile,
  getTodayPrises,
  getTreatments,
  markPrise,
} from '../../lib/storage';
import {
  areRemindersRunning,
  hasNotificationPermission,
  requestNotificationPermission,
  startReminderCheck,
} from '../../lib/notifications';
import { fontFamilies } from '../../theme/fonts';
import type { PatientStackParamList } from '../../navigation/types';
import type { PatientProfile, PriseRecord, Treatment } from '../../types/domain';

interface TodayItem {
  treatment: Treatment;
  prise: PriseRecord;
}

function lastWord(value?: string): string {
  if (!value) return '';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}

export function PatientDashboardScreen() {
  const { session, logout } = useAuth();
  const { showToast } = useToast();

  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, t, all] = await Promise.all([getProfile(), getTodayPrises(), getTreatments()]);
    setProfile(p);
    setTodayItems(t);
    setAllTreatments(all);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    void (async () => {
      const granted = await hasNotificationPermission();
      if (granted) {
        startReminderCheck();
      }
    })();
  }, []);

  const displayPrenom = useMemo(() => {
    const result = lastWord(session?.prenom);
    return result || 'Patient';
  }, [session?.prenom]);

  const globalAdherence = useMemo(() => {
    const active = allTreatments.filter((t) => t.actif);
    if (active.length === 0) return 100;
    return Math.round(active.reduce((sum, t) => sum + calculateAdherence(t), 0) / active.length);
  }, [allTreatments]);

  const todayTaken = todayItems.filter((i) => i.prise.pris).length;

  const handleMarkTaken = async (item: TodayItem) => {
    try {
      await markPrise(item.treatment.id, item.prise.date, item.prise.heure);
      await load();
      showToast('Prise marquee comme effectuee.', { tone: 'success' });
    } catch {
      showToast('Impossible de marquer cette prise.', { tone: 'error' });
    }
  };

  const handleEnableNotif = async () => {
    if (areRemindersRunning()) {
      showToast('Les rappels sont deja actifs.', { tone: 'info' });
      return;
    }

    const granted = await requestNotificationPermission();
    if (!granted) {
      showToast('Permission refusee. Active-la dans les reglages du navigateur/app.', { tone: 'warning' });
      return;
    }

    startReminderCheck();
    showToast('Rappels actives: notifications proches, a l\'heure et en retard.', { tone: 'success' });
  };

  const activeCount = allTreatments.filter((t) => t.actif).length;
  const completedCount = allTreatments.filter((t) => !t.actif).length;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.rowBetween, compact && styles.rowBetweenCompact]}>
          <View>
            <Heading>Bonjour {displayPrenom}</Heading>
            <Muted>{profile?.groupeSanguin ? `Groupe ${profile.groupeSanguin}` : 'Profil a completer'}</Muted>
          </View>
          <Pressable style={styles.logoutRow} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logout}>Sortir</Text>
          </Pressable>
        </View>

        <View style={[styles.metricsGrid, compact && styles.metricsGridCompact]}>
          <Card style={[styles.metricCard, compact && styles.metricCardCompact]}>
            <View style={styles.metricIcon}><Ionicons name="pulse-outline" size={18} color={colors.primary} /></View>
            <Text style={styles.metricValue}>{globalAdherence}%</Text>
            <Muted>Adherence globale</Muted>
          </Card>
          <Card style={[styles.metricCard, compact && styles.metricCardCompact]}>
            <View style={styles.metricIcon}><Ionicons name="checkmark-done-outline" size={18} color={colors.primary} /></View>
            <Text style={styles.metricValue}>{todayTaken}/{todayItems.length}</Text>
            <Muted>Prises aujourd'hui</Muted>
          </Card>
          <Card style={[styles.metricCard, compact && styles.metricCardCompact]}>
            <View style={styles.metricIcon}><Ionicons name="medkit-outline" size={18} color={colors.primary} /></View>
            <Text style={styles.metricValue}>{activeCount}</Text>
            <Muted>Actifs</Muted>
          </Card>
          <Card style={[styles.metricCard, compact && styles.metricCardCompact]}>
            <View style={styles.metricIcon}><Ionicons name="archive-outline" size={18} color={colors.primary} /></View>
            <Text style={styles.metricValue}>{completedCount}</Text>
            <Muted>Termines</Muted>
          </Card>
        </View>

        <View style={[styles.quickRow, compact && styles.quickRowCompact]}>
          <View style={{ flex: 1 }}>
            <PrimaryButton label="Ajouter" onPress={() => navigation.navigate('AddTreatment')} icon="add-circle-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Journal" onPress={() => navigation.navigate('Activity')} icon="time-outline" />
          </View>
        </View>

        <View style={[styles.quickRow, compact && styles.quickRowCompact]}>
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Partage QR" onPress={() => navigation.navigate('QRShare')} icon="qr-code-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton
              label="Export PDF"
              icon="download-outline"
              onPress={async () => {
                if (!profile) {
                  showToast('Profil introuvable pour export.', { tone: 'warning' });
                  return;
                }
                await exportCarnetPDF(profile, allTreatments);
                showToast('Export PDF lance.', { tone: 'success' });
              }}
            />
          </View>
        </View>

        <SecondaryButton label="Activer notifications" onPress={handleEnableNotif} icon="notifications-outline" />

        <View>
          <Subheading>Prises du jour</Subheading>
          {loading ? <Muted>Chargement...</Muted> : null}
          {todayItems.length === 0 ? (
            <Card>
              <Muted>Aucune prise prevue aujourd'hui.</Muted>
            </Card>
          ) : (
            todayItems.map((item) => {
              const adherence = calculateAdherence(item.treatment);
              const late = !item.prise.pris && item.prise.date === new Date().toISOString().split('T')[0]
                ? item.prise.heure < `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                : false;

              return (
                <Card key={`${item.treatment.id}-${item.prise.heure}`} style={styles.treatmentCard}>
                  <View style={[styles.rowBetween, compact && styles.treatmentRowCompact]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.treatName}>{item.treatment.medicament}</Text>
                      <Muted>{item.treatment.posologie}</Muted>
                      <Text style={styles.time}>{item.prise.heure}</Text>
                      <Muted>Adherence: {adherence}%</Muted>
                      {late ? <Text style={styles.late}>En retard</Text> : null}
                    </View>
                    {item.prise.pris ? (
                      <View style={[styles.donePill, compact && styles.itemActionCompact]}><Ionicons name="checkmark-circle" size={14} color="#166534" /><Text style={styles.donePillText}>Pris</Text></View>
                    ) : (
                      <Pressable style={[styles.takeBtn, compact && styles.itemActionCompact]} onPress={() => handleMarkTaken(item)}>
                        <Ionicons name="checkmark-outline" size={16} color="#fff" />
                        <Text style={styles.takeBtnText}>Je l'ai pris</Text>
                      </Pressable>
                    )}
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: 12,
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
    alignItems: 'center',
    gap: 4,
  },
  logout: {
    color: colors.danger,
    fontFamily: fontFamilies.bodyBold,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricsGridCompact: {
    flexDirection: 'column',
  },
  metricCard: {
    width: '48%',
    paddingVertical: 14,
    gap: 4,
  },
  metricCardCompact: {
    width: '100%',
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf3',
  },
  metricValue: {
    fontSize: 24,
    color: colors.text,
    fontFamily: fontFamilies.title,
    letterSpacing: 0.3,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickRowCompact: {
    flexDirection: 'column',
  },
  treatmentCard: {
    marginBottom: 8,
  },
  treatmentRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  itemActionCompact: {
    alignSelf: 'flex-start',
  },
  treatName: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
  },
  time: {
    marginTop: 6,
    fontSize: 28,
    color: colors.text,
    fontFamily: fontFamilies.title,
  },
  late: {
    marginTop: 4,
    color: colors.danger,
    fontFamily: fontFamilies.bodyBold,
  },
  takeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  takeBtnText: {
    color: '#fff',
    fontFamily: fontFamilies.bodyBold,
  },
  donePill: {
    borderRadius: 999,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  donePillText: {
    color: '#166534',
    fontFamily: fontFamilies.bodyBold,
  },
});
