import express from "express";

const app = express();
// import cors from "cors";
// let temp;
// enables cors
// app.use(cors());
// testing route
app.get("/temp", (req, res) => {
  res.json("Working");
});

export default app;
