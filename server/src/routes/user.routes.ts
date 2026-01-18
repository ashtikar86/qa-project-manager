import { Router } from 'express';
import { createUser, getUsers, updateUser } from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Only Super Admin and Admin can manage users
router.use(authenticateToken);
router.use(authorizeRoles('SUPER_ADMIN', 'ADMIN'));

router.post('/', createUser);
router.get('/', getUsers);
router.put('/:id', updateUser);

export default router;
