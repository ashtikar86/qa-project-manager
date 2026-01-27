"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controller_1 = require("../controllers/project.controller");
const export_controller_1 = require("../controllers/export.controller");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.authenticateToken);
// Create Project: Admin only
router.post('/', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), project_controller_1.createProject);
// Assign Project: Admin (or DDG?) - Prompt says Admin appoints.
router.put('/:id/assign', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), project_controller_1.assignProject);
// List Projects (Filtered by Role in controller)
router.get('/', project_controller_1.getProjects);
// Get Project Details
router.get('/:id', project_controller_1.getProjectById);
// Update Project Details (Engineer/JCQAO/Admin)
router.put('/:id', (0, auth_middleware_1.authorizeRoles)('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), project_controller_1.updateProject);
// Closure: Admin closes, Engineer requests
router.put('/:id/request-closure', (0, auth_middleware_1.authorizeRoles)('ENGINEER', 'ADMIN', 'SUPER_ADMIN'), project_controller_1.requestProjectClosure);
// Export Project Data
router.get('/data/export', export_controller_1.exportProjectData);
// Reporting & Archival
router.post('/:id/report', (0, auth_middleware_1.authorizeRoles)('ENGINEER', 'JCQAO', 'ADMIN', 'SUPER_ADMIN'), report_controller_1.createProjectReport);
router.put('/:id/close', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), report_controller_1.closeProject);
router.put('/:id/reopen', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN'), report_controller_1.reopenProject);
exports.default = router;
