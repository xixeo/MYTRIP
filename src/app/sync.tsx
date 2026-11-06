import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Pill, PrimaryButton, SectionTitle } from '@/components/ui';
import { downloadTrips, uploadTrip } from '@/lib/tripSync';
import { useAuth } from '@/store/AuthStore';
import { useTrip } from '@/store/TripStore';
import { colors } from '@/theme';

export default function SyncScreen() {
  const { user } = useAuth(); const { state, trips, updateTrip, mergeCloudTrip } = useTrip();
  const [message, setMessage] = useState<string>(); const [working, setWorking] = useState(false);
  const upload = async () => { if (!user) return; setWorking(true); try { const cloud = await uploadTrip(state, user.id); updateTrip(state.trip.id, { ...state.trip, ...cloud }); setMessage('현재 여행을 클라우드에 저장했습니다.'); } catch (error) { setMessage(error instanceof Error ? error.message : '업로드하지 못했습니다.'); } finally { setWorking(false); } };
  const download = async () => { setWorking(true); try { const cloudTrips = await downloadTrips(); cloudTrips.forEach(mergeCloudTrip); setMessage(`${cloudTrips.length}개 여행을 내려받았습니다.`); } catch (error) { setMessage(error instanceof Error ? error.message : '다운로드하지 못했습니다.'); } finally { setWorking(false); } };
  return <Screen title="클라우드 동기화" eyebrow="Supabase" headerRight={<PrimaryButton compact label="닫기" onPress={() => router.back()} />}>
    <Card style={styles.notice}><Text style={styles.noticeTitle}>위치 기록은 동기화하지 않습니다</Text><Text style={styles.noticeText}>일정·장소·쇼핑·예약·준비물만 공유하며 실제 이동 좌표는 기기에 남습니다.</Text></Card>
    <SectionTitle title="현재 여행" /><Card><Text style={styles.tripTitle}>{state.trip.name}</Text><Text style={styles.meta}>{state.trip.destination} · 로컬 여행 {trips.length}개</Text><Pill tone={state.trip.cloudId ? 'teal' : 'gray'}>{state.trip.cloudId ? `클라우드 v${state.trip.cloudVersion}` : '로컬 전용'}</Pill><PrimaryButton label={working ? '처리 중…' : '현재 여행 업로드'} onPress={upload} /></Card>
    <SectionTitle title="참여 여행" /><Card><Text style={styles.noticeText}>내가 소유하거나 동행자로 참여한 여행을 내려받습니다. 같은 여행은 클라우드 버전으로 갱신됩니다.</Text><Pressable disabled={working} onPress={download}><Text style={styles.download}>클라우드 여행 내려받기</Text></Pressable></Card>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({ notice: { backgroundColor: colors.tealSoft }, noticeTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 }, noticeText: { color: colors.muted, lineHeight: 20, marginTop: 5 }, tripTitle: { color: colors.ink, fontWeight: '900', fontSize: 20 }, meta: { color: colors.muted, marginTop: 5, marginBottom: 12 }, download: { color: colors.primary, fontWeight: '900', textAlign: 'center', padding: 14, marginTop: 10 }, message: { color: colors.primary, fontWeight: '800', textAlign: 'center', marginTop: 18 } });
