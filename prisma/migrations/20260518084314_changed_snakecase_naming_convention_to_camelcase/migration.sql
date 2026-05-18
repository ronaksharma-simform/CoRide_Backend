/*
  Warnings:

  - You are about to drop the column `avg_rating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_id_verified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `is_org_verified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `middle_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `org_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `total_rides` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orgName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avg_rating",
DROP COLUMN "created_at",
DROP COLUMN "first_name",
DROP COLUMN "is_id_verified",
DROP COLUMN "is_org_verified",
DROP COLUMN "last_name",
DROP COLUMN "middle_name",
DROP COLUMN "org_name",
DROP COLUMN "total_rides",
ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isIdVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOrgVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "orgName" TEXT NOT NULL,
ADD COLUMN     "totalRides" INTEGER NOT NULL DEFAULT 0;
