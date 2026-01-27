import { Router } from 'express';
import { createInspectionCall, updateInspectionCall, getInspectionCalls, getAllInspectionCalls, completeInspectionCall } from '../controllers/inspection.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllInspectionCalls);
router.post('/', upload.single('callDocument'), createInspectionCall);
router.put('/:id', updateInspectionCall);
router.post('/:id/complete', upload.single('jir'), completeInspectionCall);
router.get('/:projectId', getInspectionCalls);

export default router;
