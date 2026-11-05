export type ItineraryStatus = 'planned' | 'done' | 'skipped';
export type ShoppingStatus = 'planned' | 'bought' | 'hold';

export interface ItineraryItem {
  id: string; day: string; time: string; title: string; category: string;
  durationMinutes: number; fixed: boolean; status: ItineraryStatus;
}
export interface SavedPlace { id: string; name: string; category: string; area: string; note: string; latitude?: number; longitude?: number }
export interface ShoppingItem { id: string; name: string; store: string; quantity: number; priceYen?: number; status: ShoppingStatus }
export interface TravelInfoItem { id: string; type: 'reservation' | 'checklist'; title: string; detail: string; complete: boolean }
export interface Flight {
  id: string; flightNumber: string; departureAirport: string; arrivalAirport: string;
  departureAt: string; airportBufferMinutes: number; travelMinutes: number; extraBufferMinutes: number;
}
export interface TripState {
  trip: { id: string; name: string; destination: string; startDate: string; endDate: string };
  itinerary: ItineraryItem[]; places: SavedPlace[]; shopping: ShoppingItem[]; info: TravelInfoItem[]; flights: Flight[];
}

export interface AppState { activeTripId: string; trips: TripState[] }
