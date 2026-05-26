-- Extension
CREATE EXTENSION POSTGIS;
-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('ACTIVE', 'FULL', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Ride" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "sourceLabel" GEOGRAPHY(POINT,4326) NOT NULL,
    "destinationLabel" GEOGRAPHY(POINT,4326) NOT NULL,
    "route" GEOGRAPHY(LINESTRING , 4326) NOT NULL,
    "departureTime" TIMESTAMP(3) NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
