import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import healthRouter from './routes/health.routes';
import { errorHandler } from './middlewares/errorHandler';
import { db } from './config/firebase';

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// 👇 NUEVO: Registro en memoria de los usuarios por sala 👇
const roomUsers = new Map<string, Map<string, any>>();

// LÓGICA DE SOCKETS
io.on('connection', (socket) => {
  console.log(`[Socket] Cliente conectado: ${socket.id}`);

  // 1. Escuchar cuando un usuario entra a una sala
  socket.on('join_room', (data: { roomId: string, user: any }) => {
    // Soporte hacia atrás por si data es solo un string, o si es el nuevo objeto
    const roomId = typeof data === 'string' ? data : data.roomId;
    const user = typeof data === 'string' ? null : data.user;

    socket.join(roomId);
    
    // Guardamos datos en el socket para saber de dónde desconectarlo luego
    socket.data.roomId = roomId;
    socket.data.user = user;

    if (user) {
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId)!.set(socket.id, user);
      
      // Emitimos la lista actualizada a todos en la sala
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
    
    console.log(`[Socket] Cliente ${socket.id} se unió a la sala: ${roomId}`);
  });

  // 2. Escuchar cuando un usuario sale explícitamente de una sala
  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
  });

  // 3. Escuchar cuando un usuario envía un mensaje
  socket.on('send_message', async (data: { roomId: string; text: string; user: any; timestamp: string }) => {
    io.to(data.roomId).emit('receive_message', data);
    try {
      await db.collection('rooms').doc(data.roomId).collection('messages').add({
        text: data.text,
        user: data.user,
        timestamp: data.timestamp,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Socket] Error al guardar mensaje en DB:', error);
    }
  });

  // 4. Escuchar cuando el creador borra el historial
  socket.on('clear_chat', (roomId: string) => {
    io.to(roomId).emit('chat_cleared');
  });

  // 5. Manejar desconexión (Cerrar pestaña, apagar PC, etc)
  socket.on('disconnect', () => {
    console.log(`[Socket] Cliente desconectado: ${socket.id}`);
    const roomId = socket.data.roomId;
    if (roomId && roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
  });
});

import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import roomRouter from './routes/room.routes';

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Study Room API is running' });
});

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/rooms', roomRouter);

// Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error Handler (must be at the end)
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Backend principal corriendo en puerto ${PORT}`);
});

export { app, server, io }; 