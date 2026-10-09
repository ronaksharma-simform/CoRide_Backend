
-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'ASSIGNED', 'ACCEPTED', 'NO_DRIVERS', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('REQUESTED', 'ASSIGNED', 'REJECTED', 'ACCEPTED', 'NO_DRIVERS', 'CANCELLED');

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "destinationLat" DOUBLE PRECISION NOT NULL,
    "destinationLng" DOUBLE PRECISION NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "rideId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "rideId" UUID,
    "type" "MatchEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideRequest_riderId_idx" ON "RideRequest"("riderId");

-- CreateIndex
CREATE INDEX "RideRequest_rideId_idx" ON "RideRequest"("rideId");

-- CreateIndex
CREATE INDEX "MatchEvent_requestId_idx" ON "MatchEvent"("requestId");

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RideRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
