import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MapCanvas } from '../../components/MapCanvas';
import { Screen } from '@/components/Screen';
import { Card, Field, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { useTrip } from '@/store/TripStore';
import { colors } from '@/theme';
import { SavedPlace } from '@/types';
import { dateLabel, eachDate } from '@/utils/dates';

type PlaceDraft = { name: string; category: string; area: string; address: string; note: string; latitude: string; longitude: string };
const blank: PlaceDraft = { name: '', category: '관광', area: '', address: '', note: '', latitude: '', longitude: '' };

export default function MapScreen() {
  const { state, savePlace, deletePlace, addPlan } = useTrip();
  const days = useMemo(() => eachDate(state.trip.startDate, state.trip.endDate), [state.trip.endDate, state.trip.startDate]);
  const [open, setOpen] = useState(false); const [editingId, setEditingId] = useState<string>(); const [draft, setDraft] = useState<PlaceDraft>(blank);
  const [schedulePlace, setSchedulePlace] = useState<SavedPlace>(); const [day, setDay] = useState(days[0]); const [time, setTime] = useState('10:00');
  const start = (place?: SavedPlace) => { setEditingId(place?.id); setDraft(place ? { name: place.name, category: place.category, area: place.area, address: place.address ?? '', note: place.note, latitude: place.latitude?.toString() ?? '', longitude: place.longitude?.toString() ?? '' } : blank); setOpen(true); };
  const save = () => {
    if (!draft.name.trim()) return;
    const latitude = draft.latitude.trim() ? Number(draft.latitude) : undefined; const longitude = draft.longitude.trim() ? Number(draft.longitude) : undefined;
    if ((latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) || (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) return;
    savePlace(editingId, { name: draft.name.trim(), category: draft.category.trim() || '직접 등록', area: draft.area.trim() || '지역 미지정', address: draft.address.trim(), note: draft.note.trim(), latitude, longitude }); setOpen(false);
  };
  const openMap = (place: SavedPlace) => {
    const query = place.latitude !== undefined && place.longitude !== undefined ? `${place.latitude},${place.longitude}` : place.address?.trim() || place.name;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`).catch(() => Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.'));
  };
  const remove = () => { if (!editingId) return; Alert.alert('장소 삭제', '저장 장소에서 삭제할까요? 기존 일정은 유지됩니다.', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => { deletePlace(editingId); setOpen(false); } }]); };
  const schedule = () => { if (!schedulePlace) return; addPlan({ title: schedulePlace.name, category: schedulePlace.category, day: days.includes(day) ? day : days[0], time }); setSchedulePlace(undefined); };

  return <Screen title="저장 장소" eyebrow="지도 · 장소" headerRight={<PrimaryButton compact label="+ 장소" onPress={() => start()} />}>
    <MapCanvas places={state.places} /><SectionTitle title={`저장한 장소 ${state.places.length}`} />
    {state.places.map((place) => <Card key={place.id} style={styles.placeCard}><View style={styles.pin}><Text style={styles.pinText}>⌖</Text></View><Pressable style={styles.copy} onPress={() => start(place)}><Text style={styles.name}>{place.name}</Text><Text style={styles.meta}>{place.area} · {place.note || '메모 없음'}</Text>{place.address ? <Text style={styles.address}>{place.address}</Text> : null}<Text style={styles.coordinates}>{place.latitude !== undefined ? `${place.latitude.toFixed(4)}, ${place.longitude?.toFixed(4)}` : '좌표 미입력'}</Text></Pressable><View style={styles.side}><Pill>{place.category}</Pill><Pressable onPress={() => openMap(place)}><Text style={styles.mapLink}>지도 열기</Text></Pressable><Pressable onPress={() => { setSchedulePlace(place); setDay(days[0]); }}><Text style={styles.schedule}>일정 추가</Text></Pressable></View></Card>)}
    {state.places.length === 0 ? <Card style={styles.empty}><Text style={styles.emptyTitle}>저장한 장소가 없습니다</Text><Text style={styles.emptyText}>직접 장소와 좌표를 등록하면 지도와 일정에서 사용할 수 있습니다.</Text></Card> : null}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><View style={styles.overlay}><Card style={styles.modal}><Text style={styles.modalTitle}>{editingId ? '장소 수정' : '장소 등록'}</Text><Field placeholder="장소 이름" value={draft.name} onChangeText={(name) => setDraft((current) => ({ ...current, name }))} /><View style={styles.inline}><Field placeholder="분류" value={draft.category} onChangeText={(category) => setDraft((current) => ({ ...current, category }))} /><Field placeholder="지역" value={draft.area} onChangeText={(area) => setDraft((current) => ({ ...current, area }))} /></View><Field placeholder="주소 (지도 검색에 사용)" value={draft.address} onChangeText={(address) => setDraft((current) => ({ ...current, address }))} /><Field placeholder="직접 확인 메모" value={draft.note} onChangeText={(note) => setDraft((current) => ({ ...current, note }))} /><Text style={styles.groupLabel}>좌표 (선택)</Text><View style={styles.inline}><Field placeholder="위도" keyboardType="decimal-pad" value={draft.latitude} onChangeText={(latitude) => setDraft((current) => ({ ...current, latitude }))} /><Field placeholder="경도" keyboardType="decimal-pad" value={draft.longitude} onChangeText={(longitude) => setDraft((current) => ({ ...current, longitude }))} /></View>{editingId ? <Pressable onPress={remove}><Text style={styles.delete}>이 장소 삭제</Text></Pressable> : null}<View style={styles.actions}><Pressable onPress={() => setOpen(false)}><Text style={styles.cancel}>취소</Text></Pressable><PrimaryButton label="저장" onPress={save} /></View></Card></View></Modal>
    <Modal visible={!!schedulePlace} transparent animationType="fade" onRequestClose={() => setSchedulePlace(undefined)}><View style={styles.overlay}><Card style={styles.modal}><Text style={styles.modalTitle}>{schedulePlace?.name} 일정</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>{days.map((value) => <Pressable key={value} onPress={() => setDay(value)} style={[styles.day, day === value && styles.activeDay]}><Text style={[styles.dayText, day === value && styles.activeDayText]}>{dateLabel(value)}</Text></Pressable>)}</ScrollView><Field placeholder="시간 HH:MM" value={time} onChangeText={setTime} /><View style={styles.actions}><Pressable onPress={() => setSchedulePlace(undefined)}><Text style={styles.cancel}>취소</Text></Pressable><PrimaryButton label="일정에 추가" onPress={schedule} /></View></Card></View></Modal>
  </Screen>;
}

const styles = StyleSheet.create({ placeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, pin: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, pinText: { color: colors.primary, fontSize: 20 }, copy: { flex: 1 }, name: { color: colors.ink, fontSize: 16, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 12, marginTop: 4 }, address: { color: colors.ink, fontSize: 11, marginTop: 5 }, coordinates: { color: colors.muted, fontSize: 10, marginTop: 4 }, side: { alignItems: 'flex-end', gap: 10 }, mapLink: { color: colors.success, fontWeight: '800', fontSize: 11 }, schedule: { color: colors.primary, fontWeight: '800', fontSize: 11 }, empty: { alignItems: 'center' }, emptyTitle: { color: colors.ink, fontWeight: '900', fontSize: 17 }, emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6 }, overlay: { flex: 1, backgroundColor: 'rgba(15,35,50,0.45)', justifyContent: 'center', padding: 22 }, modal: { gap: 10 }, modalTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' }, inline: { flexDirection: 'row', gap: 10 }, groupLabel: { color: colors.ink, fontSize: 12, fontWeight: '800' }, delete: { color: colors.danger, textAlign: 'center', fontWeight: '800', padding: 5 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 5 }, cancel: { color: colors.muted, fontWeight: '800' }, days: { gap: 8 }, day: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10 }, activeDay: { backgroundColor: colors.primary, borderColor: colors.primary }, dayText: { color: colors.ink, fontWeight: '700', fontSize: 12 }, activeDayText: { color: '#FFFFFF' } });
