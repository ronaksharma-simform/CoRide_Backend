-- CreateTable
CREATE TABLE "RideBooking" (
    "id" TEXT NOT NULL,
    "rideId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "seatNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RideBooking_rideId_seatNumber_key" ON "RideBooking"("rideId", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RideBooking_rideId_userId_key" ON "RideBooking"("rideId", "userId");

-- CreateIndex
CREATE INDEX "RideBooking_userId_idx" ON "RideBooking"("userId");

-- AddForeignKey
ALTER TABLE "RideBooking" ADD CONSTRAINT "RideBooking_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideBooking" ADD CONSTRAINT "RideBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
