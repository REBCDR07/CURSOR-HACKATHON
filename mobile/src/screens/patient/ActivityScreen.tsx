import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Muted, Screen, Subheading, colors } from '../../components/UI';
import { getMyActivity } from '../../lib/storage';
import { formatDateTimeFr } from '../../lib/ids';
import { fontFamilies } from '../../theme/fonts';
import type { ActivityEntry } from '../../types/domain';

const labels: Record<ActivityEntry['type'], string> = {
  access_request: "Demande d'acces",
  access_accepted: 'Acces accorde',
  access_refused: 'Demande refusee',
  access_revoked: 'Acces revoque',
  prescription_issued: 'Ordonnance emise',
  record_viewed: 'Dossier consulte',
  prescription_exported: 'Ordonnance exportee',
};

const iconByType: Record<ActivityEntry['type'], keyof typeof Ionicons.glyphMap> = {
  access_request: 'send-outline',
  access_accepted: 'shield-checkmark-outline',
  access_refused: 'close-circle-outline',
  access_revoked: 'lock-closed-outline',
  prescription_issued: 'document-text-outline',
  record_viewed: 'eye-outline',
  prescription_exported: 'download-outline',
};

export function ActivityScreen() {
  const [items, setItems] = useState<ActivityEntry[]>([]);

  const load = useCallback(async () => {
    setItems(await getMyActivity());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Journal</Heading>
        <Subheading>Activite medecin</Subheading>

        {items.length === 0 ? (
          <Card>
            <Muted>Aucune activite pour le moment.</Muted>
          </Card>
        ) : (
          items.map((a) => (
            <Card key={a.id} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.iconWrap}>
                  <Ionicons name={iconByType[a.type]} size={16} color={colors.primary} />
                </View>
                <Text style={styles.type}>{labels[a.type]}</Text>
              </View>
              <Text style={styles.name}>{a.medecinNom}</Text>
              {a.medecinSpecialite ? <Muted>{a.medecinSpecialite}</Muted> : null}
              {a.details ? <Muted>{a.details}</Muted> : null}
              <Muted>{formatDateTimeFr(a.createdAt)}</Muted>
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
  card: {
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  type: {
    color: colors.primary,
    textTransform: 'uppercase',
    fontSize: 12,
    fontFamily: fontFamilies.bodyBold,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontFamily: fontFamilies.bodyBold,
  },
});
