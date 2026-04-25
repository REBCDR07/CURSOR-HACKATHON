import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import {
  Badge,
  Card,
  Heading,
  Input,
  Label,
  Muted,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subheading,
  colors,
} from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import { exportCarnetPDF } from '../../lib/exportPdf';
import {
  createDefaultProfile,
  getMyAccessRequests,
  getProfile,
  getTreatments,
  saveProfile,
  updateAccessRequest,
} from '../../lib/storage';
import { fontFamilies } from '../../theme/fonts';
import type { AccessRequest, PatientProfile } from '../../types/domain';

export function ProfileScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 390;
  const { showToast } = useToast();

  const [profile, setProfile] = useState<PatientProfile>(createDefaultProfile());
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [newAllergie, setNewAllergie] = useState('');
  const [newMaladie, setNewMaladie] = useState('');

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([getProfile(), getMyAccessRequests()]);
    if (p) setProfile(p);
    setRequests(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pending = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);
  const accepted = useMemo(() => requests.filter((r) => r.status === 'accepted'), [requests]);

  const persist = async () => {
    await saveProfile(profile);
    showToast('Profil sauvegarde.', { tone: 'success' });
  };

  const addAllergie = () => {
    if (!newAllergie.trim()) return;
    setProfile((prev) => ({ ...prev, allergies: [...prev.allergies, newAllergie.trim()] }));
    setNewAllergie('');
  };

  const addMaladie = () => {
    if (!newMaladie.trim()) return;
    setProfile((prev) => ({ ...prev, maladiesChroniques: [...prev.maladiesChroniques, newMaladie.trim()] }));
    setNewMaladie('');
  };

  const changeRequest = async (id: string, status: AccessRequest['status']) => {
    await updateAccessRequest(id, { status, resolvedAt: new Date().toISOString() });
    await load();

    const message =
      status === 'accepted'
        ? 'Acces accorde.'
        : status === 'refused'
        ? 'Demande refusee.'
        : status === 'revoked'
        ? 'Acces revoque.'
        : 'Demande mise a jour.';

    showToast(message, { tone: status === 'accepted' ? 'success' : 'info' });
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <Heading>Mon profil</Heading>

        <Card style={styles.section}>
          <Subheading>Identite</Subheading>
          <Label>Pseudo</Label>
          <Input value={profile.pseudo} onChangeText={(v) => setProfile((p) => ({ ...p, pseudo: v }))} />

          <View style={[styles.row, compact && styles.rowCompact]}>
            <View style={{ flex: 1 }}>
              <Label>Age</Label>
              <Input
                value={profile.age ? String(profile.age) : ''}
                onChangeText={(v) => setProfile((p) => ({ ...p, age: v ? Number(v) : null }))}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label>Sexe (M/F)</Label>
              <Input value={profile.sexe} onChangeText={(v) => setProfile((p) => ({ ...p, sexe: (v.toUpperCase().slice(0, 1) as 'M' | 'F' | '') }))} />
            </View>
          </View>

          <Label>Groupe sanguin</Label>
          <Input value={profile.groupeSanguin} onChangeText={(v) => setProfile((p) => ({ ...p, groupeSanguin: v }))} placeholder="Ex: O+" />

          <Label>Electrophorese</Label>
          <Input value={profile.electrophorese} onChangeText={(v) => setProfile((p) => ({ ...p, electrophorese: v }))} placeholder="Ex: AS" />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}><Ionicons name="alert-circle-outline" size={16} color="#9f1239" /><Text style={styles.sectionTitle}>Allergies</Text></View>
          <View style={styles.tagWrap}>
            {profile.allergies.map((a, idx) => (
              <Pressable key={`${a}-${idx}`} onPress={() => setProfile((p) => ({ ...p, allergies: p.allergies.filter((_, i) => i !== idx) }))}>
                <Badge label={`${a} ×`} tone="danger" />
              </Pressable>
            ))}
          </View>
          <View style={[styles.row, compact && styles.rowCompact]}>
            <View style={{ flex: 1 }}>
              <Input value={newAllergie} onChangeText={setNewAllergie} placeholder="Ajouter une allergie" />
            </View>
            <View style={compact ? styles.fullWidth : styles.actionBtnWrap}>
              <SecondaryButton label="Ajouter" icon="add-outline" onPress={addAllergie} />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}><Ionicons name="pulse-outline" size={16} color="#9a3412" /><Text style={styles.sectionTitle}>Maladies chroniques</Text></View>
          <View style={styles.tagWrap}>
            {profile.maladiesChroniques.map((m, idx) => (
              <Pressable key={`${m}-${idx}`} onPress={() => setProfile((p) => ({ ...p, maladiesChroniques: p.maladiesChroniques.filter((_, i) => i !== idx) }))}>
                <Badge label={`${m} ×`} tone="warning" />
              </Pressable>
            ))}
          </View>
          <View style={[styles.row, compact && styles.rowCompact]}>
            <View style={{ flex: 1 }}>
              <Input value={newMaladie} onChangeText={setNewMaladie} placeholder="Ajouter une maladie" />
            </View>
            <View style={compact ? styles.fullWidth : styles.actionBtnWrap}>
              <SecondaryButton label="Ajouter" icon="add-outline" onPress={addMaladie} />
            </View>
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}><Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} /><Text style={styles.sectionTitle}>Demandes d'acces medecin</Text></View>
          {requests.length === 0 ? <Muted>Aucune demande.</Muted> : null}

          {pending.map((r) => (
            <View key={r.id} style={[styles.reqCard, compact && styles.reqCardCompact]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqName}>{r.medecinNom}</Text>
                <Muted>{r.medecinSpecialite}</Muted>
              </View>
              <View style={[styles.reqActions, compact && styles.reqActionsCompact]}>
                <Pressable style={styles.acceptBtn} onPress={() => changeRequest(r.id, 'accepted')}>
                  <Ionicons name="checkmark-outline" size={14} color="#166534" />
                  <Text style={styles.acceptBtnText}>Accepter</Text>
                </Pressable>
                <Pressable style={styles.refuseBtn} onPress={() => changeRequest(r.id, 'refused')}>
                  <Ionicons name="close-outline" size={14} color="#991b1b" />
                  <Text style={styles.refuseBtnText}>Refuser</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {accepted.map((r) => (
            <View key={r.id} style={[styles.reqCard, compact && styles.reqCardCompact]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reqName}>{r.medecinNom}</Text>
                <Muted>{r.medecinSpecialite}</Muted>
              </View>
              <Pressable style={[styles.refuseBtn, compact && styles.compactAction]} onPress={() => changeRequest(r.id, 'revoked')}>
                <Ionicons name="ban-outline" size={14} color="#991b1b" />
                <Text style={styles.refuseBtnText}>Revoquer</Text>
              </Pressable>
            </View>
          ))}
        </Card>

        <PrimaryButton label="Sauvegarder" icon="save-outline" onPress={persist} />
        <SecondaryButton
          label="Exporter PDF"
          icon="download-outline"
          onPress={async () => {
            const treatments = await getTreatments();
            await exportCarnetPDF(profile, treatments);
            showToast('Export PDF lance.', { tone: 'success' });
          }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingBottom: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fontFamilies.bodyBold,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  rowCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  actionBtnWrap: {
    width: 120,
  },
  fullWidth: {
    width: '100%',
  },
  tagWrap: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  reqCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reqCardCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  reqName: {
    color: colors.text,
    fontFamily: fontFamilies.bodyBold,
  },
  reqActions: {
    flexDirection: 'row',
    gap: 6,
  },
  reqActionsCompact: {
    flexDirection: 'column',
    width: '100%',
  },
  acceptBtn: {
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  acceptBtnText: {
    color: '#166534',
    fontFamily: fontFamilies.bodyBold,
  },
  refuseBtn: {
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refuseBtnText: {
    color: '#991b1b',
    fontFamily: fontFamilies.bodyBold,
  },
  compactAction: {
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
});
