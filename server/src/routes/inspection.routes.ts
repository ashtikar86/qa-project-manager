import { Router } from 'express';
import { createInspectionCall, updateInspectionCall, getInspectionCalls } from '../controllers/inspection.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/', createInspectionCall);
router.put('/:id', updateInspectionCall);
router.get('/:projectId', getInspectionCalls);

export default router;
