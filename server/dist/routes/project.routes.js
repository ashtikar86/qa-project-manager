"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// Create Project: DDG or Admin
router.post('/', (0, auth_middleware_1.authorizeRoles)('DDG', 'ADMIN', 'SUPER_ADMIN'), project_controller_1.createProject);
// Assign Project: Admin (or DDG?) - Prompt says Admin appoints.
router.put('/:id/assign', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), project_controller_1.assignProject);
// List Projects (Filtered by Role in controller)
router.get('/', project_controller_1.getProjects);
// Get Project Details
router.get('/:id', project_controller_1.getProjectById);
// Update Project Details (Engineer/JCQAO/Admin)
router.put('/:id', (0, auth_middleware_1.authorizeRoles)('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), project_controller_1.updateProject);
exports.default = router;
