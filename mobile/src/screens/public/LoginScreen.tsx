import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Input, Label, PrimaryButton, Screen, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fontFamilies } from '../../theme/fonts';
import type { PublicStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PublicStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Remplis tous les champs.', { tone: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        showToast(result.error ?? 'Connexion impossible.', { tone: 'error' });
        return;
      }

      showToast('Connexion reussie.', { tone: 'success' });
    } catch {
      showToast('Erreur pendant la connexion.', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardWrap}>
        <ScrollView
          contentContainerStyle={styles.container}
          contentInsetAdjustmentBehavior="always"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>Accede a ton espace patient ou medecin</Text>
          </View>

          <View style={styles.formSection}>
            <View>
              <Label>Email</Label>
              <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View>
              <Label>Mot de passe</Label>
              <Input value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Se connecter" onPress={onSubmit} loading={loading} icon="log-in-outline" />

            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Signup')}>
              <Ionicons name="person-add-outline" size={16} color={colors.primary} />
              <Text style={styles.link}>Pas de compte ? Inscription</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  header: {
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontFamily: fontFamilies.title,
    marginBottom: 2,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fontFamilies.subtitle,
    marginBottom: 6,
    lineHeight: 21,
  },
  formSection: {
    gap: 10,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontFamily: fontFamilies.bodySemi,
  },
});
