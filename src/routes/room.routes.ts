import { Router } from 'express';
import { createRoom, getMyRooms } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @openapi
 * /rooms:
 *   post:
 *     tags:
 *       - Rooms
 *     summary: Crea una nueva sala de estudio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sala de Matemáticas"
 *     responses:
 *       201:
 *         description: Sala creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 createdBy:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: El nombre de la sala es requerido
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authMiddleware, createRoom);

/**
 * @openapi
 * /rooms:
 *   get:
 *     tags:
 *       - Rooms
 *     summary: Obtiene la lista de salas creadas por el usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de salas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   createdBy:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authMiddleware, getMyRooms);

export default router;
