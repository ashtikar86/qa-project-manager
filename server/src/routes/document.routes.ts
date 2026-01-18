import { Router } from 'express';
import { uploadDocument, getProjectDocuments } from '../controllers/document.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:projectId', getProjectDocuments);

export default router;
