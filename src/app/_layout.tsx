import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TripProvider } from '@/store/TripStore';

export default function RootLayout() {
  return <SafeAreaProvider><TripProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false }} /></TripProvider></SafeAreaProvider>;
}
