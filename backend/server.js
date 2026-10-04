import "dotenv/config";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import translateRouter from "./routes/translate.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const origin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin }));
app.use(express.json({ limit: "2mb" }));
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    limit: 12,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use("/api", translateRouter);

app.use((error, _req, res, _next) => {
  const status = error.message?.includes("OPENAI_API_KEY") ? 503 : 400;
  res.status(status).json({ error: error.message || "Translation failed." });
});

app.listen(port, () => {
  console.log(`MDTranslate AI backend listening on http://localhost:${port}`);
});
