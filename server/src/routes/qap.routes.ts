import { Router } from 'express';
import { uploadAndParseQAP, updateQAPSerial, getQAPSerials, createQAPSerial, deleteQAPSerial } from '../controllers/qap.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadAndParseQAP);
router.post('/', createQAPSerial);
router.get('/:projectId', getQAPSerials);
router.put('/:id', updateQAPSerial);
router.delete('/:id', deleteQAPSerial);

export default router;
