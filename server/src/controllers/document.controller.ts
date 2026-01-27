import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';
import { parseQAPExcel } from '../services/qap.service';

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const { projectId, type } = req.body;
        const file = req.file;

        if (!file || !projectId || !type) {
            return res.status(400).json({ message: 'Missing file, projectId, or type' });
        }

        // Move file to project folder
        const projectFolder = path.join(__dirname, '../../uploads', projectId.toString());
        if (!fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder, { recursive: true });
        }

        const targetPath = path.join(projectFolder, file.originalname);

        // Check if exists, maybe append timestamp? For now overwrite or suffix.
        // Let's use internal filename to avoid collision but keep original name in DB
        const safeFilename = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(projectFolder, safeFilename);

        fs.renameSync(file.path, finalPath);

        const relativePath = `uploads/${projectId}/${safeFilename}`;

        const document = await prisma.document.create({
            data: {
                projectId: Number(projectId),
                type,
                filename: safeFilename,
                originalName: file.originalname,
                path: relativePath,
            },
        });

        // Trigger QAP parsing if type is QAP
        if (type === 'QAP') {
            const ext = path.extname(file.originalname).toLowerCase();
            const supportedExts = ['.xlsx', '.xls', '.xlsb', '.xlsm', '.pdf', '.docx', '.odt', '.txt', '.csv', '.ods', '.xps'];
            if (supportedExts.includes(ext)) {
                try {
                    await parseQAPExcel(Number(projectId), finalPath);
                } catch (err) {
                    console.error('QAP parsing failed but document saved:', err);
                }
            } else {
                console.log(`QAP upload has unsupported extension ${ext}, skipping auto-parsing.`);
            }
        }

        res.status(201).json(document);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path); // Clean up temp file on error
        }
        res.status(500).json({ message: 'Error uploading document', error });
    }
};

export const getProjectDocuments = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const documents = await prisma.document.findMany({
            where: { projectId: Number(projectId) },
        });
        res.json(documents);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
};
