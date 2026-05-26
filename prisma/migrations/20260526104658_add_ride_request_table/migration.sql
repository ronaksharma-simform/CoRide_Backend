-- CreateEnum
CREATE TYPE "RideRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('TIMEFIRST', 'DISTANCEFIRST', 'BALANCED');

-- CreateTable
CREATE TABLE "RideRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rideId" UUID NOT NULL,
    "seekerId" TEXT NOT NULL,
    "priority" "RequestPriority" NOT NULL DEFAULT 'BALANCED',
    "meetingPoint" GEOGRAPHY(POINT,4326) NOT NULL,
    "distanceToRoute" DOUBLE PRECISION NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "status" "RideRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RideRequest_seekerId_idx" ON "RideRequest"("seekerId");

-- CreateIndex
CREATE INDEX "RideRequest_rideId_idx" ON "RideRequest"("rideId");

-- CreateIndex
CREATE INDEX "Ride_providerId_idx" ON "Ride"("providerId");

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_seekerId_fkey" FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
