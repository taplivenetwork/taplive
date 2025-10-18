import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });
  
  next();
});

// Register routes and create server
const server = registerRoutes(app);

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message
  });
});

// Start server
const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`API available at http://localhost:${port}/api`);
});