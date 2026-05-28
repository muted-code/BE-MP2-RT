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
