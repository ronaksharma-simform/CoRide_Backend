import express from "express";

const app = express();
import cors from "cors";
// enables cors
// app.use(cors());
// testing route
app.get("./", (req, res) => {
  res.send("Working");
});

export default app;
