import React, { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '@/theme';

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) { return <View style={styles.sectionRow}><Text style={styles.sectionTitle}>{title}</Text>{action}</View>; }
export function Pill({ children, tone = 'teal' }: PropsWithChildren<{ tone?: 'teal' | 'orange' | 'gray' }>) { return <View style={[styles.pill, tone === 'orange' && styles.orangePill, tone === 'gray' && styles.grayPill]}><Text style={styles.pillText}>{children}</Text></View>; }
export function PrimaryButton({ label, onPress, compact = false }: { label: string; onPress: () => void; compact?: boolean }) { return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, compact && styles.compactButton, pressed && styles.pressed]}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
export function Field(props: TextInputProps) { return <TextInput placeholderTextColor="#8A98A6" {...props} style={[styles.input, props.style]} />; }

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.medium, padding: 18, borderWidth: 1, borderColor: colors.border, shadowColor: '#17324D', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.tealSoft }, orangePill: { backgroundColor: colors.accentSoft }, grayPill: { backgroundColor: '#EDF1F3' }, pillText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  button: { backgroundColor: colors.primary, borderRadius: radius.small, paddingHorizontal: 18, paddingVertical: 14, alignItems: 'center' }, compactButton: { paddingVertical: 9, paddingHorizontal: 13 }, buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 }, pressed: { opacity: 0.72 },
  input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.small, paddingHorizontal: 14, color: colors.ink, backgroundColor: '#FAFCFC', fontSize: 15 },
});
