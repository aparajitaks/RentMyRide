import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit"; // reordered before helmet per lint rule
import helmet from "helmet";
import pinoHttp from "pino-http";

import { testAuthShim } from "./middleware/testAuthShim.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import carRoutes from "./routes/carRoutes.js";

dotenv.config();

const app = express();
// Health check route
app.get("/api/health", (req, res) => {
	res.json({ ok: true });
});

// Middlewares
app.use(cors());
app.use(helmet());
// Structured request logging
app.use(
	pinoHttp({
		autoLogging: true,
		serializers: {
			req(req) {
				return { method: req.method, url: req.url, id: req.id };
			},
			res(res) {
				return { statusCode: res.statusCode };
			},
		},
	}),
);
// Basic rate limiting (generous to avoid impacting tests)
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 1000,
		standardHeaders: true,
		legacyHeaders: false,
	}),
);
app.use(express.json());
app.use(testAuthShim);

// Routes
app.use("/api/cars", carRoutes);
app.use("/api/bookings", bookingRoutes);

// Serve static frontend if present (Docker multi-stage copies into ../public)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// SPA fallback: send index.html for non-API routes
app.get("*", (req, res, next) => {
	if (req.path.startsWith("/api")) return next();
	res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
