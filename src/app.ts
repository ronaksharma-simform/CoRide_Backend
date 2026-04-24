import express from "express";
import errorMiddleware from "./middlewares/error.middleware";
import authMiddleware from "./middlewares/auth.middleware";
import { asyncHandler } from "./utils/asyncHandler";

const app = express();
// import cors from "cors";
// let temp;
// enables cors
// app.use(cors());
// testing route
app.get("/temp", (_, res) => {
  res.json("Working");
});
app.get(
  "/me",
  authMiddleware, // 🔐 applied here
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  }),
);
app.use(errorMiddleware);
export default app;
