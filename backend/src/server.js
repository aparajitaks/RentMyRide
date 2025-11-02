// backend/src/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Import your route files
import authRoutes from './routes/authRoutes.js';
import carRoutes from './routes/carRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// --- Middlewares ---
// Enable CORS for all routes (allows frontend on port 3000 to talk to backend on 5000)
app.use(cors()); 
// Parse incoming JSON requests
app.use(express.json()); 

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});