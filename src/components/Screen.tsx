import React, { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme';

export function Screen({ title, eyebrow, children, headerRight }: PropsWithChildren<{ title: string; eyebrow?: string; headerRight?: ReactNode }>) {
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><View style={styles.headerCopy}>{eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}<Text style={styles.title}>{title}</Text></View>{headerRight}</View>{children}</ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 44 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, headerCopy: { flex: 1 }, eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -1 } });
