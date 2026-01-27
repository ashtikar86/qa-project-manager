import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';
import { calculateStatusCategory } from '../utils/status';

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

        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'DDG'].includes(user.role);

        if (!isAdmin) {
            whereClause.isClosed = false;
            if (user.role === 'JCQAO') {
                whereClause.jcqaoId = user.id;
            } else if (user.role === 'ENGINEER') {
                whereClause.engineerId = user.id;
            }
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            },
            orderBy: {
                createdAt: 'desc'
            }
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
                inspectionCalls: true,
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
        const user = (req as AuthRequest).user!;
        const {
            // Admin only fields
            qaFieldUnit, opaName, projectClassification, firmName, poNumber, poDate, poReceiptDate, poExpiryDate,
            // Engineer fields
            mainEquipment, orderValue, fclDate, fcmDate, drawingApprovalDate, qapApprovalDate, dpExtensionDate,
            presentStatus, remarks
        } = req.body;

        const currentProject = await prisma.project.findUnique({
            where: { id: Number(id) }
        });

        if (!currentProject) return res.status(404).json({ message: 'Project not found' });

        const updateData: any = {};
        const historyEntries: any[] = [];

        // Role-based validation and change tracking
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'DDG';
        const isEngineer = user.role === 'ENGINEER';

        if (isAdmin) {
            if (qaFieldUnit) updateData.qaFieldUnit = qaFieldUnit;
            if (opaName) updateData.opaName = opaName;
            if (projectClassification) updateData.projectClassification = projectClassification;
            if (firmName) updateData.firmName = firmName;
            if (poNumber) updateData.poNumber = poNumber;
            if (poDate) updateData.poDate = new Date(poDate);
            if (poReceiptDate) updateData.poReceiptDate = new Date(poReceiptDate);
            if (poExpiryDate) updateData.poExpiryDate = new Date(poExpiryDate);

            // Assignment fields (NEW)
            if (req.body.jcqaoId !== undefined) updateData.jcqaoId = req.body.jcqaoId === null ? null : Number(req.body.jcqaoId);
            if (req.body.engineerId !== undefined) updateData.engineerId = req.body.engineerId === null ? null : Number(req.body.engineerId);
        }

        const isOwnerEngineer = user.role === 'ENGINEER' && currentProject.engineerId === user.id;

        if (isOwnerEngineer || isAdmin) {
            if (mainEquipment !== undefined) updateData.mainEquipment = mainEquipment;
            if (orderValue !== undefined) updateData.orderValue = Number(orderValue);
            if (fclDate !== undefined) updateData.fclDate = fclDate ? new Date(fclDate) : null;
            if (fcmDate !== undefined) updateData.fcmDate = fcmDate ? new Date(fcmDate) : null;
            if (drawingApprovalDate !== undefined) updateData.drawingApprovalDate = drawingApprovalDate ? new Date(drawingApprovalDate) : null;
            if (qapApprovalDate !== undefined) updateData.qapApprovalDate = qapApprovalDate ? new Date(qapApprovalDate) : null;
            if (req.body.formIVIssuanceDate !== undefined) updateData.formIVIssuanceDate = req.body.formIVIssuanceDate ? new Date(req.body.formIVIssuanceDate) : null;

            // History tracked fields
            if (dpExtensionDate !== undefined) {
                const newDate = dpExtensionDate ? new Date(dpExtensionDate).toISOString() : null;
                const oldDate = currentProject.dpExtensionDate?.toISOString() || null;
                if (newDate !== oldDate) {
                    updateData.dpExtensionDate = dpExtensionDate ? new Date(dpExtensionDate) : null;
                    historyEntries.push({ fieldName: 'dpExtensionDate', value: newDate, changedBy: user.id });
                }
            }
            if (presentStatus !== undefined && presentStatus !== currentProject.presentStatus) {
                updateData.presentStatus = presentStatus;
                historyEntries.push({ fieldName: 'presentStatus', value: presentStatus, changedBy: user.id });
            }
            if (remarks !== undefined && remarks !== currentProject.remarks) {
                updateData.remarks = remarks;
                historyEntries.push({ fieldName: 'remarks', value: remarks, changedBy: user.id });
            }
        }

        // Automatic status calculation
        const poExp = updateData.poExpiryDate || currentProject.poExpiryDate;
        const dpExt = updateData.dpExtensionDate === undefined ? currentProject.dpExtensionDate : updateData.dpExtensionDate;
        updateData.statusCategory = calculateStatusCategory(poExp, dpExt);

        const updatedProject = await prisma.project.update({
            where: { id: Number(id) },
            data: {
                ...updateData,
                history: {
                    create: historyEntries
                }
            },
            include: {
                history: {
                    orderBy: { changedAt: 'desc' },
                    take: 10
                }
            }
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ message: 'Error updating project', error });
    }
};

export const requestProjectClosure = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const user = (req as any).user;

        const project = await prisma.project.findUnique({
            where: { id: Number(id) }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Check if user is the assigned engineer
        if (project.engineerId !== user.id && !['ADMIN', 'SUPER_ADMIN', 'DDG'].includes(user.role)) {
            return res.status(403).json({ message: 'Only the assigned Engineer can request closure.' });
        }

        const updatedProject = await prisma.project.update({
            where: { id: Number(id) },
            data: {
                isClosureRequested: true,
                closureRequestRemarks: remarks || null
            }
        });

        res.json({ message: 'Closure requested successfully', project: updatedProject });
    } catch (error) {
        res.status(500).json({ message: 'Error requesting closure', error });
    }
};
