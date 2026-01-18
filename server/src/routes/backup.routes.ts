import { Router } from 'express';
import { createBackup, getBackups, restoreBackup } from '../controllers/backup.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('SUPER_ADMIN')); // Only Super Admin

router.post('/', createBackup);
router.get('/', getBackups);
router.post('/restore', restoreBackup);

export default router;
