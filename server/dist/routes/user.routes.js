"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Only Super Admin and Admin can manage users
router.use(auth_middleware_1.authenticateToken);
router.use((0, auth_middleware_1.authorizeRoles)('SUPER_ADMIN', 'ADMIN'));
router.post('/', user_controller_1.createUser);
router.get('/', user_controller_1.getUsers);
router.put('/:id', user_controller_1.updateUser);
exports.default = router;
