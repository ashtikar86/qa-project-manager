"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const backup_controller_1 = require("../controllers/backup.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.authorizeRoles)('SUPER_ADMIN')); // Only Super Admin
router.post('/', backup_controller_1.createBackup);
router.get('/', backup_controller_1.getBackups);
router.post('/restore', backup_controller_1.restoreBackup);
exports.default = router;
