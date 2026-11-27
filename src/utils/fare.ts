const BASE_FARE = 50;
const PER_KM = 12;
const MIN_FARE = 80;

/** Fare for a ride: base fare plus a charge per started kilometre, never below the minimum. */
export function calcFare(distanceKm: number): number {
  const billableKm = Math.ceil(distanceKm) - 1;
  return Math.max(MIN_FARE, BASE_FARE + billableKm * PER_KM);
}
