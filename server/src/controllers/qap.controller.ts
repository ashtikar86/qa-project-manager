import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';
import { parseQAPExcel } from '../services/qap.service';

export const uploadAndParseQAP = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.body;
        const file = req.file;

        if (!file || !projectId) {
            return res.status(400).json({ message: 'Missing file or projectId' });
        }

        // 1. Save File
        const projectFolder = path.join(__dirname, '../../uploads', projectId.toString());
        if (!fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder, { recursive: true });
        }
        const safeFilename = `${Date.now()}_QAP_${file.originalname}`;
        const finalPath = path.join(projectFolder, safeFilename);
        fs.renameSync(file.path, finalPath);

        // 2. Parse and Save Record
        await prisma.document.create({
            data: {
                projectId: Number(projectId),
                type: 'QAP',
                filename: safeFilename,
                originalName: file.originalname,
                path: `uploads/${projectId}/${safeFilename}`,
            },
        });

        const count = await parseQAPExcel(Number(projectId), finalPath);

        res.status(201).json({ message: 'QAP Uploaded and Parsed', count });
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing QAP', error });
    }
};

export const updateQAPSerial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isCompleted, remarks } = req.body;

        const serial = await prisma.qAPSerial.update({
            where: { id: Number(id) },
            data: {
                isCompleted,
                remarks,
                completedAt: isCompleted ? new Date() : null,
            },
        });

        // Update Project Progress
        const projectId = serial.projectId;
        const totalSerials = await prisma.qAPSerial.count({ where: { projectId } });
        const completedSerials = await prisma.qAPSerial.count({ where: { projectId, isCompleted: true } });

        const progress = totalSerials > 0 ? (completedSerials / totalSerials) * 100 : 0;

        await prisma.project.update({
            where: { id: projectId },
            data: { progressPercentage: progress }
        });

        res.json({ ...serial, projectProgress: progress });
    } catch (error) {
        res.status(500).json({ message: 'Error updating QAP Serial', error });
    }
};

export const getQAPSerials = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const serials = await prisma.qAPSerial.findMany({
            where: { projectId: Number(projectId) },
            orderBy: { id: 'asc' }
        });
        res.json(serials);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching QAP Serials', error });
    }
};

export const createQAPSerial = async (req: Request, res: Response) => {
    try {
        const { projectId, serialNumber, description } = req.body;

        if (!projectId || !serialNumber || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const serial = await prisma.qAPSerial.create({
            data: {
                projectId: Number(projectId),
                serialNumber,
                description,
                isCompleted: false
            }
        });

        res.status(201).json(serial);
    } catch (error) {
        res.status(500).json({ message: 'Error creating QAP Serial', error });
    }
};

export const deleteQAPSerial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.qAPSerial.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'QAP Serial deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting QAP Serial', error });
    }
};
