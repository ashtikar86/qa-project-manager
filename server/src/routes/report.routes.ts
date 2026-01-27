import { Router } from 'express';
import { createProjectReport } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/project/:id', createProjectReport);

export default router;
