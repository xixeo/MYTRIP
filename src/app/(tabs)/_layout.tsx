import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

const icons: Record<string, string> = { index: '⌂', schedule: '▤', map: '⌖', shopping: '♢', info: '☰' };
export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#84919D', tabBarStyle: styles.tabBar, tabBarLabelStyle: styles.label, tabBarIcon: ({ color }) => <Text style={[styles.icon, { color }]}>{icons[route.name] ?? '•'}</Text> })}>
    <Tabs.Screen name="index" options={{ title: '홈' }} /><Tabs.Screen name="schedule" options={{ title: '일정' }} /><Tabs.Screen name="map" options={{ title: '지도' }} /><Tabs.Screen name="shopping" options={{ title: '쇼핑' }} /><Tabs.Screen name="info" options={{ title: '여행정보' }} />
  </Tabs>;
}
const styles = StyleSheet.create({ tabBar: { height: 72, paddingTop: 8, paddingBottom: 10, backgroundColor: '#FFFFFF', borderTopColor: colors.border }, label: { fontSize: 11, fontWeight: '700' }, icon: { fontSize: 23, lineHeight: 24, fontWeight: '700' } });
