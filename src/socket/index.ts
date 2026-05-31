import { Server, Socket } from 'socket.io';

export const registerSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket-RT] Cliente conectado: ${socket.id}`);

    socket.on('ping', () => {
      socket.emit('pong', { message: "pong" });
    });

    // 👇 NUEVO: Sincronización exacta de salas con Payload (Datos en tiempo real) 👇
    socket.on('room_created', (room) => {
      socket.broadcast.emit('room_created', room);
    });

    socket.on('room_updated', (data) => {
      socket.broadcast.emit('room_updated', data);
    });

    socket.on('room_deleted', (roomId) => {
      socket.broadcast.emit('room_deleted', roomId);
    });

    // EVENTOS DE GRUPOS Y ROLES (Para llevar registro en la consola)
    socket.on('group_joined', (data) => {
      console.log(`[Socket-RT] 🚪 Usuario ${data.userName} se unió al grupo: ${data.groupId}`);
    });

    socket.on('role_updated', (data) => {
      console.log(`[Socket-RT] 🛡️ Permiso modificado: ${data.targetUser} ahora es ${data.newRole} en el grupo ${data.groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket-RT] Cliente desconectado: ${socket.id}`);
    });
  });
}; 