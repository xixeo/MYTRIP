import Storage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const CACHE_KEY = 'mytrip.weather.v1';
const MAX_CACHE_AGE = 30 * 60 * 1000;

export interface WeatherSnapshot {
  temperature: number; precipitation: number; windSpeed: number; weatherCode: number;
  timezone: string; observedAt: string; fetchedAt: number; source: 'live' | 'cache';
}

type WeatherState = { data?: WeatherSnapshot; loading: boolean; error?: string };

export function useWeather(latitude?: number, longitude?: number) {
  const [state, setState] = useState<WeatherState>({ loading: true });

  const load = useCallback(async (force = false) => {
    if (latitude === undefined || longitude === undefined) {
      setState({ loading: false, error: '좌표가 있는 장소가 필요합니다.' }); return;
    }
    setState((current) => ({ ...current, loading: true, error: undefined }));
    const cachedRaw = await Storage.getItem(CACHE_KEY).catch(() => null);
    const cached = cachedRaw ? JSON.parse(cachedRaw) as WeatherSnapshot & { latitude: number; longitude: number } : undefined;
    const matches = cached && Math.abs(cached.latitude - latitude) < 0.01 && Math.abs(cached.longitude - longitude) < 0.01;
    if (!force && matches && Date.now() - cached.fetchedAt < MAX_CACHE_AGE) {
      setState({ loading: false, data: { ...cached, source: 'cache' } }); return;
    }
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const params = new URLSearchParams({ latitude: `${latitude}`, longitude: `${longitude}`, current: 'temperature_2m,precipitation,weather_code,wind_speed_10m', timezone: 'auto' });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json() as { timezone: string; current?: { temperature_2m: number; precipitation: number; weather_code: number; wind_speed_10m: number; time: string } };
      if (!body.current) throw new Error('현재 날씨가 제공되지 않았습니다.');
      const data: WeatherSnapshot = { temperature: body.current.temperature_2m, precipitation: body.current.precipitation, weatherCode: body.current.weather_code, windSpeed: body.current.wind_speed_10m, observedAt: body.current.time, timezone: body.timezone, fetchedAt: Date.now(), source: 'live' };
      await Storage.setItem(CACHE_KEY, JSON.stringify({ ...data, latitude, longitude })).catch(() => undefined);
      setState({ loading: false, data });
    } catch {
      if (matches && cached) setState({ loading: false, data: { ...cached, source: 'cache' }, error: '갱신에 실패해 마지막 날씨를 표시합니다.' });
      else setState({ loading: false, error: '날씨를 불러오지 못했습니다.' });
    } finally { clearTimeout(timeout); }
  }, [latitude, longitude]);

  useEffect(() => {
    const task = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(task);
  }, [load]);
  return { ...state, refresh: () => load(true) };
}

export function weatherLabel(code: number) {
  if (code === 0) return '맑음'; if (code <= 3) return '구름'; if (code <= 48) return '안개';
  if (code <= 67) return '비'; if (code <= 77) return '눈'; if (code <= 82) return '소나기'; return '뇌우';
}
