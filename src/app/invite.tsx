import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Field, PrimaryButton } from '@/components/ui';
import { joinTrip } from '@/lib/tripSync';
import { useAuth } from '@/store/AuthStore';
import { colors } from '@/theme';

export default function InviteScreen() {
  const params = useLocalSearchParams<{ id?: string }>(); const { user } = useAuth();
  const [id, setId] = useState(params.id ?? ''); const [message, setMessage] = useState<string>(); const [working, setWorking] = useState(false);
  const join = async () => { if (!user) { setMessage('먼저 계정 화면에서 로그인하세요.'); return; } if (!id.trim()) return; setWorking(true); try { await joinTrip(id.trim()); setMessage('여행에 참여했습니다. 동기화 화면에서 여행을 내려받으세요.'); } catch (error) { setMessage(error instanceof Error ? error.message : '초대를 사용할 수 없습니다.'); } finally { setWorking(false); } };
  return <Screen title="여행 초대" eyebrow="동행자 참여" headerRight={<PrimaryButton compact label="닫기" onPress={() => router.back()} />}><Card style={styles.card}><Text style={styles.title}>초대 링크 확인</Text><Text style={styles.text}>초대 ID는 한 번 사용하면 폐기되며 만료된 링크는 사용할 수 없습니다.</Text><Field placeholder="초대 ID" value={id} onChangeText={setId} autoCapitalize="none" />{message ? <Text style={styles.message}>{message}</Text> : null}<PrimaryButton label={working ? '참여 중…' : '여행 참여'} onPress={join} /></Card></Screen>;
}
const styles = StyleSheet.create({ card: { gap: 14 }, title: { color: colors.ink, fontSize: 20, fontWeight: '900' }, text: { color: colors.muted, lineHeight: 20 }, message: { color: colors.primary, fontWeight: '700', lineHeight: 19 } });
