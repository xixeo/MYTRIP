import { supabase } from '@/lib/supabase';
import { TripState } from '@/types';

type CloudRow = { id: string; owner_id: string; title: string; destination: string; start_date: string; end_date: string; payload: unknown; version: number; updated_at: string };

function cloudPayload(trip: TripState) {
  return { ...trip, trip: { ...trip.trip, cloudId: undefined, cloudVersion: undefined }, trackSessions: [] };
}

export async function uploadTrip(trip: TripState, userId: string) {
  if (!supabase) throw new Error('Supabase 환경 설정이 필요합니다.');
  if (!trip.trip.cloudId) {
    const { data, error } = await supabase.from('trips').insert({ owner_id: userId, title: trip.trip.name, destination: trip.trip.destination, start_date: trip.trip.startDate, end_date: trip.trip.endDate, payload: cloudPayload(trip) }).select('id, version').single();
    if (error) throw error;
    return { cloudId: data.id as string, cloudVersion: data.version as number };
  }
  const nextVersion = (trip.trip.cloudVersion ?? 1) + 1;
  const { data, error } = await supabase.from('trips').update({ title: trip.trip.name, destination: trip.trip.destination, start_date: trip.trip.startDate, end_date: trip.trip.endDate, payload: cloudPayload(trip), version: nextVersion, updated_at: new Date().toISOString() }).eq('id', trip.trip.cloudId).eq('version', trip.trip.cloudVersion ?? 1).select('id, version').maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('다른 기기에서 여행이 변경되었습니다. 먼저 내려받아 확인하세요.');
  return { cloudId: data.id as string, cloudVersion: data.version as number };
}

export async function downloadTrips() {
  if (!supabase) throw new Error('Supabase 환경 설정이 필요합니다.');
  const { data, error } = await supabase.from('trips').select('id, owner_id, title, destination, start_date, end_date, payload, version, updated_at').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as CloudRow[]).map((row) => {
    const payload = row.payload as TripState;
    return { ...payload, trip: { ...payload.trip, name: row.title, destination: row.destination, startDate: row.start_date, endDate: row.end_date, cloudId: row.id, cloudVersion: row.version }, trackSessions: [] };
  });
}

export async function createInvite(tripId: string, userId: string, role: 'editor' | 'viewer') {
  if (!supabase) throw new Error('Supabase 환경 설정이 필요합니다.');
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const { data, error } = await supabase.from('trip_invites').insert({ trip_id: tripId, created_by: userId, role, expires_at: expiresAt }).select('id').single();
  if (error) throw error;
  return `mytrip://invite?id=${data.id}`;
}

export async function joinTrip(inviteId: string) {
  if (!supabase) throw new Error('Supabase 환경 설정이 필요합니다.');
  const { data, error } = await supabase.rpc('join_trip_by_invite', { invite_id: inviteId });
  if (error) throw error;
  return data as string;
}
