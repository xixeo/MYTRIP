import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Pill, SectionTitle } from '@/components/ui';
import { Screen } from '@/components/Screen';
import { useTrip } from '@/store/TripStore';
import { colors, radius } from '@/theme';

export default function HomeScreen() {
  const { state } = useTrip();
  const completed = state.itinerary.filter((item) => item.status === 'done').length;
  const next = state.itinerary.find((item) => item.status === 'planned');
  return <Screen title={state.trip.name} eyebrow="MYTRIP · JAPAN">
    <LinearGradient colors={['#087A84', '#14556E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <Text style={styles.heroKicker}>{state.trip.destination}</Text><Text style={styles.heroTitle}>여행까지 16일</Text><Text style={styles.heroDate}>{state.trip.startDate} — {state.trip.endDate}</Text>
      <View style={styles.heroStats}><View><Text style={styles.statValue}>{state.itinerary.length}</Text><Text style={styles.statLabel}>일정</Text></View><View><Text style={styles.statValue}>{state.places.length}</Text><Text style={styles.statLabel}>저장 장소</Text></View><View><Text style={styles.statValue}>{state.shopping.length}</Text><Text style={styles.statLabel}>쇼핑</Text></View></View>
    </LinearGradient>
    <SectionTitle title="다음 일정" action={<Pill tone="orange">{completed}/{state.itinerary.length} 완료</Pill>} />
    <Pressable onPress={() => router.push('/schedule')}><Card style={styles.nextCard}>{next ? <><View style={styles.timeBlock}><Text style={styles.time}>{next.time}</Text><Text style={styles.day}>{next.day}</Text></View><View style={styles.nextCopy}><Text style={styles.nextTitle}>{next.title}</Text><Text style={styles.nextMeta}>{next.category} · {next.durationMinutes}분</Text></View><Text style={styles.arrow}>›</Text></> : <Text style={styles.nextTitle}>오늘 일정이 모두 끝났어요</Text>}</Card></Pressable>
    <SectionTitle title="여행 준비" /><View style={styles.grid}><QuickCard value={`${state.info.filter((item) => item.complete).length}/${state.info.length}`} label="준비 완료" tone="#FFF0DC" onPress={() => router.push('/info')} /><QuickCard value={`${state.shopping.filter((item) => item.status === 'bought').length}`} label="구매 완료" tone="#DDF1F1" onPress={() => router.push('/shopping')} /></View>
    <SectionTitle title="현지 정보" /><Card><View style={styles.noticeRow}><Text style={styles.noticeIcon}>☀</Text><View style={styles.noticeCopy}><Text style={styles.noticeTitle}>날씨 연결 준비 중</Text><Text style={styles.noticeText}>공급자 선택 후 방문 시간별 예보를 표시합니다.</Text></View></View></Card>
  </Screen>;
}
function QuickCard({ value, label, tone, onPress }: { value: string; label: string; tone: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.quickCard, { backgroundColor: tone }]}><Text style={styles.quickValue}>{value}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ hero: { borderRadius: radius.large, padding: 24, overflow: 'hidden' }, heroKicker: { color: '#BFE5E5', fontWeight: '800', fontSize: 13, letterSpacing: 0.8 }, heroTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 8, letterSpacing: -0.8 }, heroDate: { color: '#D8EEF1', marginTop: 5, fontWeight: '600' }, heroStats: { flexDirection: 'row', gap: 32, marginTop: 28 }, statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' }, statLabel: { color: '#C6E1E5', fontSize: 12, marginTop: 2 }, nextCard: { flexDirection: 'row', alignItems: 'center' }, timeBlock: { width: 75 }, time: { color: colors.primary, fontSize: 20, fontWeight: '900' }, day: { color: colors.muted, fontSize: 11, marginTop: 3 }, nextCopy: { flex: 1 }, nextTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' }, nextMeta: { color: colors.muted, fontSize: 13, marginTop: 5 }, arrow: { fontSize: 30, color: colors.primary }, grid: { flexDirection: 'row', gap: 12 }, quickCard: { flex: 1, padding: 18, borderRadius: radius.medium }, quickValue: { color: colors.ink, fontSize: 25, fontWeight: '900' }, quickLabel: { color: colors.muted, fontWeight: '700', marginTop: 5 }, noticeRow: { flexDirection: 'row', alignItems: 'center' }, noticeIcon: { fontSize: 28, marginRight: 15 }, noticeCopy: { flex: 1 }, noticeTitle: { color: colors.ink, fontWeight: '800', fontSize: 16 }, noticeText: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 } });
