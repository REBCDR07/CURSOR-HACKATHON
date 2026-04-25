import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../../components/BrandLogo';
import { Card, Screen, colors } from '../../components/UI';
import { fontFamilies } from '../../theme/fonts';
import type { PublicStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PublicStackParamList, 'Landing'>;

const workflow = [
  {
    icon: 'person-add-outline' as const,
    title: '1. Creez votre espace',
    description: 'Inscription simple en mode patient ou medecin.',
  },
  {
    icon: 'medkit-outline' as const,
    title: '2. Suivez les traitements',
    description: 'Planifiez, suivez les prises et gardez votre historique medical.',
  },
  {
    icon: 'qr-code-outline' as const,
    title: '3. Partagez en securite',
    description: 'Partage temporaire via QR/token pour les consultations medicales.',
  },
];

export function LandingScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.brandRow}>
            <BrandLogo size={82} />
            <View style={styles.brandTextWrap}>
              <Text style={styles.title}>HealthPocket</Text>
              <Text style={styles.subtitle}>Votre carnet de sante mobile, simple et securise.</Text>
            </View>
          </View>

          <View style={styles.heroBadgeRow}>
            <View style={styles.heroBadge}><Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} /><Text style={styles.heroBadgeText}>Confidentialite locale</Text></View>
            <View style={styles.heroBadge}><Ionicons name="cloud-offline-outline" size={14} color={colors.primary} /><Text style={styles.heroBadgeText}>Fonctionne hors ligne</Text></View>
          </View>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>A quoi sert l'application ?</Text>
          <Text style={styles.sectionText}>
            HealthPocket centralise votre suivi medical: traitements, prises quotidiennes, historique,
            profil medical et partage ponctuel avec un professionnel de sante.
          </Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Pour qui ?</Text>
          <View style={styles.targetRow}><Ionicons name="person-outline" size={16} color={colors.primary} /><Text style={styles.targetText}><Text style={styles.targetStrong}>Patients:</Text> gerer les traitements et presenter un dossier clair.</Text></View>
          <View style={styles.targetRow}><Ionicons name="medkit-outline" size={16} color={colors.primary} /><Text style={styles.targetText}><Text style={styles.targetStrong}>Medecins:</Text> consulter un dossier partage et emettre une ordonnance rapidement.</Text></View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ca fonctionne ?</Text>
          <View style={styles.flowWrap}>
            {workflow.map((step) => (
              <View key={step.title} style={styles.flowItem}>
                <View style={styles.flowIcon}><Ionicons name={step.icon} size={16} color={colors.primary} /></View>
                <View style={styles.flowTextWrap}>
                  <Text style={styles.flowTitle}>{step.title}</Text>
                  <Text style={styles.flowDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.actionsWrap}>
          <Pressable style={styles.primary} onPress={() => navigation.navigate('Signup')}>
            <Ionicons name="person-add-outline" size={19} color="#fff" />
            <Text style={styles.primaryText}>Creer un compte</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="log-in-outline" size={19} color={colors.text} />
            <Text style={styles.secondaryText}>Se connecter</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingBottom: 26,
    gap: 12,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  brandTextWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 33,
    color: colors.primary,
    fontFamily: fontFamilies.title,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.subtitle,
    fontSize: 14,
    lineHeight: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ecfdf3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: colors.primary,
    fontFamily: fontFamilies.bodySemi,
    fontSize: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamilies.subtitleBold,
    fontSize: 18,
  },
  sectionText: {
    color: colors.text,
    fontFamily: fontFamilies.body,
    lineHeight: 22,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  targetText: {
    flex: 1,
    color: colors.text,
    fontFamily: fontFamilies.body,
    lineHeight: 21,
  },
  targetStrong: {
    fontFamily: fontFamilies.bodyBold,
  },
  flowWrap: {
    gap: 10,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  flowIcon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  flowTextWrap: {
    flex: 1,
    gap: 1,
  },
  flowTitle: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  flowDesc: {
    color: colors.muted,
    fontFamily: fontFamilies.body,
    lineHeight: 20,
  },
  actionsWrap: {
    gap: 8,
    marginTop: 2,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryText: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
});
