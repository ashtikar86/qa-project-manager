import express from 'express';
import { createProject, assignProject, getProjects, getProjectById, updateProject, requestProjectClosure } from '../controllers/project.controller';
import { exportProjectData } from '../controllers/export.controller';
import { createProjectReport, closeProject, reopenProject } from '../controllers/report.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticateToken);

// Create Project: Admin only
router.post('/', authorizeRoles('ADMIN', 'SUPER_ADMIN'), createProject);

// Assign Project: Admin (or DDG?) - Prompt says Admin appoints.
router.put('/:id/assign', authorizeRoles('ADMIN', 'SUPER_ADMIN'), assignProject);

// List Projects (Filtered by Role in controller)
router.get('/', getProjects);

// Get Project Details
router.get('/:id', getProjectById);

// Update Project Details (Engineer/JCQAO/Admin)
router.put('/:id', authorizeRoles('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), updateProject);

// Closure: Admin closes, Engineer requests
router.put('/:id/request-closure', authorizeRoles('ENGINEER', 'ADMIN', 'SUPER_ADMIN'), requestProjectClosure);

// Export Project Data
router.get('/data/export', exportProjectData);

// Reporting & Archival
router.post('/:id/report', authorizeRoles('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), createProjectReport);
router.put('/:id/close', authorizeRoles('ADMIN', 'SUPER_ADMIN'), closeProject);
router.put('/:id/reopen', authorizeRoles('ADMIN', 'SUPER_ADMIN'), reopenProject);

export default router;
