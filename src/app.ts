import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import http from 'http';
import healthRouter from './routes/health.routes';
import { errorHandler } from './middlewares/errorHandler';
import { initSocket } from './config/socket';
import { registerSocketHandlers } from './socket';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

// Routes
app.use('/api', healthRouter);

// Error Handler
app.use(errorHandler);

// Socket.io
const io = initSocket(httpServer);
registerSocketHandlers(io);

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`Backend realtime corriendo en puerto ${PORT}`);
});
