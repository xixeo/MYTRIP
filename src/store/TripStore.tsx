import Storage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { AppState, ItineraryItem, SavedPlace, ShoppingItem, TripState } from '@/types';

const STORAGE_KEY = 'mytrip.state.v2';
const LEGACY_STORAGE_KEY = 'mytrip.state.v1';
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const starterTrip: TripState = {
  trip: { id: 'trip-tokyo', name: '도쿄 첫 여행', destination: '도쿄 · 일본', startDate: '2026-11-21', endDate: '2026-11-24' },
  itinerary: [
    { id: 'plan-1', day: '2026-11-21', time: '14:00', title: '호텔 체크인', category: '숙소', durationMinutes: 30, fixed: true, status: 'planned' },
    { id: 'plan-2', day: '2026-11-21', time: '16:00', title: '시부야 스카이', category: '관광', durationMinutes: 90, fixed: false, status: 'planned' },
    { id: 'plan-3', day: '2026-11-21', time: '18:30', title: '우동 저녁 식사', category: '식사', durationMinutes: 60, fixed: false, status: 'planned' },
  ],
  places: [
    { id: 'place-1', name: '시부야 스카이', category: '관광', area: '시부야', note: '일몰 30분 전 입장 후보' },
    { id: 'place-2', name: '도쿄역', category: '교통', area: '마루노우치', note: '공항버스 승하차 위치 확인' },
  ],
  shopping: [
    { id: 'shop-1', name: '일본 한정 과자', store: '돈키호테 시부야점', quantity: 2, priceYen: 698, status: 'planned' },
    { id: 'shop-2', name: '여행용 충전기', store: '빅카메라', quantity: 1, status: 'hold' },
  ],
  info: [
    { id: 'info-1', type: 'reservation', title: '호텔 예약', detail: '체크인 14:00 · 예약번호 입력 필요', complete: false },
    { id: 'info-2', type: 'checklist', title: '여권', detail: '유효기간 확인', complete: true },
    { id: 'info-3', type: 'checklist', title: 'eSIM 설치', detail: '출국 전 활성화 확인', complete: false },
  ],
};
const initialAppState: AppState = { activeTripId: starterTrip.trip.id, trips: [starterTrip] };

type TripInput = Pick<TripState['trip'], 'name' | 'destination' | 'startDate' | 'endDate'>;
type NewPlan = Pick<ItineraryItem, 'title' | 'time' | 'category' | 'day'>;
type PlanUpdate = Partial<Pick<ItineraryItem, 'title' | 'time' | 'category' | 'day' | 'durationMinutes' | 'fixed'>>;
type NewPlace = Pick<SavedPlace, 'name' | 'category' | 'area'>;
type NewShopping = Pick<ShoppingItem, 'name' | 'store'>;
interface TripContextValue {
  state: TripState; trips: TripState[]; hydrated: boolean;
  createTrip: (input: TripInput) => string; updateTrip: (id: string, input: TripInput) => void; deleteTrip: (id: string) => void; selectTrip: (id: string) => void;
  addPlan: (plan: NewPlan) => void; updatePlan: (id: string, update: PlanUpdate) => void; deletePlan: (id: string) => void; togglePlan: (id: string) => void; movePlan: (id: string, direction: -1 | 1) => void;
  addPlace: (place: NewPlace) => void; addShopping: (item: NewShopping) => void; cycleShopping: (id: string) => void; toggleInfo: (id: string) => void; addChecklist: (title: string) => void;
}
const TripContext = createContext<TripContextValue | null>(null);

function migrateLegacy(legacy: TripState): AppState {
  const id = legacy.trip.id ?? 'trip-migrated';
  return { activeTripId: id, trips: [{ ...legacy, trip: { ...legacy.trip, id }, itinerary: legacy.itinerary.map((item) => ({ ...item, day: item.day.includes('-') ? item.day : legacy.trip.startDate })) }] };
}

