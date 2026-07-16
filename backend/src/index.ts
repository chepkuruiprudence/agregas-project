import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { startSettlementScheduler } from "./jobs/settlement-scheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration supporting local dev & production frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like Postman, mobile apps, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive mode during initial setup
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Main Root Route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "🚀 AGREGAS API Service is active!",
    version: "1.0.0",
    healthCheck: "/health",
  });
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "✅ Server is running", timestamp: new Date() });
});

// Register API routes
registerRoutes(app);

// Start settlement scheduler
startSettlementScheduler();

// Single server initialization call
app.listen(PORT, () => {
  console.log(`✓ AGREGAS ACSE Backend Running on port ${PORT}`);
  console.log(`✓ Health check active at /health`);
  console.log("✓ Settlement scheduler active");
});