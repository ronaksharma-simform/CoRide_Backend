-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'REFUNDED');

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rideId" UUID NOT NULL,
    "riderId" TEXT NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "surgeMultiplier" DOUBLE PRECISION NOT NULL,
    "baseFare" INTEGER NOT NULL,
    "distanceFare" INTEGER NOT NULL,
    "timeFare" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "refundReason" TEXT,
    "gatewayRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_riderId_idx" ON "Payment"("riderId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rideId_riderId_key" ON "Payment"("rideId", "riderId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
