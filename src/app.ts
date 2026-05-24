import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import authMiddleware from "./middlewares/auth.middleware";
import { prisma } from "./config/prisma";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",

    credentials: true,
  }),
);
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// public routes
app.use("/auth", authRoutes);
app.get("/health", async (_, res) => {
  // Query to see your newly inserted routes and their length in kilometers
  const summary = await prisma.$queryRaw`
  SELECT 
    id,  
    ST_AsText(route) as coordinates, -- Converts the binary data back to readable text
    ST_Length(route) / 1000 as distance_km -- PostGIS returns meters, divide by 1000 for KM
  FROM "Ride"
`;

  res.json(summary);
});

// protected routes
app.use("/api", authMiddleware);
app.use("/api/vehicle", vehicleRoutes);
// error handler (always last)
app.use(errorMiddleware);
export default app;
