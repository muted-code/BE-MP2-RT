import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     description: Retorna el estado del servicio
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend-main',
    timestamp: new Date().toISOString(),
  });
});

export default router;
