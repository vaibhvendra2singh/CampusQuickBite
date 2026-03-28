import { Router } from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../../controllers/announcementController';
import { authenticateUser, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createAnnouncementSchema } from '../../models/schemas';
import { z } from 'zod';

const router = Router();

router.use(authenticateUser as any);

router.get('/', getAnnouncements as any);

router.post('/', requireRole(['admin']) as any, validate(z.object({ body: createAnnouncementSchema })), createAnnouncement as any);
router.delete('/:id', requireRole(['admin']) as any, validate(z.object({ params: z.object({ id: z.coerce.number() }) })), deleteAnnouncement as any);

export default router;
