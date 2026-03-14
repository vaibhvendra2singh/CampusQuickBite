import { Router } from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController';
import { authenticateUser, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateUser as any);

// Students and everyone can get relevant announcements
router.get('/', getAnnouncements as any);

// Admins only: create and delete
router.post('/', requireRole(['admin']) as any, createAnnouncement as any);
router.delete('/:id', requireRole(['admin']) as any, deleteAnnouncement as any);

export default router;
