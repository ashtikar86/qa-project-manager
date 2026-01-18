import { Request, Response } from 'express';
import prisma from '../prisma/client';

export const createInspectionCall = async (req: Request, res: Response) => {
    try {
        const { projectId, callNumber, callDate, inspectionDate, location } = req.body;

        const inspection = await prisma.inspectionCall.create({
            data: {
                projectId: Number(projectId),
                callNumber,
                callDate: new Date(callDate),
                inspectionDate: new Date(inspectionDate),
                location,
                status: 'Pending',
            },
        });

        res.status(201).json(inspection);
    } catch (error) {
        res.status(500).json({ message: 'Error creating inspection call', error });
    }
};

export const updateInspectionCall = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, jirDocumentPath } = req.body;

        const inspection = await prisma.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status,
                jirDocumentPath
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
