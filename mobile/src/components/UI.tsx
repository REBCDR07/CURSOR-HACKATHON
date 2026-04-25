import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fontFamilies } from '../theme/fonts';

export const colors = {
  bg: '#faf8f4',
  card: '#ffffff',
  primary: '#1b4332',
  accent: '#dd8a08',
  text: '#141414',
  muted: '#556070',
  border: '#d9dfe7',
  success: '#0e9f6e',
  danger: '#c53030',
};

type ScreenProps = {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'right', 'bottom', 'left']}>
      <View style={[styles.screenContent, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subheading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subheading}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable style={[styles.primaryBtn, isDisabled && styles.disabled]} onPress={onPress} disabled={isDisabled}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color="#fff" /> : null}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={styles.secondaryBtn} onPress={onPress}>
      <View style={styles.btnInner}>
        {icon ? <Ionicons name={icon} size={17} color={colors.text} /> : null}
        <Text style={styles.secondaryBtnText}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const toneStyle =
    tone === 'success'
      ? styles.badgeSuccess
      : tone === 'danger'
      ? styles.badgeDanger
      : tone === 'warning'
      ? styles.badgeWarning
      : styles.badgeDefault;

  const textTone =
    tone === 'success'
      ? styles.badgeSuccessText
      : tone === 'danger'
      ? styles.badgeDangerText
      : tone === 'warning'
      ? styles.badgeWarningText
      : styles.badgeDefaultText;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.badgeText, textTone]}>{label}</Text>
    </View>
  );
}

export const uiStyles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  screenContent: {
    flex: 1,
    width: '100%',
    maxWidth: 780,
    alignSelf: 'center',
    minWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.card,
    padding: 12,
  },
  heading: {
    fontSize: 30,
    color: colors.text,
    marginBottom: 2,
    fontFamily: fontFamilies.title,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  subheading: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamilies.subtitleBold,
    flexShrink: 1,
  },
  muted: {
    color: colors.muted,
    fontSize: 13,
    fontFamily: fontFamilies.body,
    flexShrink: 1,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    fontSize: 14,
    fontFamily: fontFamilies.bodySemi,
    flexShrink: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: '#fff',
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fontFamilies.body,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fontFamilies.bodyBold,
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: colors.text,
    fontFamily: fontFamilies.bodySemi,
    textAlign: 'center',
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fontFamilies.bodyBold,
  },
  badgeDefault: { backgroundColor: '#eef2f7' },
  badgeDefaultText: { color: colors.muted },
  badgeSuccess: { backgroundColor: '#dcfce7' },
  badgeSuccessText: { color: '#166534' },
  badgeDanger: { backgroundColor: '#fee2e2' },
  badgeDangerText: { color: '#991b1b' },
  badgeWarning: { backgroundColor: '#ffedd5' },
  badgeWarningText: { color: '#9a3412' },
});
