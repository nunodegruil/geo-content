import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db/pool";
import conteudosRoutes from "./routes/conteudos";
import authRoutes from "./routes/auth";
import metadataRoutes from "./routes/metadata";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/conteudos", conteudosRoutes);
app.use("/auth", authRoutes);
app.use("/metadata", metadataRoutes);

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});