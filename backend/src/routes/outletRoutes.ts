import { Router } from 'express';
import { getAllOutlets, getOutletById, createOutlet, updateOutlet, deleteOutlet, updateOutletStatus } from '../controllers/outletController';

const router = Router();

router.get('/', getAllOutlets);
router.get('/:id', getOutletById);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.post('/:id/status', updateOutletStatus);
router.delete('/:id', deleteOutlet);

export default router;
