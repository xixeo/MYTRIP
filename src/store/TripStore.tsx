import Storage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { ItineraryItem, SavedPlace, ShoppingItem, TripState } from '@/types';

const STORAGE_KEY = 'mytrip.state.v1';
const initialState: TripState = {
  trip: { name: '도쿄 첫 여행', destination: '도쿄 · 일본', startDate: '2026-11-21', endDate: '2026-11-24' },
  itinerary: [
    { id: 'plan-1', day: '11월 21일', time: '14:00', title: '호텔 체크인', category: '숙소', durationMinutes: 30, fixed: true, status: 'planned' },
    { id: 'plan-2', day: '11월 21일', time: '16:00', title: '시부야 스카이', category: '관광', durationMinutes: 90, fixed: false, status: 'planned' },
    { id: 'plan-3', day: '11월 21일', time: '18:30', title: '우동 저녁 식사', category: '식사', durationMinutes: 60, fixed: false, status: 'planned' },
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

type NewPlan = Pick<ItineraryItem, 'title' | 'time' | 'category'>;
type NewPlace = Pick<SavedPlace, 'name' | 'category' | 'area'>;
type NewShopping = Pick<ShoppingItem, 'name' | 'store'>;
interface TripContextValue {
  state: TripState; hydrated: boolean; addPlan: (plan: NewPlan) => void; togglePlan: (id: string) => void;
  addPlace: (place: NewPlace) => void; addShopping: (item: NewShopping) => void; cycleShopping: (id: string) => void;
  toggleInfo: (id: string) => void; addChecklist: (title: string) => void;
}

const TripContext = createContext<TripContextValue | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function TripProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY).then((saved) => { if (saved) setState(JSON.parse(saved) as TripState); })
      .catch(() => undefined).finally(() => setHydrated(true));
  }, []);
  useEffect(() => { if (hydrated) Storage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined); }, [hydrated, state]);

  const value = useMemo<TripContextValue>(() => ({
    state, hydrated,
    addPlan: (plan) => setState((current) => ({ ...current, itinerary: [...current.itinerary, { ...plan, id: makeId('plan'), day: '11월 21일', durationMinutes: 60, fixed: false, status: 'planned' }] })),
    togglePlan: (id) => setState((current) => ({ ...current, itinerary: current.itinerary.map((item) => item.id === id ? { ...item, status: item.status === 'done' ? 'planned' : 'done' } : item) })),
    addPlace: (place) => setState((current) => ({ ...current, places: [...current.places, { ...place, id: makeId('place'), note: '' }] })),
    addShopping: (item) => setState((current) => ({ ...current, shopping: [...current.shopping, { ...item, id: makeId('shop'), quantity: 1, status: 'planned' }] })),
    cycleShopping: (id) => setState((current) => ({ ...current, shopping: current.shopping.map((item) => item.id === id ? { ...item, status: item.status === 'planned' ? 'bought' : item.status === 'bought' ? 'hold' : 'planned' } : item) })),
    toggleInfo: (id) => setState((current) => ({ ...current, info: current.info.map((item) => item.id === id ? { ...item, complete: !item.complete } : item) })),
    addChecklist: (title) => setState((current) => ({ ...current, info: [...current.info, { id: makeId('info'), type: 'checklist', title, detail: '새 준비물', complete: false }] })),
  }), [hydrated, state]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) throw new Error('useTrip must be used inside TripProvider');
  return context;
}
