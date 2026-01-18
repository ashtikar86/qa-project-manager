import { Router } from 'express';
import { uploadAndParseQAP, updateQAPSerial, getQAPSerials } from '../controllers/qap.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadAndParseQAP);
router.get('/:projectId', getQAPSerials);
router.put('/:id', updateQAPSerial);

export default router;
