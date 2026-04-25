import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Card, Heading, Muted, Screen, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { getUsers } from '../../lib/auth';
import { formatDateTimeFr } from '../../lib/ids';
import { getDoctorAccessRequests } from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { AccessRequest, UserAccount } from '../../types/domain';

export function DoctorRequestsScreen() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);

  const load = useCallback(async () => {
    if (!session) return;
    const [reqs, allUsers] = await Promise.all([getDoctorAccessRequests(session.userId), getUsers()]);
    setRequests(reqs.slice().reverse());
    setUsers(allUsers);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const nameOf = useMemo(
    () => (id: string) => {
      const u = users.find((x) => x.id === id);
      return u ? `${u.prenom} ${u.nom}` : `Patient #${id.slice(0, 6)}`;
    },
    [users],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Heading>Demandes</Heading>
        <Subheading>Suivi des acces patient</Subheading>

        {requests.length === 0 ? (
          <Card>
            <Muted>Aucune demande.</Muted>
          </Card>
        ) : (
          requests.map((r) => (
            <Card key={r.id} style={styles.row}>
              <View style={styles.left}>
                <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nameOf(r.patientUserId)}</Text>
                  <Muted>{formatDateTimeFr(r.createdAt)}</Muted>
                </View>
              </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
});
