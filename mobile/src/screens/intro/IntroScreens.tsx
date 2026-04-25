import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '../../components/BrandLogo';
import { Card, Screen, colors } from '../../components/UI';
import { fontFamilies } from '../../theme/fonts';
import type { IntroStackParamList } from '../../navigation/types';

type IntroWelcomeProps = NativeStackScreenProps<IntroStackParamList, 'IntroWelcome'>;
type IntroWhatIsProps = NativeStackScreenProps<IntroStackParamList, 'IntroWhatIs'>;
type IntroForWhoProps = NativeStackScreenProps<IntroStackParamList, 'IntroForWho'>;
type IntroHowWorksProps = NativeStackScreenProps<IntroStackParamList, 'IntroHowWorks'>;
type IntroFeaturesProps = NativeStackScreenProps<IntroStackParamList, 'IntroFeatures'> & {
  onFinish?: () => void;
};

function StepShell({
  title,
  subtitle,
  current,
  children,
  onNext,
  onPrevious,
  nextLabel,
}: {
  title: string;
  subtitle?: string;
  current: number;
  children: React.ReactNode;
  onNext: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
}) {
  const total = 5;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentInsetAdjustmentBehavior="always"
      >
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Etape {current}/{total}</Text>
          <View style={styles.progressRow}>
            {Array.from({ length: total }).map((_, idx) => {
              const n = idx + 1;
              return <View key={n} style={[styles.progressDot, n <= current && styles.progressDotActive]} />;
            })}
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.body}>{children}</View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.prevBtn, !onPrevious && styles.prevBtnDisabled]}
            onPress={onPrevious}
            disabled={!onPrevious}
          >
            <Ionicons name="arrow-back-outline" size={18} color={onPrevious ? colors.text : '#94a3b8'} />
            <Text style={[styles.prevText, !onPrevious && styles.prevTextDisabled]}>Precedent</Text>
          </Pressable>

          <Pressable style={styles.nextBtn} onPress={onNext}>
            <Text style={styles.nextText}>{nextLabel ?? 'Suivant'}</Text>
            <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.iconPill}>
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

export function IntroWelcomeScreen({ navigation }: IntroWelcomeProps) {
  return (
    <StepShell
      title="Health Pocket"
      subtitle="Votre carnet de sante numerique, clair et toujours accessible"
      current={1}
      onNext={() => navigation.navigate('IntroWhatIs')}
    >
      <Card style={styles.heroCard}>
        <BrandLogo size={118} style={styles.logoCenter} />
        <Text style={styles.welcomeMain}>Health Pocket</Text>
        <Text style={styles.welcomeTagline}>votre carnet de sante a portee de main</Text>
        <Text style={styles.heroText}>
          Une application mobile pour suivre les traitements, organiser les informations medicales
          et simplifier les echanges pendant les consultations.
        </Text>
      </Card>
    </StepShell>
  );
}

export function IntroWhatIsScreen({ navigation }: IntroWhatIsProps) {
  return (
    <StepShell
      title="C'est quoi HP ?"
      subtitle="HP centralise votre suivi de sante dans un seul espace."
      current={2}
      onPrevious={() => navigation.navigate('IntroWelcome')}
      onNext={() => navigation.navigate('IntroForWho')}
    >
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>A quoi sert l'application ?</Text>
        <Text style={styles.cardText}>
          Health Pocket permet de regrouper les traitements, prises quotidiennes, historique de
          sante et partage d'informations utiles, sans dependre d'une connexion permanente.
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Valeur au quotidien</Text>
        <DetailRow icon="calendar-outline" text="Planifier les prises et visualiser clairement votre routine." />
        <DetailRow icon="notifications-outline" text="Recevoir des rappels et limiter les oublis de medicaments." />
        <DetailRow icon="document-text-outline" text="Retrouver rapidement les informations utiles en consultation." />
      </Card>
    </StepShell>
  );
}

export function IntroForWhoScreen({ navigation }: IntroForWhoProps) {
  return (
    <StepShell
      title="Pour qui ?"
      subtitle="Deux parcours complementaires: patient et medecin."
      current={3}
      onPrevious={() => navigation.navigate('IntroWhatIs')}
      onNext={() => navigation.navigate('IntroHowWorks')}
    >
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Parcours patient</Text>
        <DetailRow icon="person-outline" text="Suivre les traitements en cours et l'adherence." />
        <DetailRow icon="time-outline" text="Consulter l'historique des prises et activites." />
        <DetailRow icon="qr-code-outline" text="Partager temporairement le dossier via QR/token." />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Parcours medecin</Text>
        <DetailRow icon="search-outline" text="Retrouver un patient et envoyer des demandes d'acces." />
        <DetailRow icon="reader-outline" text="Consulter les donnees partagees pendant la prise en charge." />
        <DetailRow icon="medkit-outline" text="Rediger et exporter des ordonnances rapidement." />
      </Card>
    </StepShell>
  );
}

