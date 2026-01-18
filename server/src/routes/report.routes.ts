import { Router } from 'express';
import { generateProjectReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/:id', generateProjectReport);

export default router;
