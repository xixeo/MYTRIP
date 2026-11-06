import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui';
import { useTrip } from '@/store/TripStore';
import { colors } from '@/theme';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions(); const [locked, setLocked] = useState(false); const { saveShopping } = useTrip();
  const scanned = ({ data, type }: BarcodeScanningResult) => { if (locked) return; setLocked(true); saveShopping(undefined, { name: `바코드 상품 ${data.slice(-6)}`, store: '매장 미정', quantity: 1, barcode: data }); router.back(); };
  if (!permission) return <View style={styles.center}><Text style={styles.text}>카메라 권한 확인 중…</Text></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={styles.title}>카메라 권한이 필요합니다</Text><Text style={styles.text}>스캔한 코드는 상품 후보에만 저장되며 상품명이나 규격을 자동 확정하지 않습니다.</Text><PrimaryButton label="권한 요청" onPress={requestPermission} /><PrimaryButton label="닫기" onPress={() => router.back()} /></View>;
  return <View style={styles.container}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }} onBarcodeScanned={locked ? undefined : scanned} /><View style={styles.overlay}><View style={styles.frame} /><Text style={styles.guide}>JAN/EAN 바코드를 프레임 안에 맞추세요</Text><Text style={styles.disclaimer}>바코드는 상품 DB 조회 결과가 아닙니다.</Text><PrimaryButton compact label="닫기" onPress={() => router.back()} /></View></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#000' }, center: { flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: 30, gap: 16 }, title: { color: colors.ink, fontSize: 22, fontWeight: '900' }, text: { color: colors.muted, textAlign: 'center', lineHeight: 20 }, overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)', padding: 24 }, frame: { width: '88%', height: 180, borderWidth: 3, borderColor: '#FFFFFF', borderRadius: 18 }, guide: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 22 }, disclaimer: { color: '#E5ECEE', fontSize: 12, marginTop: 7, marginBottom: 24 } });
