/*
  Warnings:

  - Added the required column `sourcePoint` to the `RideRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RideRequest" ADD COLUMN     "sourcePoint" GEOGRAPHY(POINT,4326) NOT NULL;
