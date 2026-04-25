import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Muted, PrimaryButton, Screen, SecondaryButton, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTimeFr } from '../../lib/ids';
import { isOnline, onNetworkChange } from '../../lib/network';
import {
  flushPendingActions,
  getDoctorPendingActions,
  removePendingAction,
  retryPendingAction,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { PendingAction } from '../../types/domain';

export function DoctorQueueScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState<PendingAction[]>([]);
  const [online, setOnline] = useState(true);

  const load = useCallback(async () => {
    if (!session) return;
    const [pend, net] = await Promise.all([getDoctorPendingActions(session.userId), isOnline()]);
    setItems(pend);
    setOnline(net);
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

  if (!session) return null;

  const flushAll = async () => {
    if (!online) {
      showToast('Toujours hors ligne.', { tone: 'warning' });
      return;
    }
    const n = await flushPendingActions(session.userId);
    showToast(`${n} action(s) traitee(s).`, { tone: 'success' });
    await load();
  };

  const retryOne = async (id: string) => {
    if (!online) {
      showToast('Reviens en ligne pour relancer.', { tone: 'warning' });
      return;
    }
    const ok = await retryPendingAction(id);
    showToast(ok ? 'Action envoyee.' : 'Echec lors de la relance.', { tone: ok ? 'success' : 'error' });
    await load();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <Heading>File d'attente</Heading>
        <Subheading>Synchronisation hors ligne</Subheading>
        <Muted>{online ? 'En ligne' : 'Hors ligne'} - {items.length} action(s)</Muted>

        {online && items.length > 0 ? <PrimaryButton label="Tout synchroniser" icon="sync-outline" onPress={flushAll} /> : null}

        {items.length === 0 ? (
          <Card>
            <Muted>Aucune action en attente.</Muted>
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} style={styles.item}>
              <View style={styles.kindRow}>
                <Ionicons name="cloud-upload-outline" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.kind}>{a.kind}</Text>
                  <Muted>{formatDateTimeFr(a.createdAt)}</Muted>
                  {a.status === 'failed' ? <Text style={styles.failed}>Echec: {a.lastError}</Text> : null}
                </View>
              </View>
              <View style={styles.actions}>
                <SecondaryButton label="Relancer" icon="refresh-outline" onPress={() => retryOne(a.id)} />
                <Pressable
                  style={styles.cancelBtn}
                  onPress={async () => {
                    await removePendingAction(a.id);
                    await load();
                    showToast('Action annulee.', { tone: 'info' });
                  }}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#991b1b" />
                  <Text style={styles.cancelText}>Annuler</Text>
                </Pressable>
              </View>
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
  item: {
    gap: 10,
  },
  kindRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  kind: {
    color: colors.text,
    textTransform: 'capitalize',
    fontFamily: fontFamilies.bodyBold,
  },
  failed: {
    color: colors.danger,
    marginTop: 3,
    fontFamily: fontFamilies.bodyMedium,
  },
  actions: {
    gap: 6,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    gap: 6,
  },
  cancelText: {
    color: '#991b1b',
    fontFamily: fontFamilies.bodyBold,
  },
});
