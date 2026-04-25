import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Input, Label, PrimaryButton, Screen, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createDefaultProfile, saveProfile } from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { PublicStackParamList } from '../../navigation/types';
import type { UserRole } from '../../types/domain';

type Props = NativeStackScreenProps<PublicStackParamList, 'Signup'>;

export function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<UserRole>('patient');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [numeroRPPS, setNumeroRPPS] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!nom.trim() || !prenom.trim() || !email.trim() || !password.trim()) {
      showToast('Remplis les champs obligatoires.', { tone: 'warning' });
      return;
    }

    if (password.length < 6) {
      showToast('Mot de passe: au moins 6 caracteres.', { tone: 'warning' });
      return;
    }

    if (role === 'medecin' && (!specialite.trim() || !numeroRPPS.trim())) {
      showToast('Specialite et RPPS obligatoires pour medecin.', { tone: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const result = await signup(role, {
        nom,
        prenom,
        email,
        password,
        specialite,
        numeroRPPS,
      });

      if (!result.success) {
        showToast(result.error ?? 'Inscription impossible.', { tone: 'error' });
        return;
      }

      if (role === 'patient') {
        try {
          const profile = createDefaultProfile();
          profile.pseudo = `${prenom} ${nom}`;
          await saveProfile(profile);
        } catch {
          showToast('Compte cree, mais le profil initial n\'a pas pu etre enregistre.', { tone: 'warning' });
        }
      }

      showToast('Compte cree avec succes.', { tone: 'success' });
    } catch {
      showToast('Erreur pendant l\'inscription.', { tone: 'error' });
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
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Cree ton espace sante en quelques secondes</Text>
          </View>

          <View style={styles.roleRow}>
            <Pressable style={[styles.roleBtn, role === 'patient' && styles.roleBtnActive]} onPress={() => setRole('patient')}>
              <Ionicons name="person-outline" size={16} color={role === 'patient' ? '#fff' : colors.text} />
              <Text style={[styles.roleLabel, role === 'patient' && styles.roleLabelActive]}>Patient</Text>
            </Pressable>
            <Pressable style={[styles.roleBtn, role === 'medecin' && styles.roleBtnActive]} onPress={() => setRole('medecin')}>
              <Ionicons name="medkit-outline" size={16} color={role === 'medecin' ? '#fff' : colors.text} />
              <Text style={[styles.roleLabel, role === 'medecin' && styles.roleLabelActive]}>Medecin</Text>
            </Pressable>
          </View>

          <View style={styles.formSection}>
            <View>
              <Label>Prenom</Label>
              <Input value={prenom} onChangeText={setPrenom} />
            </View>

            <View>
              <Label>Nom</Label>
              <Input value={nom} onChangeText={setNom} />
            </View>

            <View>
              <Label>Email</Label>
              <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </View>

            <View>
              <Label>Mot de passe</Label>
              <Input value={password} onChangeText={setPassword} secureTextEntry />
            </View>

            {role === 'medecin' ? (
              <>
                <View>
                  <Label>Specialite</Label>
                  <Input value={specialite} onChangeText={setSpecialite} />
                </View>
                <View>
                  <Label>Numero RPPS / ONMB</Label>
                  <Input value={numeroRPPS} onChangeText={setNumeroRPPS} />
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Creer mon compte" onPress={onSubmit} loading={loading} icon="person-add-outline" />

            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
              <Ionicons name="log-in-outline" size={16} color={colors.primary} />
              <Text style={styles.link}>Deja un compte ? Connexion</Text>
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
    gap: 12,
    paddingVertical: 12,
    paddingBottom: 30,
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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleLabel: {
    color: colors.text,
    fontFamily: fontFamilies.bodySemi,
  },
  roleLabelActive: {
    color: '#fff',
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
    marginTop: 2,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontFamily: fontFamilies.bodySemi,
  },
});
