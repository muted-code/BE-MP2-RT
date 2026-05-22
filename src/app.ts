import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import healthRouter from './routes/health.routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

import authRouter from './routes/auth.routes';

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Room API is running' });
});

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error Handler (must be at the end)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend principal corriendo en puerto ${PORT}`);
});

export default app;
