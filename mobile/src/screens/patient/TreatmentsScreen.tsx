import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Badge, Card, Heading, Muted, PrimaryButton, Screen, Subheading, colors } from '../../components/UI';
import {
  calculateAdherence,
  getTreatments,
  saveTreatments,
  updateTreatment,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { PatientStackParamList } from '../../navigation/types';
import type { Treatment } from '../../types/domain';

export function TreatmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PatientStackParamList>>();
  const { width } = useWindowDimensions();
  const compact = width < 390;

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [filter, setFilter] = useState<'actif' | 'archive'>('actif');

  const load = useCallback(async () => {
    setTreatments(await getTreatments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(
    () => treatments.filter((t) => (filter === 'actif' ? t.actif : !t.actif)),
    [filter, treatments],
  );

  const archive = async (id: string) => {
    await updateTreatment(id, { actif: false });
    await load();
  };

  const remove = async (id: string) => {
    const next = treatments.filter((t) => t.id !== id);
    await saveTreatments(next);
    await load();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.rowBetween, compact && styles.rowBetweenCompact]}>
          <Heading>Traitements</Heading>
          <View style={compact ? styles.fullWidth : styles.addBtnWrap}>
            <PrimaryButton label="Ajouter" icon="add-outline" onPress={() => navigation.navigate('AddTreatment')} />
          </View>
        </View>

        <Subheading>{filter === 'actif' ? 'En cours' : 'Archives'}</Subheading>

        <View style={styles.tabRow}>
          <Pressable style={[styles.tab, filter === 'actif' && styles.tabActive]} onPress={() => setFilter('actif')}>
            <Ionicons name="pulse-outline" size={15} color={filter === 'actif' ? '#fff' : colors.muted} />
            <Text style={[styles.tabText, filter === 'actif' && styles.tabTextActive]}>En cours</Text>
          </Pressable>
          <Pressable style={[styles.tab, filter === 'archive' && styles.tabActive]} onPress={() => setFilter('archive')}>
            <Ionicons name="archive-outline" size={15} color={filter === 'archive' ? '#fff' : colors.muted} />
            <Text style={[styles.tabText, filter === 'archive' && styles.tabTextActive]}>Archives</Text>
          </Pressable>
        </View>

        {filtered.length === 0 ? (
          <Card>
            <Muted>Aucun traitement dans cette vue.</Muted>
          </Card>
        ) : (
          filtered.map((t) => (
            <Card key={t.id} style={styles.card}>
              <View style={[styles.rowBetween, compact && styles.rowBetweenCompact]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.medicament}</Text>
                  <Muted>{t.posologie} - {t.frequence}x/jour</Muted>
                  <Muted>{t.heures.join(', ')} - {t.dureeJours} jours</Muted>
                </View>
                <View style={compact ? styles.badgeCompact : undefined}>
                  <Badge label={`${calculateAdherence(t)}%`} tone="success" />
                </View>
              </View>

              {t.notes ? <Text style={styles.notes}>{t.notes}</Text> : null}

              <View style={[styles.actions, compact && styles.actionsCompact]}>
                {t.actif ? (
                  <Pressable style={styles.archiveBtn} onPress={() => archive(t.id)}>
                    <Ionicons name="archive-outline" size={14} color={colors.text} />
                    <Text style={styles.archiveBtnText}>Archiver</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.deleteBtn} onPress={() => remove(t.id)}>
                  <Ionicons name="trash-outline" size={14} color="#991b1b" />
                  <Text style={styles.deleteBtnText}>Supprimer</Text>
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
    paddingBottom: 24,
    gap: 10,
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
  addBtnWrap: {
    width: 140,
  },
  fullWidth: {
    width: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: '#e8ecf2',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 5,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontFamily: fontFamilies.bodyBold,
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamilies.bodyBold,
  },
  badgeCompact: {
    alignSelf: 'flex-start',
  },
  notes: {
    color: colors.muted,
    fontStyle: 'italic',
    fontFamily: fontFamilies.body,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionsCompact: {
    justifyContent: 'flex-start',
  },
  archiveBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  archiveBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.bodySemi,
  },
  deleteBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteBtnText: {
    color: '#991b1b',
    fontFamily: fontFamilies.bodyBold,
  },
});
