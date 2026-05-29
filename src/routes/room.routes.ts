import { Router } from 'express';
// 1. Agregamos clearRoomMessages a la importación
import { createRoom, getMyRooms, deleteRoom, updateRoom, getRoomById, getRoomMessages, clearRoomMessages } from '../controllers/room.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Rutas básicas de creación y obtención
router.post('/', authMiddleware, createRoom);
router.get('/', authMiddleware, getMyRooms);

// 2. Obtener sala por ID (Para unirse con enlace/ID)
/**
 * @openapi
 * /rooms/{id}:
 * get:
 * tags:
 * - Rooms
 * summary: Obtiene los detalles de una sala por su ID
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Sala encontrada con éxito
 * 401:
 * description: No autorizado
 * 404:
 * description: Sala no encontrada o ID inválido
 */
router.get('/:id', authMiddleware, getRoomById);

// 3. Obtener historial de mensajes
/**
 * @openapi
 * /rooms/{id}/messages:
 * get:
 * tags:
 * - Rooms
 * summary: Obtiene el historial de mensajes de una sala
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Historial obtenido con éxito
 * 401:
 * description: No autorizado
 * 500:
 * description: Error interno del servidor
 */
router.get('/:id/messages', authMiddleware, getRoomMessages);

// 👇 NUEVA RUTA: Borrar historial de mensajes 👇
/**
 * @openapi
 * /rooms/{id}/messages:
 * delete:
 * tags:
 * - Rooms
 * summary: Borra todo el historial de mensajes de una sala (Solo creador)
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Historial borrado con éxito
 * 401:
 * description: No autorizado
 * 403:
 * description: Solo el creador del grupo puede borrar el historial
 * 404:
 * description: Sala no encontrada
 * 500:
 * description: Error interno del servidor
 */
router.delete('/:id/messages', authMiddleware, clearRoomMessages);

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

/**
 * @openapi
 * /rooms/{id}:
 * put:
 * tags:
 * - Rooms
 * summary: Actualiza el nombre de una sala
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * properties:
 * name:
 * type: string
 * example: "Sala de Matemáticas Avanzadas"
 * responses:
 * 200:
 * description: Sala actualizada con éxito
 * 400:
 * description: El nombre de la sala es requerido
 * 401:
 * description: No autorizado
 * 403:
 * description: No tienes permiso para modificar esta sala
 * 404:
 * description: Sala no encontrada
 */
router.put('/:id', authMiddleware, updateRoom);

export default router; 