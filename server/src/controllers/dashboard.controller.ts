import { Request, Response } from 'express';
import prisma from '../prisma/client';

interface AuthRequest extends Request {
    user?: any;
}

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user!;
        let whereClause: any = { isClosed: false };

        if (user.role === 'JCQAO') {
            whereClause.jcqaoId = user.id;
        } else if (user.role === 'ENGINEER') {
            whereClause.engineerId = user.id;
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            select: {
                id: true,
                poExpiryDate: true,
                dpExtensionDate: true,
                progressPercentage: true,
                statusCategory: true,
            }
        });

        let red = 0;
        let orange = 0;
        let green = 0;

        const progressDistribution = {
            lessThan5: 0,
            lessThan20: 0,
            moreThan60: 0,
            moreThan80: 0,
        };

        const now = new Date();
        const sixtyDays = 60 * 24 * 60 * 60 * 1000;

        projects.forEach((p: any) => {
            // Status Logic
            const expiry = p.dpExtensionDate ? new Date(p.dpExtensionDate) : new Date(p.poExpiryDate);
            const diff = expiry.getTime() - now.getTime();

            let status = 'Green';
            if (diff < 0) {
                status = 'Red';
            } else if (diff < sixtyDays) {
                status = 'Orange';
            }

            if (status === 'Red') red++;
            else if (status === 'Orange') orange++;
            else green++;

            // Progress Logic
            const prog = p.progressPercentage;
            if (prog < 5) progressDistribution.lessThan5++;
            if (prog < 20) progressDistribution.lessThan20++;
            if (prog > 60) progressDistribution.moreThan60++;
            if (prog > 80) progressDistribution.moreThan80++;
        });

        res.json({
            statusCounts: { red, orange, green },
            progressDistribution,
            totalActive: projects.length,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};
