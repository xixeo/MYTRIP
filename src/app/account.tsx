import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { Card, Field, PrimaryButton, SectionTitle } from '@/components/ui';
import { useAuth } from '@/store/AuthStore';
import { colors } from '@/theme';

export default function AccountScreen() {
  const { configured, loading, user, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState<string>(); const [working, setWorking] = useState(false);
  const submit = async (mode: 'in' | 'up') => { if (!email.trim() || password.length < 6) { setMessage('이메일과 6자 이상의 비밀번호를 입력하세요.'); return; } setWorking(true); const error = mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password); setMessage(error ?? (mode === 'up' ? '가입 확인 메일 또는 로그인 상태를 확인하세요.' : '로그인했습니다.')); setWorking(false); };
  return <Screen title="계정" eyebrow="동행자 · 동기화" headerRight={<PrimaryButton compact label="닫기" onPress={() => router.back()} />}>
    {!configured ? <Card style={styles.notice}><Text style={styles.noticeTitle}>Supabase 설정 필요</Text><Text style={styles.noticeText}>환경 설정에 프로젝트 URL과 공개 anon 키를 추가하면 로그인과 공동 편집을 사용할 수 있습니다. 로컬 여행 기능은 계속 사용할 수 있습니다.</Text></Card> : null}
    {loading ? <Card><Text style={styles.center}>세션 확인 중…</Text></Card> : user ? <><Card style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>{user.email?.slice(0, 1).toUpperCase()}</Text></View><Text style={styles.email}>{user.email}</Text><Text style={styles.userId}>사용자 ID {user.id.slice(0, 8)}…</Text></Card><SectionTitle title="클라우드 상태" /><Card><Text style={styles.noticeTitle}>로그인됨</Text><Text style={styles.noticeText}>여행 데이터를 업로드하거나 참여 여행을 내려받을 수 있습니다.</Text><Pressable onPress={() => router.push('/sync')}><Text style={styles.sync}>동기화 관리 열기</Text></Pressable></Card><Pressable onPress={signOut}><Text style={styles.signOut}>로그아웃</Text></Pressable></> : <><SectionTitle title="로그인 또는 가입" /><Card style={styles.form}><Field autoCapitalize="none" keyboardType="email-address" placeholder="이메일" value={email} onChangeText={setEmail} /><Field secureTextEntry placeholder="비밀번호 (6자 이상)" value={password} onChangeText={setPassword} />{message ? <Text style={styles.message}>{message}</Text> : null}<PrimaryButton label={working ? '처리 중…' : '로그인'} onPress={() => submit('in')} /><Pressable disabled={working || !configured} onPress={() => submit('up')}><Text style={styles.signUp}>새 계정 만들기</Text></Pressable></Card></>}
  </Screen>;
}

const styles = StyleSheet.create({ notice: { backgroundColor: colors.accentSoft }, noticeTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' }, noticeText: { color: colors.muted, lineHeight: 20, marginTop: 6 }, center: { color: colors.muted, textAlign: 'center' }, profile: { alignItems: 'center', paddingVertical: 28 }, avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' }, email: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 12 }, userId: { color: colors.muted, fontSize: 11, marginTop: 5 }, form: { gap: 12 }, message: { color: colors.primary, lineHeight: 18, fontSize: 12 }, signUp: { color: colors.primary, fontWeight: '800', textAlign: 'center', padding: 8 }, sync: { color: colors.primary, fontWeight: '900', textAlign: 'center', paddingTop: 18 }, signOut: { color: colors.danger, fontWeight: '900', textAlign: 'center', marginTop: 24 } });
