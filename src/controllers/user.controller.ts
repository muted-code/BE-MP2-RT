import { Request, Response } from 'express';
import { db, auth } from '../config/firebase';

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

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { username, email, name, lastName, avatar } = req.body;
    const usersRef = db.collection('users');

    // Check username collision if username is being updated
    if (username) {
      const usernameSnapshot = await usersRef.where('username', '==', username).get();
      if (!usernameSnapshot.empty) {
        // Ensure it's not the current user's document
        const ownerDoc = usernameSnapshot.docs[0];
        if (ownerDoc.id !== uid) {
          res.status(400).json({ error: 'El nombre de usuario ya está en uso por otro estudiante.' });
          return;
        }
      }
    }

    // Check email collision if email is being updated
    if (email) {
      if (!email.endsWith('@correounivalle.edu.co')) {
        res.status(400).json({ error: 'Solo se permiten correos institucionales de la Universidad del Valle (@correounivalle.edu.co)' });
        return;
      }
      const emailSnapshot = await usersRef.where('email', '==', email).get();
      if (!emailSnapshot.empty) {
        const ownerDoc = emailSnapshot.docs[0];
        if (ownerDoc.id !== uid) {
          res.status(400).json({ error: 'El correo ya está en uso por otro estudiante.' });
          return;
        }
      }
    }

    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (avatar !== undefined) updateData.avatar = avatar;

    await usersRef.doc(uid).update(updateData);

    res.status(200).json({ message: 'Perfil actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const uid = req.uid;

    if (!uid) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    res.status(200).json({ message: 'Cuenta eliminada definitivamente' });
  } catch (error: any) {
    console.error('Error deleting user profile:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
