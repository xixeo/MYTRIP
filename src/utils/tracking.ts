import { TrackPoint } from '@/types';

export function trackDistance(points: TrackPoint[]) {
  let metres = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]; const current = points[index];
    const lat1 = previous.latitude * Math.PI / 180; const lat2 = current.latitude * Math.PI / 180;
    const deltaLat = (current.latitude - previous.latitude) * Math.PI / 180; const deltaLon = (current.longitude - previous.longitude) * Math.PI / 180;
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    metres += 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return metres;
}

export function formatDistance(metres: number) { return metres >= 1000 ? `${(metres / 1000).toFixed(2)}km` : `${Math.round(metres)}m`; }
