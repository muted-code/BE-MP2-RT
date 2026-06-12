import { Server, Socket } from 'socket.io';
import { db } from '../config/firebase';

export const registerChatHandlers = (
  io: Server, 
  socket: Socket, 
  roomUsers: Map<string, Map<string, any>>
) => {
  
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
    console.log(`[Socket-RT] 🚪 Usuario ${user?.name || socket.id} se unió a: ${roomId}`);
  });

  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId);
    if (roomUsers.has(roomId)) {
      roomUsers.get(roomId)!.delete(socket.id);
      io.to(roomId).emit('room_users_update', Array.from(roomUsers.get(roomId)!.values()));
    }
    console.log(`[Socket-RT] 🚶 Cliente abandonó la sala: ${roomId}`);
  });

  // 👇 LOG DE MENSAJES DE CHAT MEJORADO 👇
  socket.on('send_message', async (data: { roomId: string; text: string; user: any; timestamp: string }) => {
    io.to(data.roomId).emit('receive_message', data);
    
    // Imprimimos el mensaje exacto en la terminal del backend
    console.log(`[Socket-RT] 💬 Chat en [${data.roomId}] | ${data.user?.name}: "${data.text}"`);
    
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

  socket.on('clear_chat', (roomId: string) => {
    io.to(roomId).emit('chat_cleared');
    console.log(`[Socket-RT] 🧹 Historial limpiado en sala: ${roomId}`);
  });

  // 👇 EVENTOS WEBRTC ACTUALIZADOS (Ahora reciben y retransmiten la data completa) 👇
  
  socket.on('join_video_call', (data: { roomId: string; peerId: string; user: any }) => {
    // Retransmitimos TODA la data (incluyendo el user) para que el frontend sepa quién es
    socket.to(data.roomId).emit('user_joined_video', data);
    console.log(`[Socket-RT] 📡 ${data.user?.name || data.peerId} inició transmisión P2P en sala: ${data.roomId}`);
  });

  socket.on('leave_video_call', (data: { roomId: string; peerId: string }) => {
    socket.to(data.roomId).emit('user_left_video', data.peerId);
    console.log(`[Socket-RT] 🔌 PeerID ${data.peerId} detuvo transmisión en sala: ${data.roomId}`);
  });

  // 👇 EVENTOS DE AUDITORÍA Y SINCRONIZACIÓN (Cámara y Micrófono) 👇
  
  socket.on('toggle_audio', (data: { roomId: string; userName: string; peerId: string; isMuted: boolean }) => {
    // Avisamos a los demás para que pongan el icono de mute rojo en sus pantallas
    socket.to(data.roomId).emit('peer_toggled_audio', data);
    
    const estado = data.isMuted ? 'SILENCIÓ' : 'ACTIVÓ';
    console.log(`[Socket-RT] 🎤 El usuario ${data.userName} ${estado} su micrófono en la sala ${data.roomId}`);
  });

  socket.on('toggle_video', (data: { roomId: string; userName: string; peerId: string; isVideoOff: boolean }) => {
    // Avisamos a los demás para que oculten el video y muestren tu avatar
    socket.to(data.roomId).emit('peer_toggled_video', data);
    
    const estado = data.isVideoOff ? 'APAGÓ' : 'ENCENDIÓ';
    console.log(`[Socket-RT] 📸 El usuario ${data.userName} ${estado} su cámara en la sala ${data.roomId}`);
  });

  socket.on('toggle_screen_share', (data: { roomId: string; peerId: string; isSharing: boolean }) => {
    socket.to(data.roomId).emit('peer_toggled_screen_share', data);
  });
};