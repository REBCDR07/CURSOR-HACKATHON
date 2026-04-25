import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Card, PrimaryButton, Screen, colors } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { extractTokenFromQRData } from '../../lib/qr';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<DoctorStackParamList, 'DoctorScanQR'>;

export function DoctorScanQRScreen({ navigation }: Props) {
  const { showToast } = useToast();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { width } = useWindowDimensions();

  const canScan = useMemo(() => !!permission?.granted && !scanned, [permission?.granted, scanned]);
  const cutoutSize = Math.max(180, Math.min(260, width - 90));

  const handleScanned = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    const token = extractTokenFromQRData(data);
    if (!token) {
      showToast('QR invalide: aucun token detecte.', { tone: 'warning' });
      setTimeout(() => {
        setScanned(false);
      }, 700);
      return;
    }

    navigation.replace('SharedRecord', { token });
  };

  if (!permission) {
    return (
      <Screen>
        <Card>
          <Text style={styles.title}>Verification permission camera...</Text>
        </Card>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <View style={styles.permissionWrap}>
          <Card style={styles.permissionCard}>
            <View style={styles.permissionHeader}><Ionicons name="camera-outline" size={18} color={colors.primary} /><Text style={styles.title}>Autoriser la camera</Text></View>
            <Text style={styles.subtitle}>
              Le scan QR natif medecin a besoin de l'acces camera pour ouvrir le dossier partage.
            </Text>
            <PrimaryButton label="Autoriser" icon="camera-outline" onPress={() => requestPermission()} />
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={canScan ? handleScanned : undefined}
            />

            <View style={styles.overlay} pointerEvents="none">
              <View style={[styles.cutout, { width: cutoutSize, height: cutoutSize }]} />
            </View>
          </View>

          <View style={styles.hintRow}><Ionicons name="qr-code-outline" size={14} color={colors.muted} /><Text style={styles.hint}>Positionne le QR code du patient dans le cadre.</Text></View>

          {scanned ? (
            <Pressable style={styles.retryBtn} onPress={() => setScanned(false)}>
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={styles.retryText}>Scanner a nouveau</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    minHeight: 520,
    gap: 12,
  },
  cameraWrap: {
    flex: 1,
    minHeight: 360,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cutout: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
  },
  hint: {
    textAlign: 'center',
    color: colors.muted,
    fontFamily: fontFamilies.bodyMedium,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 6,
  },
  retryText: {
    color: colors.primary,
    fontFamily: fontFamilies.bodyBold,
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  permissionCard: {
    gap: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontFamily: fontFamilies.subtitleBold,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 20,
    fontFamily: fontFamilies.body,
  },
});
