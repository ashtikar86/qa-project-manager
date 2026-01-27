import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';

export const createInspectionCall = async (req: Request, res: Response) => {
    try {
        const { projectId, callNumber, callDate, inspectionDate, location } = req.body;
        const file = req.file;

        // 1. Fetch the project to get the assigned Engineer
        const targetProject = await prisma.project.findUnique({
            where: { id: Number(projectId) },
            select: { engineerId: true }
        });

        if (targetProject?.engineerId) {
            // 2. Check for same-day conflicts (different location) for this engineer
            const targetDate = new Date(inspectionDate);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

            const conflictingCall = await prisma.inspectionCall.findFirst({
                where: {
                    project: { engineerId: targetProject.engineerId },
                    inspectionDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    NOT: {
                        location: {
                            equals: location,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    project: {
                        select: { poNumber: true }
                    }
                }
            });

            if (conflictingCall && conflictingCall.project) {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({
                    message: `Schedule Conflict: Engineer is already assigned to a DIFFERENT location on this day (Project: ${conflictingCall.project.poNumber}, Location: ${conflictingCall.location}).`
                });
            }
        }

        let callDocumentPath = null;
        if (file) {
            const projectFolder = path.join(__dirname, '../../uploads', projectId.toString());
            if (!fs.existsSync(projectFolder)) {
                fs.mkdirSync(projectFolder, { recursive: true });
            }
            const safeFilename = `Call_${Date.now()}_${file.originalname}`;
            const finalPath = path.join(projectFolder, safeFilename);
            fs.renameSync(file.path, finalPath);
            callDocumentPath = `uploads/${projectId}/${safeFilename}`;

            // Track in general documents
            await prisma.document.create({
                data: {
                    projectId: Number(projectId),
                    type: 'INSPECTION_CALL',
                    filename: safeFilename,
                    originalName: file.originalname,
                    path: callDocumentPath
                }
            });
        }

        const inspection = await prisma.inspectionCall.create({
            data: {
                projectId: Number(projectId),
                callNumber,
                callDate: new Date(callDate),
                inspectionDate: new Date(inspectionDate),
                location,
                status: 'Pending',
                callDocumentPath
            },
        });

        res.status(201).json(inspection);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error creating inspection call', error });
    }
};

export const updateInspectionCall = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, jirDocumentPath, remarks } = req.body;

        const inspection = await prisma.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status,
                jirDocumentPath,
                remarks
            }
        });
        res.json(inspection);
    } catch (error) {
        res.status(500).json({ message: 'Error updating inspection call', error });
    }
};

export const getInspectionCalls = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const inspections = await prisma.inspectionCall.findMany({
            where: { projectId: Number(projectId) },
        });
        res.json(inspections);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inspections', error });
    }
};

export const getAllInspectionCalls = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'DDG'].includes(user.role);

        let whereClause: any = {};
        if (!isAdmin) {
            if (user.role === 'JCQAO') {
                whereClause.project = { jcqaoId: user.id };
            } else if (user.role === 'ENGINEER') {
                whereClause.project = { engineerId: user.id };
            }
        }

        const inspections = await prisma.inspectionCall.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        poNumber: true,
                        firmName: true,
                        isClosed: true
                    }
                }
            },
            orderBy: {
                inspectionDate: 'desc'
            }
        });
        res.json(inspections);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all inspections', error });
    }
};

export const completeInspectionCall = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'JIR file (PDF/Image) is required to complete inspection.' });
        }

        const inspection = await prisma.inspectionCall.findUnique({
            where: { id: Number(id) }
        });

        if (!inspection) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Inspection call not found' });
        }

        // Move file to project folder
        const projectFolder = path.join(__dirname, '../../uploads', inspection.projectId.toString());
        if (!fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder, { recursive: true });
        }

        const safeFilename = `JIR_${Date.now()}_${file.originalname}`;
        const finalPath = path.join(projectFolder, safeFilename);

        fs.renameSync(file.path, finalPath);
        const relativePath = `uploads/${inspection.projectId}/${safeFilename}`;

        const updated = await prisma.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status: 'Completed',
                jirDocumentPath: relativePath,
                remarks: remarks || null
            }
        });

        // Track in general documents as well
        await prisma.document.create({
            data: {
                projectId: inspection.projectId,
                type: 'JIR',
                filename: safeFilename,
                originalName: file.originalname,
                path: relativePath
            }
        });

        res.json(updated);
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error completing inspection call', error });
    }
};
