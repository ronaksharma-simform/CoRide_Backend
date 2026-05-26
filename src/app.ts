import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import vehicleRoutes from "./routes/vehicle.routes";
import rideRoutes from "./routes/ride.routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import authMiddleware from "./middlewares/auth.middleware";
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
app.get("/health", authMiddleware, (_, res) => {
  res.json("Working");
});

// protected routes
app.use("/api", authMiddleware);
app.use("/api/vehicle", vehicleRoutes);
app.use("/api/ride", rideRoutes);
// error handler (always last)
app.use(errorMiddleware);
export default app;
