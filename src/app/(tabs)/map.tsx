import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Card, Field, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { useTrip } from '@/store/TripStore';
import { colors, radius } from '@/theme';

export default function MapScreen() {
  const { state, addPlace } = useTrip(); const [name, setName] = useState('');
  const submit = () => { if (name.trim()) { addPlace({ name: name.trim(), category: '직접 등록', area: '지역 미지정' }); setName(''); } };
  return <Screen title="저장 장소" eyebrow="지도 · 장소"><View style={styles.mapPlaceholder}><View style={styles.mapCircle}><Text style={styles.mapIcon}>⌖</Text></View><Text style={styles.mapTitle}>지도 연결 준비 완료</Text><Text style={styles.mapText}>Google Maps 키를 설정하면 저장 장소와 계획 경로를 여기에 표시합니다.</Text></View><SectionTitle title="장소 직접 추가" /><Card style={styles.form}><Field placeholder="장소 이름" value={name} onChangeText={setName} onSubmitEditing={submit} /><PrimaryButton compact label="저장" onPress={submit} /></Card><SectionTitle title={`저장한 장소 ${state.places.length}`} />{state.places.map((place) => <Card key={place.id} style={styles.placeCard}><View style={styles.pin}><Text style={styles.pinText}>⌖</Text></View><View style={styles.placeCopy}><Text style={styles.placeName}>{place.name}</Text><Text style={styles.placeMeta}>{place.area} · {place.note || '메모 없음'}</Text></View><Pill>{place.category}</Pill></Card>)}</Screen>;
}
const styles = StyleSheet.create({ mapPlaceholder: { minHeight: 230, borderRadius: radius.large, backgroundColor: '#DDEBEA', alignItems: 'center', justifyContent: 'center', padding: 28, borderWidth: 1, borderColor: '#C3DAD9' }, mapCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, mapIcon: { color: colors.primary, fontSize: 32 }, mapTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 16 }, mapText: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 7 }, form: { flexDirection: 'row', gap: 10 }, placeCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, pin: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, pinText: { color: colors.primary, fontSize: 20 }, placeCopy: { flex: 1 }, placeName: { color: colors.ink, fontSize: 16, fontWeight: '800' }, placeMeta: { color: colors.muted, fontSize: 12, marginTop: 4 } });
