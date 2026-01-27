"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const knowledgebank_controller_1 = require("../controllers/knowledgebank.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: 'uploads/temp/' });
router.use(auth_middleware_1.authenticateToken);
router.post('/upload', upload.single('file'), knowledgebank_controller_1.uploadToBank);
router.get('/', knowledgebank_controller_1.getBankItems);
router.delete('/:id', (0, auth_middleware_1.authorizeRoles)('ADMIN', 'SUPER_ADMIN', 'DDG'), knowledgebank_controller_1.deleteBankItem);
exports.default = router;
