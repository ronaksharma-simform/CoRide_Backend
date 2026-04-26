import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authMiddleware from "./middlewares/auth.middleware";
import { asyncHandler } from "./utils/asyncHandler";
import authRoutes from "./routes/auth.routes";

const app = express();
// import cors from "cors";
// let temp;
// enables cors
// app.use(cors());
// testing route
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/auth", authRoutes);
app.get("/temp", (_, res) => {
  res.json("Working");
});
app.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);
app.use(errorMiddleware);
export default app;
