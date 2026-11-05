import { Flight } from '@/types';

export function recommendedDeparture(flight: Flight) {
  const departure = new Date(flight.departureAt);
  if (Number.isNaN(departure.getTime())) return undefined;
  return new Date(departure.getTime() - (flight.airportBufferMinutes + flight.travelMinutes + flight.extraBufferMinutes) * 60_000);
}

export function formatDateTime(date: Date | undefined) {
  if (!date) return '시간 형식을 확인하세요';
  const month = `${date.getMonth() + 1}`.padStart(2, '0'); const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0'); const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}월 ${day}일 ${hour}:${minute}`;
}
