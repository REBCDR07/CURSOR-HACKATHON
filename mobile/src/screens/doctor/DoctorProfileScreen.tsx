import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Muted, PrimaryButton, Screen, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { fontFamilies } from '../../theme/fonts';

export function DoctorProfileScreen() {
  const { session, logout } = useAuth();

  if (!session) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Heading>Mon profil</Heading>
        <Subheading>Informations professionelles</Subheading>

        <Card style={styles.card}>
          <View style={styles.avatar}><Ionicons name="medkit-outline" size={26} color={colors.primary} /></View>
          <Text style={styles.name}>Dr. {session.prenom} {session.nom}</Text>
          <Muted>{session.specialite || 'Medecin'}</Muted>
          <View style={styles.mailRow}><Ionicons name="mail-outline" size={14} color={colors.muted} /><Muted>{session.email}</Muted></View>
        </Card>

        <PrimaryButton label="Se deconnecter" icon="log-out-outline" onPress={() => logout()} />
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
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontFamily: fontFamilies.title,
  },
  mailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
});
