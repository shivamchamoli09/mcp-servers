import express from "express";
import cors from "cors";
import { RegistryManager } from "./client/registryManager.js";

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Set up registry manager
const registryManager = new RegistryManager();

// Initialize MCP clients
await registryManager.initializeClients();

// Mount API routes
app.use("/api", registryManager.getRouter());

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`MCP Client API running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("- POST /api/calc/add");
  console.log("- POST /api/ai/chat");
  console.log("- GET  /api/health");
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
