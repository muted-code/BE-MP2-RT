import { Server, Socket } from 'socket.io';
import { db } from '../config/firebase';

export const registerChatHandlers = (
  io: Server, 
  socket: Socket, 
  roomUsers: Map<string, Map<string, any>>
) => {
  
  // 1. Escuchar cuando un usuario entra a una sala
  socket.on('join_room', (data: { roomId: string, user: any }) => {
    const roomId = typeof data === 'string' ? data : data.roomId;
    const user = typeof data === 'string' ? null : data.user;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    if (user) {
      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Map());
      }
      roomUsers.get(roomId)!.set(socket.id, user);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
    console.log(`[Socket-RT] Usuario ${user?.name || socket.id} se unió a: ${roomId}`);
  });

  // 2. Escuchar cuando un usuario sale de la sala
  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
    console.log(`[Socket-RT] Cliente abandonó la sala: ${roomId}`);
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
      console.error('[Socket-RT] Error al guardar mensaje en Firestore:', error);
    }
  });

  // 4. Escuchar cuando el creador borra el historial
  socket.on('clear_chat', (roomId: string) => {
    io.to(roomId).emit('chat_cleared');
    console.log(`[Socket-RT] Historial limpiado en sala: ${roomId}`);
  });
};