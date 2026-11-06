import { AndroidImportance, cancelScheduledNotificationAsync, requestPermissionsAsync, scheduleNotificationAsync, SchedulableTriggerInputTypes, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'trip-reminders';

export async function scheduleReminder(title: string, body: string, scheduledAt: string, minutesBefore: number, previousId?: string) {
  const event = new Date(scheduledAt);
  const triggerDate = new Date(event.getTime() - minutesBefore * 60_000);
  if (Number.isNaN(event.getTime())) throw new Error('날짜 형식을 확인하세요.');
  if (triggerDate.getTime() <= Date.now()) throw new Error('알림 시각이 이미 지났습니다.');
  const permission = await requestPermissionsAsync();
  if (!permission.granted) throw new Error('알림 권한이 필요합니다.');
  if (previousId) await cancelScheduledNotificationAsync(previousId).catch(() => undefined);
  if (Platform.OS === 'android') await setNotificationChannelAsync(CHANNEL_ID, { name: '여행 알림', importance: AndroidImportance.HIGH });
  return scheduleNotificationAsync({ content: { title, body, sound: true }, trigger: { type: SchedulableTriggerInputTypes.DATE, date: triggerDate, channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined } });
}

export async function cancelReminder(identifier?: string) { if (identifier) await cancelScheduledNotificationAsync(identifier).catch(() => undefined); }
