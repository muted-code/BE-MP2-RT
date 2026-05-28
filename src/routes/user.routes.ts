import { Router } from 'express';
import { getProfile, updateProfile, deleteProfile } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @openapi
 * /users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtiene los datos del perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                 email:
 *                   type: string
 *                 username:
 *                   type: string
 *                 name:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Perfil no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @openapi
 * /users/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Actualiza los datos del perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       400:
 *         description: Error de validación o colisión (username o email ya en uso)
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/profile', authMiddleware, updateProfile);

/**
 * @openapi
 * /users/profile:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Elimina de forma definitiva la cuenta del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cuenta eliminada definitivamente
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/profile', authMiddleware, deleteProfile);

export default router;