export function TripProvider({ children }: PropsWithChildren) {
  const [appState, setAppState] = useState<AppState>(initialAppState);
  const [hydrated, setHydrated] = useState(false);
  const active = appState.trips.find((item) => item.trip.id === appState.activeTripId) ?? appState.trips[0];

  useEffect(() => {
    Promise.all([Storage.getItem(STORAGE_KEY), Storage.getItem(LEGACY_STORAGE_KEY)]).then(([saved, legacy]) => {
      if (saved) setAppState(JSON.parse(saved) as AppState);
      else if (legacy) setAppState(migrateLegacy(JSON.parse(legacy) as TripState));
    }).catch(() => undefined).finally(() => setHydrated(true));
  }, []);
  useEffect(() => { if (hydrated) Storage.setItem(STORAGE_KEY, JSON.stringify(appState)).catch(() => undefined); }, [appState, hydrated]);

  const updateActive = (updater: (trip: TripState) => TripState) => setAppState((current) => ({ ...current, trips: current.trips.map((trip) => trip.trip.id === current.activeTripId ? updater(trip) : trip) }));
  const value = useMemo<TripContextValue>(() => ({
    state: active, trips: appState.trips, hydrated,
    createTrip: (input) => { const id = makeId('trip'); const next: TripState = { trip: { id, ...input }, itinerary: [], places: [], shopping: [], info: [] }; setAppState((current) => ({ activeTripId: id, trips: [...current.trips, next] })); return id; },
    updateTrip: (id, input) => setAppState((current) => ({ ...current, trips: current.trips.map((trip) => trip.trip.id === id ? { ...trip, trip: { ...trip.trip, ...input } } : trip) })),
    deleteTrip: (id) => setAppState((current) => { if (current.trips.length === 1) return current; const trips = current.trips.filter((trip) => trip.trip.id !== id); return { trips, activeTripId: current.activeTripId === id ? trips[0].trip.id : current.activeTripId }; }),
    selectTrip: (id) => setAppState((current) => ({ ...current, activeTripId: id })),
    addPlan: (plan) => updateActive((trip) => ({ ...trip, itinerary: [...trip.itinerary, { ...plan, id: makeId('plan'), durationMinutes: 60, fixed: false, status: 'planned' }] })),
    updatePlan: (id, update) => updateActive((trip) => ({ ...trip, itinerary: trip.itinerary.map((item) => item.id === id ? { ...item, ...update } : item) })),
    deletePlan: (id) => updateActive((trip) => ({ ...trip, itinerary: trip.itinerary.filter((item) => item.id !== id) })),
    togglePlan: (id) => updateActive((trip) => ({ ...trip, itinerary: trip.itinerary.map((item) => item.id === id ? { ...item, status: item.status === 'done' ? 'planned' : 'done' } : item) })),
    movePlan: (id, direction) => updateActive((trip) => {
      const currentIndex = trip.itinerary.findIndex((item) => item.id === id); if (currentIndex < 0) return trip;
      const item = trip.itinerary[currentIndex]; const sameDay = trip.itinerary.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => candidate.day === item.day);
      const target = sameDay[sameDay.findIndex(({ candidate }) => candidate.id === id) + direction]; if (!target) return trip;
      const itinerary = [...trip.itinerary]; [itinerary[currentIndex], itinerary[target.index]] = [itinerary[target.index], itinerary[currentIndex]]; return { ...trip, itinerary };
    }),
    addPlace: (place) => updateActive((trip) => ({ ...trip, places: [...trip.places, { ...place, id: makeId('place'), note: '' }] })),
    addShopping: (item) => updateActive((trip) => ({ ...trip, shopping: [...trip.shopping, { ...item, id: makeId('shop'), quantity: 1, status: 'planned' }] })),
    cycleShopping: (id) => updateActive((trip) => ({ ...trip, shopping: trip.shopping.map((item) => item.id === id ? { ...item, status: item.status === 'planned' ? 'bought' : item.status === 'bought' ? 'hold' : 'planned' } : item) })),
    toggleInfo: (id) => updateActive((trip) => ({ ...trip, info: trip.info.map((item) => item.id === id ? { ...item, complete: !item.complete } : item) })),
    addChecklist: (title) => updateActive((trip) => ({ ...trip, info: [...trip.info, { id: makeId('info'), type: 'checklist', title, detail: '새 준비물', complete: false }] })),
  }), [active, appState.trips, hydrated]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() { const context = useContext(TripContext); if (!context) throw new Error('useTrip must be used inside TripProvider'); return context; }
