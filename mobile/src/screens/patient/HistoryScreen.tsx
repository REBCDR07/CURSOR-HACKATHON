import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Input, Muted, Screen, Subheading, colors } from '../../components/UI';
import { calculateAdherence, getTreatments } from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { Treatment } from '../../types/domain';

export function HistoryScreen() {
  const [search, setSearch] = useState('');
  const [treatments, setTreatments] = useState<Treatment[]>([]);

  const load = useCallback(async () => {
    setTreatments(await getTreatments());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = treatments.filter((t) => {
      if (!q) return true;
      return t.medicament.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => b.dateDebut.localeCompare(a.dateDebut));
  }, [search, treatments]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Historique</Heading>
        <Subheading>Traitements et adherence</Subheading>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={17} color={colors.muted} />
          <View style={{ flex: 1 }}>
            <Input value={search} onChangeText={setSearch} placeholder="Rechercher un traitement" />
          </View>
        </View>

        {items.length === 0 ? (
          <Card>
            <Muted>Aucun historique.</Muted>
          </Card>
        ) : (
          items.map((t) => (
            <Card key={t.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.medicament}</Text>
                  <Muted>{t.posologie}</Muted>
                  <Muted>{t.dateDebut} - {t.dureeJours} jours</Muted>
                </View>
                <Text style={styles.adherence}>{calculateAdherence(t)}%</Text>
              </View>
              {t.notes ? <Text style={styles.notes}>{t.notes}</Text> : null}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  card: {
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamilies.bodyBold,
  },
  adherence: {
    color: colors.primary,
    fontFamily: fontFamilies.title,
    fontSize: 20,
  },
  notes: {
    color: colors.muted,
    fontStyle: 'italic',
    fontFamily: fontFamilies.body,
  },
});
