import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username) {
      res.status(400).json({ error: 'Username parameter is required' });
      return;
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();

    res.json({ available: snapshot.empty });
  } catch (error: any) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;
    const email = req.email;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!email || !email.endsWith('@correounivalle.edu.co')) {
      res.status(400).json({ error: 'Solo se permiten correos institucionales de la Universidad del Valle (@correounivalle.edu.co)' });
      return;
    }

    const { username, name, lastName, avatar } = req.body;

    if (!username || !name) {
      res.status(400).json({ error: 'Username and name are required' });
      return;
    }

    // Check again if username exists to avoid race conditions
    const usersRef = db.collection('users');
    const usernameSnapshot = await usersRef.where('username', '==', username).get();

    if (!usernameSnapshot.empty) {
      res.status(400).json({ error: 'Username is already taken' });
      return;
    }

    const newUser = {
      uid,
      email: email || '',
      username,
      name,
      lastName,
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    };

    await usersRef.doc(uid).set(newUser);

    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      res.status(404).json({ error: 'Perfil no encontrado' });
      return;
    }

    res.status(200).json(userDoc.data());
  } catch (error: any) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
