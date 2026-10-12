import AppError from "@/utils/customErrorClass";

// Money is in minor currency units (integers). Rates are per trip, not per user.
export const FARE_RATES = {
  baseFare: 50,
  perKm: 12,
  perMinute: 2,
  minimumFare: 80,
} as const;

export type FareInput = {
  distanceMeters: number;
  durationMinutes: number;
  surgeMultiplier: number;
};

export type FareBreakdown = {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  amount: number;
};

export const calculateFare = ({
  distanceMeters,
  durationMinutes,
  surgeMultiplier,
}: FareInput): FareBreakdown => {
  const valid =
    Number.isFinite(distanceMeters) &&
    Number.isFinite(durationMinutes) &&
    Number.isFinite(surgeMultiplier) &&
    distanceMeters >= 0 &&
    durationMinutes >= 0 &&
    surgeMultiplier >= 1;
  if (!valid) throw new AppError("RIDE_INVALID_FARE");

  const baseFare = FARE_RATES.baseFare;
  const distanceFare = Math.round((distanceMeters / 1000) * FARE_RATES.perKm);
  const timeFare = Math.round(durationMinutes * FARE_RATES.perMinute);
  const metered = (baseFare + distanceFare + timeFare) * surgeMultiplier;
  const amount = Math.max(FARE_RATES.minimumFare, Math.round(metered));
  return { baseFare, distanceFare, timeFare, amount };
};

// Demand-based surge from how full the ride was: 1x under half, 1.25x under 80%, else 1.5x.
export const surgeFor = (
  totalSeats: number,
  availableSeats: number,
): number => {
  if (totalSeats <= 0) return 1;
  const occupancy = (totalSeats - availableSeats) / totalSeats;
  if (occupancy >= 0.8) return 1.5;
  if (occupancy >= 0.5) return 1.25;
  return 1;
};
