import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { colors, radius } from '@/theme';
import { SavedPlace } from '@/types';

export function MapCanvas({ places }: { places: SavedPlace[] }) {
  const mapped = places.filter((place) => place.latitude !== undefined && place.longitude !== undefined);
  const androidNeedsKey = Platform.OS === 'android' && !process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (androidNeedsKey) return <MapNotice title="Google Maps 키가 필요합니다" text="Android 지도를 표시하려면 환경 설정에 플랫폼 제한을 적용한 API 키를 추가하세요." />;
  return <View style={styles.container}><MapView style={StyleSheet.absoluteFill} initialRegion={{ latitude: mapped[0]?.latitude ?? 35.6812, longitude: mapped[0]?.longitude ?? 139.7671, latitudeDelta: 0.12, longitudeDelta: 0.12 }}>{mapped.map((place) => <Marker key={place.id} coordinate={{ latitude: place.latitude!, longitude: place.longitude! }} title={place.name} description={place.note || place.area} />)}</MapView>{mapped.length === 0 ? <View style={styles.overlay}><Text style={styles.overlayText}>좌표가 있는 장소를 저장하면 지도에 표시됩니다.</Text></View> : null}</View>;
}

function MapNotice({ title, text }: { title: string; text: string }) { return <View style={styles.notice}><View style={styles.circle}><Text style={styles.icon}>⌖</Text></View><Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text></View>; }
const styles = StyleSheet.create({ container: { height: 260, borderRadius: radius.large, overflow: 'hidden', borderWidth: 1, borderColor: '#C3DAD9' }, notice: { minHeight: 230, borderRadius: radius.large, backgroundColor: '#DDEBEA', alignItems: 'center', justifyContent: 'center', padding: 28, borderWidth: 1, borderColor: '#C3DAD9' }, circle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, icon: { color: colors.primary, fontSize: 32 }, title: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 16 }, text: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 7 }, overlay: { position: 'absolute', left: 20, right: 20, bottom: 18, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 12 }, overlayText: { color: colors.ink, textAlign: 'center', fontWeight: '700' } });
