import { Router } from 'express';
import { createProject, assignProject, getProjects, getProjectById, updateProject } from '../controllers/project.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Create Project: DDG or Admin
router.post('/', authorizeRoles('DDG', 'ADMIN', 'SUPER_ADMIN'), createProject);

// Assign Project: Admin (or DDG?) - Prompt says Admin appoints.
router.put('/:id/assign', authorizeRoles('ADMIN', 'SUPER_ADMIN'), assignProject);

// List Projects (Filtered by Role in controller)
router.get('/', getProjects);

// Get Project Details
router.get('/:id', getProjectById);

// Update Project Details (Engineer/JCQAO/Admin)
router.put('/:id', authorizeRoles('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), updateProject);

export default router;
