import { Request, Response } from 'express';
import { generateProjectReport } from '../services/report.service';
import prisma from '../prisma/client';

export const createProjectReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const report = await generateProjectReport(Number(id));

        // Fetch project for naming in Knowledge Bank
        const projectDetails = await prisma.project.findUnique({
            where: { id: Number(id) }
        });

        // Optionally save report metadata in DB
        await prisma.document.create({
            data: {
                projectId: Number(id),
                type: 'PROJECT_REPORT',
                filename: report.filename,
                originalName: report.filename,
                path: report.path.split('uploads')[1] ? `uploads${report.path.split('uploads')[1]}` : report.path,
            }
        });

        // AUTO-ARCHIVE to Knowledge Bank
        await prisma.knowledgeBankItem.create({
            data: {
                category: 'REPORTS',
                title: 'Project Closure Report',
                filename: report.filename,
                originalName: `${projectDetails?.opaName || 'N/A'} - ${projectDetails?.poNumber || 'N/A'}`,
                path: report.path.split('uploads')[1] ? `uploads${report.path.split('uploads')[1]}` : report.path,
                uploadedBy: user.id
            }
        });

        res.json({ message: 'Report generated successfully', ...report });

        // ARCHIVE the project now and remove from engineer
        await prisma.project.update({
            where: { id: Number(id) },
            data: {
                isClosed: true,
                isClosureRequested: false,
                isClosureApproved: false,
                engineerId: null // Removed from engineer active list
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating report', error });
    }
};

export const closeProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.update({
            where: { id: Number(id) },
            data: { isClosureApproved: true }
        });
        res.json({ message: 'Project closure request approved. Engineer can now generate the final report.', project });
    } catch (error) {
        res.status(500).json({ message: 'Error approving project closure', error });
    }
};

export const reopenProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.update({
            where: { id: Number(id) },
            data: {
                isClosed: false,
                isClosureRequested: false,
                isClosureApproved: false
            }
        });
        res.json({ message: 'Project reopened', project });
    } catch (error) {
        res.status(500).json({ message: 'Error reopening project', error });
    }
};
