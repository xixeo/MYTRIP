import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { useTrip } from '@/store/TripStore';
import { colors } from '@/theme';
import { formatDistance, trackDistance } from '@/utils/tracking';

export default function TrackingScreen() {
  const { state, createTrackSession, setTrackStatus, appendTrackPoint, deleteTrackSession } = useTrip();
  const subscription = useRef<Location.LocationSubscription | null>(null); const [activeId, setActiveId] = useState<string>(); const [error, setError] = useState<string>();
  const active = state.trackSessions.find((session) => session.id === activeId);
  useEffect(() => () => { subscription.current?.remove(); }, []);

  const watch = async (id: string) => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) { setError('위치 권한이 필요합니다. 기기 설정에서 권한을 허용하세요.'); return false; }
    subscription.current = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5_000, distanceInterval: 10 }, (position) => appendTrackPoint(id, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, altitude: position.coords.altitude, timestamp: position.timestamp }));
    setError(undefined); return true;
  };
  const start = async () => { const id = `track-${Date.now()}`; if (await watch(id)) { createTrackSession(id, Date.now()); setActiveId(id); } };
  const pause = () => { if (!activeId) return; subscription.current?.remove(); subscription.current = null; setTrackStatus(activeId, 'paused'); };
  const resume = async () => { if (activeId && await watch(activeId)) setTrackStatus(activeId, 'recording'); };
  const stop = () => { if (!activeId) return; subscription.current?.remove(); subscription.current = null; setTrackStatus(activeId, 'finished'); setActiveId(undefined); };
  const remove = (id: string) => Alert.alert('이동 기록 삭제', '이 세션의 모든 좌표를 삭제할까요?', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => deleteTrackSession(id) }]);

  return <Screen title="실제 이동 기록" eyebrow={state.trip.name} headerRight={<PrimaryButton compact label="닫기" onPress={() => router.back()} />}>
    <Card style={styles.privacy}><Text style={styles.privacyTitle}>기본 비공개</Text><Text style={styles.privacyText}>위치는 이 기기에만 저장되며 자동 공유되지 않습니다. 현재 버전은 앱이 열린 동안의 전경 기록을 지원합니다.</Text></Card>
    <SectionTitle title="기록 제어" />
    <Card style={styles.control}><View style={[styles.pulse, active?.status === 'recording' && styles.recording]}><Text style={styles.pulseText}>{active?.status === 'recording' ? '●' : '⌖'}</Text></View><Text style={styles.controlTitle}>{active?.status === 'recording' ? '이동 기록 중' : active?.status === 'paused' ? '일시정지됨' : '새 이동 기록'}</Text><Text style={styles.controlText}>{active ? `${active.points.length}개 좌표 · ${formatDistance(trackDistance(active.points))}` : '시작을 누르면 위치 권한을 확인합니다.'}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.buttons}>{!active ? <PrimaryButton label="기록 시작" onPress={start} /> : active.status === 'recording' ? <><PrimaryButton label="일시정지" onPress={pause} /><Pressable onPress={stop}><Text style={styles.stop}>종료</Text></Pressable></> : <><PrimaryButton label="기록 재개" onPress={resume} /><Pressable onPress={stop}><Text style={styles.stop}>종료</Text></Pressable></>}</View></Card>
    <SectionTitle title="지난 기록" />
    {[...state.trackSessions].reverse().map((session) => <Pressable key={session.id} onLongPress={() => remove(session.id)}><Card style={styles.session}><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{new Date(session.startedAt).toLocaleString('ko-KR')}</Text><Text style={styles.sessionMeta}>{session.points.length}개 좌표 · {formatDistance(trackDistance(session.points))}{session.endedAt ? ` · ${Math.max(1, Math.round((session.endedAt - session.startedAt) / 60_000))}분` : ''}</Text></View><Pill tone={session.status === 'finished' ? 'gray' : 'teal'}>{session.status === 'finished' ? '종료' : session.status === 'paused' ? '일시정지' : '기록 중'}</Pill></Card></Pressable>)}
    {state.trackSessions.length === 0 ? <Card><Text style={styles.empty}>아직 이동 기록이 없습니다.</Text></Card> : null}<Text style={styles.hint}>기록을 길게 누르면 삭제할 수 있습니다. GPS 오차와 권한 변경으로 경로가 누락될 수 있습니다.</Text>
  </Screen>;
}

const styles = StyleSheet.create({ privacy: { backgroundColor: colors.tealSoft }, privacyTitle: { color: colors.primary, fontWeight: '900' }, privacyText: { color: colors.ink, lineHeight: 20, marginTop: 5 }, control: { alignItems: 'center', paddingVertical: 28 }, pulse: { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' }, recording: { backgroundColor: '#FFE3E3' }, pulseText: { color: colors.danger, fontSize: 27 }, controlTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 14 }, controlText: { color: colors.muted, marginTop: 6 }, error: { color: colors.danger, textAlign: 'center', marginTop: 10 }, buttons: { flexDirection: 'row', alignItems: 'center', gap: 22, marginTop: 18 }, stop: { color: colors.danger, fontWeight: '900' }, session: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }, sessionCopy: { flex: 1 }, sessionTitle: { color: colors.ink, fontWeight: '800' }, sessionMeta: { color: colors.muted, fontSize: 12, marginTop: 5 }, empty: { color: colors.muted, textAlign: 'center' }, hint: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 10 } });
