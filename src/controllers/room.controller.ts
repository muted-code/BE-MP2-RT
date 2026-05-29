import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: 'El nombre de la sala es requerido' });
      return;
    }

    const newRoom = {
      name,
      createdBy: uid,
      createdAt: new Date().toISOString(),
      // Espacio para futuros campos como participants, status, etc.
    };

    const roomRef = await db.collection('rooms').add(newRoom);
    
    // Devolvemos la sala incluyendo su nuevo ID generado
    res.status(201).json({
      id: roomRef.id,
      ...newRoom
    });
  } catch (error: any) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getMyRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomsRef = db.collection('rooms');
    const snapshot = await roomsRef.where('createdBy', '==', uid).get();

    const rooms: any[] = [];
    snapshot.forEach(doc => {
      rooms.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(rooms);
  } catch (error: any) {
    console.error('Error getting rooms:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roomRef = db.collection('rooms').doc(id as string);
    const room = await roomRef.get();

    if (!room.exists) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    if (room.data()?.createdBy !== uid) {
      res.status(403).json({ error: 'No tienes permiso para eliminar esta sala' });
      return;
    }

    await roomRef.delete();
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const updateRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;
    const { id } = req.params;
    const { name } = req.body;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'El nombre de la sala es requerido' });
      return;
    }

    const roomRef = db.collection('rooms').doc(id as string);
    const room = await roomRef.get();

    if (!room.exists) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Verificamos que el usuario que intenta editar sea el creador de la sala
    if (room.data()?.createdBy !== uid) {
      res.status(403).json({ error: 'No tienes permiso para modificar esta sala' });
      return;
    }

    // Actualizamos el nombre en la base de datos
    await roomRef.update({ name: name.trim() });

    // Devolvemos la sala actualizada
    res.status(200).json({
      id,
      ...room.data(),
      name: name.trim()
    });
  } catch (error: any) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getRoomById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roomRef = db.collection('rooms').doc(id as string);
    const room = await roomRef.get();

    if (!room.exists) {
      res.status(404).json({ error: 'La sala no existe o el enlace de invitación es inválido' });
      return;
    }

    // Retornamos la sala encontrada
    res.status(200).json({
      id: room.id,
      ...room.data()
    });
  } catch (error: any) {
    console.error('Error fetching room by ID:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// 👇 NUEVA FUNCIÓN AÑADIDA: Obtener historial de mensajes 👇
export const getRoomMessages = async (req: Request, res: Response): Promise<void> => { 
  try {
    const { id } = req.params;
    // Agregamos "as string" aquí 👇
    const messagesRef = db.collection('rooms').doc(id as string).collection('messages');
    
    // Obtenemos los mensajes ordenados por fecha de creación ascendente
    const snapshot = await messagesRef.orderBy('createdAt', 'asc').get();

    const messages: any[] = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}; 

// 👇 AÑADE ESTA FUNCIÓN AL FINAL 👇
export const clearRoomMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;
    const { id } = req.params;

    const roomRef = db.collection('rooms').doc(id as string);
    const room = await roomRef.get();

    if (!room.exists) {
      res.status(404).json({ error: 'La sala no existe' });
      return;
    }

    // Validación estricta de seguridad
    if (room.data()?.createdBy !== uid) {
      res.status(403).json({ error: 'Solo el creador del grupo puede borrar todo el historial de chat' });
      return;
    }

    // Buscamos y borramos todos los mensajes en lote (Batch)
    const messagesRef = roomRef.collection('messages');
    const snapshot = await messagesRef.get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    res.status(200).json({ message: 'Historial borrado con éxito' });
  } catch (error: any) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}; 