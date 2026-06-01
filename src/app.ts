import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import rideRequestRoutes from "./routes/rideRequest.routes";
import rideRoutes from "./routes/ride.routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import authMiddleware from "./middlewares/auth.middleware";
import { RideRequestService } from "./services/rideRequest.services";
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
app.get("/health", authMiddleware, async (req, res) => {
  await RideRequestService.registerRideRequest(req.body, req.user.id);
  res.json("Working");
});

// protected routes
app.use("/api", authMiddleware);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api/rideRequest", rideRequestRoutes);
// error handler (always last)
app.use(errorMiddleware);
export default app;
