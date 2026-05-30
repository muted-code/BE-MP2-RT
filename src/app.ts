import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
// Importamos el manejador modular que acabamos de crear
import { registerChatHandlers } from './handlers/chatHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const allowedOrigins = ['http://localhost:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ origin: allowedOrigins, credentials: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});

// Registro global de usuarios en memoria por sala
const roomUsers = new Map<string, Map<string, any>>();

// Conexión principal de Sockets
io.on('connection', (socket) => {
  const authData = socket.handshake.auth;
  console.log('[Socket-RT] Auth recibido:', JSON.stringify(authData));
  
  // Buscar nombre en cualquier formato que envíe el frontend
  const name = authData?.user?.name || authData?.name || authData?.username || 'Anónimo';
  const username = authData?.user?.username || authData?.username || '';
  const userInfo = username ? `${name} (@${username})` : name;

  console.log(`[Socket-RT] Cliente conectado: ${socket.id} (Usuario: ${userInfo})`);

  // Registramos todos los eventos del chat delegándolos al handler externo
  registerChatHandlers(io, socket, roomUsers);

  // Manejo de desconexión imprevista
  socket.on('disconnect', () => {
    console.log(`[Socket-RT] Cliente desconectado: ${socket.id} (Usuario: ${userInfo})`);
    const roomId = socket.data.roomId;
    if (roomId && roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Study Room Real-Time API is running cleanly' });
});

server.listen(PORT, () => {
  console.log(`🚀 Backend Real-Time (Sockets) corriendo modularmente en puerto ${PORT}`);
}); 