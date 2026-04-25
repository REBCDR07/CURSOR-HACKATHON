import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Card, Heading, Muted, PrimaryButton, Screen, SecondaryButton, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createQRShare, getMyQRShares, revokeQRShare } from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { QRShare } from '../../types/domain';

export function QRShareScreen() {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [shares, setShares] = useState<QRShare[]>([]);

  const load = useCallback(async () => {
    setShares(await getMyQRShares());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = async () => {
    if (!session) return;
    await createQRShare(session.userId);
    await load();
    showToast('QR de partage genere.', { tone: 'success' });
  };

  const remaining = (s: QRShare): string => {
    const ms = new Date(s.expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expire';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}min`;
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <Heading>Partage QR</Heading>
        <Subheading>Acces temporaire 24h</Subheading>
        <Muted>Genere un QR pour consultation medecin.</Muted>

        <PrimaryButton label="Generer un QR" icon="qr-code-outline" onPress={create} />

        {shares.length === 0 ? (
          <Card>
            <Muted>Aucun QR actif.</Muted>
          </Card>
        ) : (
          shares.map((s) => {
            const payload = JSON.stringify({ token: s.token });
            return (
              <Card key={s.token} style={styles.card}>
                <View style={styles.qrWrap}>
                  <QRCode value={payload} size={180} />
                </View>
                <View style={styles.expireRow}>
                  <Ionicons name="time-outline" size={14} color="#9a3412" />
                  <Text style={styles.expire}>Expire dans {remaining(s)}</Text>
                </View>
                <Muted>Token: {s.token}</Muted>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      label="Copier token"
                      icon="copy-outline"
                      onPress={async () => {
                        await Clipboard.setStringAsync(s.token);
                        showToast('Token copie dans le presse-papiers.', { tone: 'success' });
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      label="Revoquer"
                      icon="close-circle-outline"
                      onPress={async () => {
                        await revokeQRShare(s.token);
                        await load();
                        showToast('Partage revoque.', { tone: 'info' });
                      }}
                    />
                  </View>
                </View>
              </Card>
            );
          })
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
    gap: 8,
    alignItems: 'center',
  },
  qrWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    backgroundColor: '#fff',
  },
  expireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expire: {
    color: '#9a3412',
    fontFamily: fontFamilies.bodyBold,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