export function IntroHowWorksScreen({ navigation }: IntroHowWorksProps) {
  return (
    <StepShell
      title="Comment ca marche ?"
      subtitle="Un fonctionnement simple, en 4 etapes."
      current={4}
      onPrevious={() => navigation.navigate('IntroForWho')}
      onNext={() => navigation.navigate('IntroFeatures')}
    >
      <Card style={styles.card}>
        <View style={styles.stepRow}>
          <Text style={styles.stepIndex}>1</Text>
          <Text style={styles.cardText}>Creation du compte patient ou medecin.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepIndex}>2</Text>
          <Text style={styles.cardText}>Saisie des traitements, horaires, profil et informations cles.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepIndex}>3</Text>
          <Text style={styles.cardText}>Suivi quotidien avec prises, historique et activites.</Text>
        </View>
        <View style={styles.stepRow}>
          <Text style={styles.stepIndex}>4</Text>
          <Text style={styles.cardText}>Partage securise ponctuel et export PDF selon le besoin medical.</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Mode hors-ligne</Text>
        <Text style={styles.cardText}>
          L'app reste fonctionnelle sans reseau. Les actions sont conservees localement et
          synchronisees quand la connexion revient.
        </Text>
      </Card>
    </StepShell>
  );
}

export function IntroFeaturesScreen({ navigation, onFinish }: IntroFeaturesProps) {
  return (
    <StepShell
      title="Fonctionnalites"
      subtitle="Une base complete pour un usage professionnel."
      current={5}
      onPrevious={() => navigation.navigate('IntroHowWorks')}
      onNext={() => onFinish?.()}
      nextLabel="Commencer"
    >
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Ce que vous trouvez dans Health Pocket</Text>
        <DetailRow icon="shield-checkmark-outline" text="Protection locale des donnees sensibles." />
        <DetailRow icon="cloud-offline-outline" text="Support hors-ligne et file d'attente de synchronisation." />
        <DetailRow icon="pulse-outline" text="Indicateurs d'adherence et suivi des prises." />
        <DetailRow icon="notifications-outline" text="Rappels de prise selon les horaires des traitements." />
        <DetailRow icon="download-outline" text="Export PDF carnet patient et ordonnance medecin." />
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Bonnes pratiques</Text>
        <Text style={styles.cardText}>
          Completer regulierement le profil medical et verifier les horaires de prises permet un
          suivi plus fiable et des consultations plus efficaces.
        </Text>
      </Card>
    </StepShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    minHeight: '100%',
    paddingVertical: 12,
    paddingBottom: 28,
    gap: 12,
  },
  progressHeader: {
    gap: 6,
  },
  progressLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.bodySemi,
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  progressDot: {
    width: 22,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#d9dfe7',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  header: {
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontFamily: fontFamilies.title,
    flexShrink: 1,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.subtitle,
    lineHeight: 21,
  },
  body: {
    flex: 1,
    gap: 10,
  },
  heroCard: {
    gap: 10,
    alignItems: 'center',
  },
  logoCenter: {
    alignSelf: 'center',
  },
  heroText: {
    color: colors.text,
    fontFamily: fontFamilies.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeMain: {
    color: colors.primary,
    fontSize: 38,
    fontFamily: fontFamilies.title,
    textAlign: 'center',
    flexShrink: 1,
  },
  welcomeTagline: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamilies.bodySemi,
    textAlign: 'center',
  },
  card: {
    gap: 10,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontFamily: fontFamilies.subtitleBold,
  },
  cardText: {
    color: colors.text,
    fontFamily: fontFamilies.body,
    lineHeight: 22,
    flexShrink: 1,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  detailText: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontFamily: fontFamilies.body,
    lineHeight: 21,
  },
  iconPill: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#ecfdf3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  stepIndex: {
    width: 24,
    height: 24,
    borderRadius: 999,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: colors.primary,
    color: '#fff',
    fontFamily: fontFamilies.bodyBold,
    overflow: 'hidden',
    paddingTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prevBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#fff',
  },
  prevBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  prevText: {
    color: colors.text,
    fontFamily: fontFamilies.bodySemi,
  },
  prevTextDisabled: {
    color: '#94a3b8',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  nextText: {
    color: '#fff',
    fontFamily: fontFamilies.bodyBold,
    fontSize: 16,
  },
});
