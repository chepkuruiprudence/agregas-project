import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { startSettlementScheduler } from "./jobs/settlement-scheduler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Register routes
registerRoutes(app);


// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "✅ Server is running", timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ AGREGAS Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});


// Start settlement scheduler
startSettlementScheduler();

app.listen(PORT, () => {
  console.log('✓ AGREGAS ACSE Backend Running');
  console.log('✓ Settlement scheduler active');
});
