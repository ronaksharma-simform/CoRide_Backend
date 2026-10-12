import { MatchStatus } from "@/generated/prisma/client";

export const MATCH_RADIUS_METERS = 5000;

export type MatchAction = "accept" | "reject" | "cancel";

const ALLOWED: Record<MatchAction, MatchStatus[]> = {
  accept: ["ASSIGNED"],
  reject: ["ASSIGNED"],
  cancel: ["PENDING", "ASSIGNED", "ACCEPTED", "NO_DRIVERS"],
};

export const canApply = (status: MatchStatus, action: MatchAction): boolean =>
  ALLOWED[action].includes(status);
