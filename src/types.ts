export type ItineraryStatus = 'planned' | 'done' | 'skipped';
export type ShoppingStatus = 'planned' | 'bought' | 'hold';

export interface ItineraryItem {
  id: string; day: string; time: string; title: string; category: string;
  durationMinutes: number; fixed: boolean; status: ItineraryStatus;
}
export interface SavedPlace { id: string; name: string; category: string; area: string; note: string; latitude?: number; longitude?: number }
export interface PriceObservation { id: string; store: string; priceYen: number; quantity: number; checkedAt: string; note: string }
export interface ShoppingItem { id: string; name: string; store: string; quantity: number; priceYen?: number; status: ShoppingStatus; prices: PriceObservation[] }
export interface TravelInfoItem { id: string; type: 'reservation' | 'checklist'; title: string; detail: string; complete: boolean }
export interface Reservation { id: string; title: string; category: string; scheduledAt: string; confirmationNumber: string; note: string; status: 'planned' | 'confirmed' | 'cancelled'; notificationId?: string }
export interface TrackPoint { latitude: number; longitude: number; accuracy: number | null; altitude: number | null; timestamp: number }
export interface TrackSession { id: string; startedAt: number; endedAt?: number; status: 'recording' | 'paused' | 'finished'; points: TrackPoint[] }
export interface Flight {
  id: string; flightNumber: string; departureAirport: string; arrivalAirport: string;
  departureAt: string; airportBufferMinutes: number; travelMinutes: number; extraBufferMinutes: number;
  notificationId?: string;
}
export interface TripState {
  trip: { id: string; name: string; destination: string; startDate: string; endDate: string };
  itinerary: ItineraryItem[]; places: SavedPlace[]; shopping: ShoppingItem[]; info: TravelInfoItem[]; flights: Flight[]; reservations: Reservation[]; trackSessions: TrackSession[];
}

export interface AppState { activeTripId: string; trips: TripState[] }
