import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';
import { SavedPlace } from '@/types';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function MapCanvas({ places }: { places: SavedPlace[] }) {
  const mapped = places.filter((place) => place.latitude !== undefined && place.longitude !== undefined);
  const center: [number, number] = [mapped[0]?.longitude ?? 139.7671, mapped[0]?.latitude ?? 35.6812];
  return <View style={styles.container}><Map style={StyleSheet.absoluteFill} mapStyle={STYLE_URL}><Camera initialViewState={{ center, zoom: mapped.length ? 10 : 8 }} />{mapped.map((place) => <Marker key={place.id} id={place.id} lngLat={[place.longitude!, place.latitude!]} anchor="bottom"><View style={styles.marker}><Text style={styles.markerText}>●</Text></View></Marker>)}</Map>{mapped.length === 0 ? <View style={styles.overlay}><Text style={styles.overlayText}>좌표가 있는 장소를 저장하면 지도에 표시됩니다.</Text></View> : null}<View style={styles.source}><Text style={styles.sourceText}>© OpenStreetMap · OpenFreeMap</Text></View></View>;
}

const styles = StyleSheet.create({ container: { height: 260, borderRadius: radius.large, overflow: 'hidden', borderWidth: 1, borderColor: '#C3DAD9' }, marker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.primary }, markerText: { color: colors.accent, fontSize: 15, lineHeight: 17 }, overlay: { position: 'absolute', left: 20, right: 20, bottom: 38, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 12 }, overlayText: { color: colors.ink, textAlign: 'center', fontWeight: '700' }, source: { position: 'absolute', right: 7, bottom: 5, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 }, sourceText: { color: colors.muted, fontSize: 8 } });
