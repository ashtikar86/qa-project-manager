import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
    user?: any;
}

// Helper to create project folder
const createProjectFolder = (projectId: number) => {
    const projectPath = path.join(__dirname, '../../uploads', projectId.toString());
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const {
            qaFieldUnit,
            opaName,
            projectClassification,
            firmName,
            poNumber,
            poDate,
            poReceiptDate,
            poExpiryDate,
            mainEquipment,
        } = req.body;

        const project = await prisma.project.create({
            data: {
                qaFieldUnit,
                opaName,
                projectClassification,
                firmName,
                poNumber,
                poDate: new Date(poDate),
                poReceiptDate: new Date(poReceiptDate),
                poExpiryDate: new Date(poExpiryDate),
                mainEquipment: mainEquipment || '',
                statusCategory: 'Green',
            },
        });

        createProjectFolder(project.id);

        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
};

export const assignProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { jcqaoId, engineerId } = req.body;

        const project = await prisma.project.update({
            where: { id: Number(id) },
            data: {
                jcqaoId: jcqaoId ? Number(jcqaoId) : undefined,
                engineerId: engineerId ? Number(engineerId) : undefined,
            },
            include: {
                jcqao: { select: { name: true, username: true } },
                engineer: { select: { name: true, username: true } },
            },
        });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error assigning project', error });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        let whereClause: any = {};

        if (user.role === 'JCQAO') {
            whereClause.jcqaoId = user.id;
        } else if (user.role === 'ENGINEER') {
            whereClause.engineerId = user.id;
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            },
        });

        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
                lineItems: true,
                documents: true,
                qapSerials: true,
            },
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            firmName, poNumber, mainEquipment, orderValue,
            fclDate, fcmDate, drawingApprovalDate, qapApprovalDate, dpExtensionDate,
            presentStatus, remarks, statusCategory,
        } = req.body;

        const updatedProject = await prisma.project.update({
            where: { id: Number(id) },
            data: {
                firmName, poNumber, mainEquipment,
                orderValue: orderValue ? Number(orderValue) : undefined,
                fclDate: fclDate ? new Date(fclDate) : undefined,
                fcmDate: fcmDate ? new Date(fcmDate) : undefined,
                drawingApprovalDate: drawingApprovalDate ? new Date(drawingApprovalDate) : undefined,
                qapApprovalDate: qapApprovalDate ? new Date(qapApprovalDate) : undefined,
                dpExtensionDate: dpExtensionDate ? new Date(dpExtensionDate) : undefined,
                presentStatus,
                remarks,
                statusCategory,
            },
        });

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
};
