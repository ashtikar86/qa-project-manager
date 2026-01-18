import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

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

        // 2. Parse File
        const workbook = xlsx.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data: any[] = xlsx.utils.sheet_to_json(sheet);

        // 3. Save Document Record
        await prisma.document.create({
            data: {
                projectId: Number(projectId),
                type: 'QAP',
                filename: safeFilename,
                originalName: file.originalname,
                path: `uploads/${projectId}/${safeFilename}`,
            },
        });

        // 4. Create QAP Serials
        const serialsToCreate = data.map((row) => ({
            projectId: Number(projectId),
            serialNumber: String(row['Serial No'] || row['Serial'] || row['Sl. No.'] || Object.values(row)[0] || ''),
            description: String(row['Description'] || row['Activity'] || Object.values(row)[1] || ''),
        })).filter(s => s.serialNumber && s.description);

        // Use transaction as createMany might be tricky with SQLite/Prisma versions
        const transactions = serialsToCreate.map(serial =>
            prisma.qAPSerial.create({ data: serial })
        );
        await prisma.$transaction(transactions);

        res.status(201).json({ message: 'QAP Uploaded and Parsed', count: serialsToCreate.length });
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
        });
        res.json(serials);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching QAP Serials', error });
    }
};
