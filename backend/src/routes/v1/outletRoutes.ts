import { Router } from 'express';
import { getAllOutlets, getOutletById, createOutlet, updateOutlet, deleteOutlet, updateOutletStatus } from '../../controllers/outletController';
import { validate } from '../../middleware/validate';
import { createOutletSchema, updateOutletSchema } from '../../models/schemas';
import { z } from 'zod';
import { authenticateUser, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', getAllOutlets);
router.get('/:id', validate(z.object({ params: z.object({ id: z.string().min(1) }) })), getOutletById);

// Admin-only creation
router.post('/', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ body: createOutletSchema })), createOutlet);

// Owner/Admin updates
router.put('/:id', authenticateUser as any, requireRole(['owner', 'admin']) as any, validate(z.object({ 
    params: z.object({ id: z.string().min(1) }),
    body: updateOutletSchema 
})), updateOutlet);

router.post('/:id/status', authenticateUser as any, validate(z.object({ 
    params: z.object({ id: z.string().min(1) }),
    body: z.object({ status: z.enum(['FAST', 'MODERATE', 'BUSY']) }) 
})), updateOutletStatus);

router.delete('/:id', authenticateUser as any, requireRole(['admin']) as any, validate(z.object({ params: z.object({ id: z.string().min(1) }) })), deleteOutlet);

export default router;
