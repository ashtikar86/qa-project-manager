import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadToBank, getBankItems, deleteBankItem } from '../controllers/knowledgebank.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ dest: 'uploads/temp/' });

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadToBank);
router.get('/', getBankItems);
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN', 'DDG'), deleteBankItem);

export default router;
