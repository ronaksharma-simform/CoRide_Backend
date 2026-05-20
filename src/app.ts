import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import authMiddleware from "./middlewares/auth.middleware";
const app = express();
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// public routes
app.use("/auth", authRoutes);
app.get("/health", (_, res) => {
  res.json("Working");
});

// protected routes
app.use("/api", authMiddleware);

// error handler (always last)
app.use(errorMiddleware);
export default app;
