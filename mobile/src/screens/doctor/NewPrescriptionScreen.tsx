import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, Heading, Input, Label, Muted, PrimaryButton, Screen, SecondaryButton, Subheading, colors } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getUsers } from '../../lib/auth';
import { generateId, todayIsoDate } from '../../lib/ids';
import { isOnline } from '../../lib/network';
import { writeJSON } from '../../lib/kv';
import {
  addTreatmentForPatient,
  enqueueAction,
  getAccessRequests,
  hasActiveDoctorAccess,
  updateAccessRequest,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { DoctorStackParamList } from '../../navigation/types';
import type { LastPrescription, Treatment } from '../../types/domain';

const LAST_PRESCRIPTION_KEY = 'hp_doctor_last_prescription';

interface MedicLine {
  medicament: string;
  posologie: string;
  frequence: number;
  heures: string;
  dureeJours: number;
}

const newLine = (): MedicLine => ({
  medicament: '',
  posologie: '',
  frequence: 1,
  heures: '08:00',
  dureeJours: 7,
});

type Props = NativeStackScreenProps<DoctorStackParamList, 'NewPrescription'>;

export function NewPrescriptionScreen({ navigation, route }: Props) {
  const { patientId } = route.params;
  const { session } = useAuth();
  const { showToast } = useToast();

  const [lines, setLines] = useState<MedicLine[]>([newLine()]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const checkAccess = useCallback(async () => {
    if (!session) return;
    setAllowed(await hasActiveDoctorAccess(session.userId, patientId));
  }, [patientId, session]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  if (!session) return null;

  if (!allowed) {
    return (
      <Screen>
        <Card>
          <View style={styles.deniedRow}><Ionicons name="lock-closed-outline" size={18} color={colors.danger} /><Text style={styles.denied}>Acces non autorise au dossier.</Text></View>
        </Card>
      </Screen>
    );
  }

  const updateLine = (index: number, patch: Partial<MedicLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const submit = async () => {
    const valid = lines.every((l) => l.medicament.trim() && l.posologie.trim() && l.dureeJours > 0);
    if (!valid) {
      showToast('Completer les lignes medicament.', { tone: 'warning' });
      return;
    }

    setSubmitting(true);

    try {
      const today = todayIsoDate();
      const treatments: Treatment[] = lines.map((line) => ({
        id: generateId(),
        medicament: line.medicament.trim(),
        posologie: line.posologie.trim(),
        frequence: line.frequence,
        heures: line.heures.split(',').map((h) => h.trim()).filter(Boolean),
        dureeJours: line.dureeJours,
        dateDebut: today,
        notes: notes.trim(),
        ordonnanceBase64: '',
        prises: [],
        actif: true,
        createdAt: new Date().toISOString(),
        medecinId: session.userId,
      }));

      const users = await getUsers();
      const patient = users.find((u) => u.id === patientId);

      const lastPrescription: LastPrescription = {
        doctorId: session.userId,
        patientUserId: patientId,
        patientName: patient ? `${patient.prenom} ${patient.nom}` : `Patient #${patientId.slice(0, 6)}`,
        date: new Date().toISOString(),
        notes: notes.trim(),
        treatments,
      };
      await writeJSON(LAST_PRESCRIPTION_KEY, lastPrescription);

      const online = await isOnline();

      if (!online) {
        await enqueueAction({
          doctorId: session.userId,
          kind: 'prescription',
          payload: { patientUserId: patientId, treatments },
        });

        showToast("Ordonnance mise en file d'attente.", { tone: 'warning' });
        navigation.popToTop();
        return;
      }

      for (const t of treatments) {
        await addTreatmentForPatient(patientId, t);
      }

      const requests = await getAccessRequests();
      for (const r of requests.filter(
        (req) => req.medecinId === session.userId && req.patientUserId === patientId && req.status === 'accepted',
      )) {
        await updateAccessRequest(r.id, { status: 'completed', resolvedAt: new Date().toISOString() });
      }

      showToast('Ordonnance emise. Acces revoque automatiquement.', { tone: 'success' });
      navigation.popToTop();
    } catch {
      showToast('Erreur pendant l\'emission de l\'ordonnance.', { tone: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <Heading>Ordonnance</Heading>
        <Subheading>Patient #{patientId.slice(0, 8)}</Subheading>

        {lines.map((line, idx) => (
          <Card key={`line-${idx}`} style={styles.lineCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.lineTitle}>Medicament {idx + 1}</Text>
              {lines.length > 1 ? (
                <Pressable style={styles.removeBtn} onPress={() => setLines((prev) => prev.filter((_, i) => i !== idx))}>
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={styles.remove}>Supprimer</Text>
                </Pressable>
              ) : null}
            </View>

            <View>
              <Label>Nom</Label>
              <Input value={line.medicament} onChangeText={(v) => updateLine(idx, { medicament: v })} />
            </View>
            <View>
              <Label>Posologie</Label>
              <Input value={line.posologie} onChangeText={(v) => updateLine(idx, { posologie: v })} />
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Label>Frequence</Label>
                <Input
                  value={String(line.frequence)}
                  onChangeText={(v) => updateLine(idx, { frequence: Number(v || 0) })}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label>Duree (jours)</Label>
                <Input
                  value={String(line.dureeJours)}
                  onChangeText={(v) => updateLine(idx, { dureeJours: Number(v || 0) })}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View>
              <Label>Heures (08:00, 20:00)</Label>
              <Input value={line.heures} onChangeText={(v) => updateLine(idx, { heures: v })} />
            </View>
          </Card>
        ))}

        <SecondaryButton label="Ajouter un medicament" icon="add-outline" onPress={() => setLines((prev) => [...prev, newLine()])} />

        <View>
          <Label>Instructions</Label>
          <Input value={notes} onChangeText={setNotes} multiline style={styles.notes} />
        </View>

        <PrimaryButton label="Emettre l'ordonnance" icon="document-text-outline" onPress={submit} loading={submitting} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  deniedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  denied: {
    color: colors.danger,
    fontFamily: fontFamilies.bodyBold,
  },
  lineCard: {
    gap: 8,
  },
  lineTitle: {
    color: colors.primary,
    fontFamily: fontFamilies.bodyBold,
  },
  removeBtn: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  remove: {
    color: colors.danger,
    fontFamily: fontFamilies.bodyBold,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notes: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
