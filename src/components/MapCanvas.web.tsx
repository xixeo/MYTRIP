import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';
import { SavedPlace } from '@/types';

export function MapCanvas({ places }: { places: SavedPlace[] }) {
  const count = places.filter((place) => place.latitude !== undefined && place.longitude !== undefined).length;
  return <View style={styles.canvas}><View style={styles.circle}><Text style={styles.icon}>⌖</Text></View><Text style={styles.title}>네이티브 지도 준비 완료</Text><Text style={styles.text}>iOS·Android 앱에서 좌표가 있는 {count}개 장소를 지도에 표시합니다. 웹에서는 장소 목록을 이용하세요.</Text></View>;
}
const styles = StyleSheet.create({ canvas: { minHeight: 230, borderRadius: radius.large, backgroundColor: '#DDEBEA', alignItems: 'center', justifyContent: 'center', padding: 28, borderWidth: 1, borderColor: '#C3DAD9' }, circle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, icon: { color: colors.primary, fontSize: 32 }, title: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 16 }, text: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 7 } });
