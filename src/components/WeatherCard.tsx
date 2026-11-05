import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWeather, weatherLabel } from '@/hooks/useWeather';
import { colors } from '@/theme';
import { Card, Pill } from './ui';

export function WeatherCard({ latitude, longitude, placeName }: { latitude?: number; longitude?: number; placeName: string }) {
  const { data, loading, error, refresh } = useWeather(latitude, longitude);
  if (!data) return <Card><View style={styles.row}><Text style={styles.icon}>☁</Text><View style={styles.copy}><Text style={styles.title}>{loading ? '날씨 확인 중' : '날씨 미확인'}</Text><Text style={styles.text}>{error ?? '현재 날씨를 조회하고 있습니다.'}</Text></View>{!loading ? <Pressable onPress={refresh}><Text style={styles.refresh}>다시 시도</Text></Pressable> : null}</View></Card>;
  return <Card><View style={styles.top}><View><Text style={styles.place}>{placeName} · {data.timezone}</Text><Text style={styles.temperature}>{Math.round(data.temperature)}°</Text></View><View style={styles.condition}><Text style={styles.weatherIcon}>{data.precipitation > 0 ? '☂' : '☀'}</Text><Text style={styles.label}>{weatherLabel(data.weatherCode)}</Text></View></View><View style={styles.details}><Text style={styles.detail}>강수 {data.precipitation}mm</Text><Text style={styles.detail}>바람 {data.windSpeed}km/h</Text><Pill tone={data.source === 'live' ? 'teal' : 'gray'}>{data.source === 'live' ? '자동 조회' : '저장된 정보'}</Pill></View>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable onPress={refresh} disabled={loading}><Text style={styles.updated}>Open-Meteo · {data.observedAt.replace('T', ' ')} 기준 {loading ? '· 갱신 중' : '· 눌러서 갱신'}</Text></Pressable></Card>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center' }, icon: { fontSize: 28, marginRight: 15 }, copy: { flex: 1 }, title: { color: colors.ink, fontWeight: '800', fontSize: 16 }, text: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }, refresh: { color: colors.primary, fontWeight: '800', fontSize: 12 }, top: { flexDirection: 'row', justifyContent: 'space-between' }, place: { color: colors.primary, fontSize: 12, fontWeight: '800' }, temperature: { color: colors.ink, fontSize: 42, fontWeight: '900', marginTop: 2 }, condition: { alignItems: 'center' }, weatherIcon: { fontSize: 30 }, label: { color: colors.ink, fontWeight: '800', marginTop: 2 }, details: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }, detail: { color: colors.muted, fontSize: 12, fontWeight: '700' }, updated: { color: colors.muted, fontSize: 11, marginTop: 14 }, error: { color: colors.danger, fontSize: 11, marginTop: 10 } });
