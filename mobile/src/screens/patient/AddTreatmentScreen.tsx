import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Input, Label, PrimaryButton, Screen, Subheading, colors } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { addTreatment } from '../../lib/storage';
import { generateId, todayIsoDate } from '../../lib/ids';
import { fontFamilies } from '../../theme/fonts';
import type { PatientStackParamList } from '../../navigation/types';
import type { Treatment } from '../../types/domain';

type Props = NativeStackScreenProps<PatientStackParamList, 'AddTreatment'>;

export function AddTreatmentScreen({ navigation }: Props) {
  const { showToast } = useToast();

  const [medicament, setMedicament] = useState('');
  const [posologie, setPosologie] = useState('');
  const [frequence, setFrequence] = useState('1');
  const [heuresText, setHeuresText] = useState('08:00');
  const [dureeJours, setDureeJours] = useState('7');
  const [dateDebut, setDateDebut] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');

  const onSubmit = async () => {
    const frequenceNum = Number(frequence);
    const dureeNum = Number(dureeJours);
    const heures = heuresText
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    if (!medicament.trim()) {
      showToast('Le nom du medicament est obligatoire.', { tone: 'warning' });
      return;
    }

    if (!Number.isFinite(frequenceNum) || frequenceNum <= 0 || frequenceNum > 6) {
      showToast('Frequence invalide (1 a 6).', { tone: 'warning' });
      return;
    }

    if (!Number.isFinite(dureeNum) || dureeNum <= 0 || dureeNum > 365) {
      showToast('Duree invalide (1 a 365 jours).', { tone: 'warning' });
      return;
    }

    if (heures.length === 0) {
      showToast('Ajoute au moins une heure (ex: 08:00, 20:00).', { tone: 'warning' });
      return;
    }

    const treatment: Treatment = {
      id: generateId(),
      medicament: medicament.trim(),
      posologie: posologie.trim(),
      frequence: frequenceNum,
      heures,
      dureeJours: dureeNum,
      dateDebut,
      notes: notes.trim(),
      ordonnanceBase64: '',
      prises: [],
      actif: true,
      createdAt: new Date().toISOString(),
    };

    await addTreatment(treatment);
    showToast('Traitement enregistre.', { tone: 'success' });
    navigation.goBack();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.titleRow}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.title}>Nouveau traitement</Text>
        </View>
        <Subheading>Parametres de prise</Subheading>

        <View>
          <Label>Medicament *</Label>
          <Input value={medicament} onChangeText={setMedicament} placeholder="Ex: Coartem" />
        </View>

        <View>
          <Label>Posologie</Label>
          <Input value={posologie} onChangeText={setPosologie} placeholder="Ex: 1 comprime" />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Label>Frequence / jour</Label>
            <Input value={frequence} onChangeText={setFrequence} keyboardType="number-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Label>Duree (jours)</Label>
            <Input value={dureeJours} onChangeText={setDureeJours} keyboardType="number-pad" />
          </View>
        </View>

        <View>
          <Label>Heures (separees par virgule)</Label>
          <Input value={heuresText} onChangeText={setHeuresText} placeholder="08:00, 20:00" />
        </View>

        <View>
          <Label>Date debut (YYYY-MM-DD)</Label>
          <Input value={dateDebut} onChangeText={setDateDebut} />
        </View>

        <View>
          <Label>Notes</Label>
          <Input value={notes} onChangeText={setNotes} multiline style={styles.notesInput} />
        </View>

        <PrimaryButton label="Enregistrer" icon="save-outline" onPress={onSubmit} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontFamily: fontFamilies.title,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
