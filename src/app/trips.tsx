import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Field, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { useTrip } from '@/store/TripStore';
import { colors } from '@/theme';
import { TripState } from '@/types';

type Draft = Pick<TripState['trip'], 'name' | 'destination' | 'startDate' | 'endDate'>;
const blank: Draft = { name: '', destination: '', startDate: '2026-11-21', endDate: '2026-11-24' };

export default function TripsScreen() {
  const { state, trips, createTrip, updateTrip, deleteTrip, selectTrip, duplicateTrip } = useTrip();
  const [open, setOpen] = useState(false); const [editingId, setEditingId] = useState<string>(); const [draft, setDraft] = useState<Draft>(blank);
  const startCreate = () => { setEditingId(undefined); setDraft(blank); setOpen(true); };
  const startEdit = (trip: TripState) => { setEditingId(trip.trip.id); setDraft(trip.trip); setOpen(true); };
  const save = () => {
    if (!draft.name.trim() || !draft.destination.trim() || draft.endDate < draft.startDate) return;
    if (editingId) updateTrip(editingId, draft); else createTrip(draft);
    setOpen(false);
  };
  const remove = (trip: TripState) => Alert.alert('여행 삭제', `${trip.trip.name}과 연결된 로컬 데이터를 삭제할까요?`, [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => deleteTrip(trip.trip.id) }]);

  return <Screen title="내 여행" eyebrow="여행 관리" headerRight={<PrimaryButton compact label="닫기" onPress={() => router.back()} />}>
    <Card style={styles.notice}><Text style={styles.noticeTitle}>{trips.length}개의 여행</Text><Text style={styles.noticeText}>선택한 여행의 일정·장소·쇼핑·준비물이 각자 보관됩니다.</Text></Card>
    <SectionTitle title="여행 목록" action={<PrimaryButton compact label="+ 새 여행" onPress={startCreate} />} />
    {trips.map((trip) => <Pressable key={trip.trip.id} onPress={() => { selectTrip(trip.trip.id); router.back(); }}><Card style={[styles.tripCard, state.trip.id === trip.trip.id && styles.activeCard]}><View style={styles.tripCopy}><View style={styles.tripTitleRow}><Text style={styles.tripTitle}>{trip.trip.name}</Text>{state.trip.id === trip.trip.id ? <Pill>선택됨</Pill> : null}</View><Text style={styles.destination}>{trip.trip.destination}</Text><Text style={styles.date}>{trip.trip.startDate} — {trip.trip.endDate}</Text><Text style={styles.count}>{trip.itinerary.length}개 일정 · {trip.places.length}개 장소</Text></View><View style={styles.actions}><Pressable onPress={(event) => { event.stopPropagation(); duplicateTrip(trip.trip.id); }} hitSlop={8}><Text style={styles.copyAction}>복제</Text></Pressable><Pressable onPress={(event) => { event.stopPropagation(); startEdit(trip); }} hitSlop={8}><Text style={styles.edit}>수정</Text></Pressable><Pressable disabled={trips.length === 1} onPress={(event) => { event.stopPropagation(); remove(trip); }} hitSlop={8}><Text style={[styles.delete, trips.length === 1 && styles.disabled]}>삭제</Text></Pressable></View></Card></Pressable>)}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><Card style={styles.modal}><Text style={styles.modalTitle}>{editingId ? '여행 수정' : '새 여행'}</Text><Field placeholder="여행 이름" value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} /><Field placeholder="도시 · 국가" value={draft.destination} onChangeText={(destination) => setDraft((current) => ({ ...current, destination }))} /><Field placeholder="시작일 YYYY-MM-DD" value={draft.startDate} onChangeText={(startDate) => setDraft((current) => ({ ...current, startDate }))} /><Field placeholder="종료일 YYYY-MM-DD" value={draft.endDate} onChangeText={(endDate) => setDraft((current) => ({ ...current, endDate }))} />{draft.endDate < draft.startDate ? <Text style={styles.error}>종료일은 시작일보다 빠를 수 없습니다.</Text> : null}<View style={styles.modalActions}><Pressable onPress={() => setOpen(false)}><Text style={styles.cancel}>취소</Text></Pressable><PrimaryButton label="저장" onPress={save} /></View></Card></View></Modal>
  </Screen>;
}

const styles = StyleSheet.create({ notice: { backgroundColor: colors.tealSoft }, noticeTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, noticeText: { color: colors.muted, marginTop: 5, lineHeight: 19 }, tripCard: { flexDirection: 'row', marginBottom: 12 }, activeCard: { borderColor: colors.primary, borderWidth: 2 }, tripCopy: { flex: 1 }, tripTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, tripTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' }, destination: { color: colors.primary, fontWeight: '700', marginTop: 7 }, date: { color: colors.muted, marginTop: 4 }, count: { color: colors.muted, fontSize: 12, marginTop: 10 }, actions: { justifyContent: 'center', alignItems: 'flex-end', gap: 10 }, copyAction: { color: colors.success, fontWeight: '800' }, edit: { color: colors.primary, fontWeight: '800' }, delete: { color: colors.danger, fontWeight: '800' }, disabled: { opacity: 0.3 }, overlay: { flex: 1, backgroundColor: 'rgba(15,35,50,0.45)', justifyContent: 'center', padding: 24 }, modal: { gap: 11 }, modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '900', marginBottom: 5 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 8 }, cancel: { color: colors.muted, fontWeight: '800' }, error: { color: colors.danger, fontSize: 12, fontWeight: '700' } });
