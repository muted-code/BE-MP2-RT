import { Router } from 'express';
// 1. Agrega deleteRoom a la importación
import { createRoom, getMyRooms, deleteRoom } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// ... (Aquí van tus documentaciones @openapi y rutas post y get que ya tienes) ...
router.post('/', authMiddleware, createRoom);
router.get('/', authMiddleware, getMyRooms);

// 2. AGREGA ESTA LÍNEA AL FINAL (Antes del export default)
/**
 * @openapi
 * /rooms/{id}:
 * delete:
 * tags:
 * - Rooms
 * summary: Elimina una sala por su ID
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 204:
 * description: Sala eliminada con éxito
 * 401:
 * description: No autorizado
 * 403:
 * description: No tienes permiso para eliminar esta sala
 * 404:
 * description: Sala no encontrada
 */
router.delete('/:id', authMiddleware, deleteRoom);

export default router; 