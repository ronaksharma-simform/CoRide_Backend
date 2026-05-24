-- create postgis extension
CREATE EXTENSION postgis;
-- CreateTable

CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "route" geography(LINESTRING,4326) NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);
