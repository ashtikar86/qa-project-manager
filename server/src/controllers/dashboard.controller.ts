import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { calculateStatusCategory } from '../utils/status';

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
            include: {
                engineer: { select: { name: true } }
            }
        });

        let red = 0;
        let orange = 0;
        let green = 0;
        const engineerLoad: Record<string, number> = {};
        const opaStatusStats: Record<string, { red: number, orange: number, green: number }> = {};
        const engineerStatusStats: Record<string, { red: number, orange: number, green: number }> = {};

        const progressDistribution = {
            lessThan5: 0,
            lessThan20: 0,
            moreThan60: 0,
            moreThan80: 0,
        };

        projects.forEach((p: any) => {
            const status = calculateStatusCategory(new Date(p.poExpiryDate), p.dpExtensionDate ? new Date(p.dpExtensionDate) : null);

            if (status === 'Red') red++;
            else if (status === 'Orange') orange++;
            else green++;

            // OPA Status Tracking
            const opa = p.qaFieldUnit || 'Unknown';
            if (!opaStatusStats[opa]) opaStatusStats[opa] = { red: 0, orange: 0, green: 0 };
            if (status === 'Red') opaStatusStats[opa].red++;
            else if (status === 'Orange') opaStatusStats[opa].orange++;
            else opaStatusStats[opa].green++;

            // Engineer Status Tracking
            if (p.engineer) {
                const name = p.engineer.name;
                engineerLoad[name] = (engineerLoad[name] || 0) + 1;

                if (!engineerStatusStats[name]) engineerStatusStats[name] = { red: 0, orange: 0, green: 0 };
                if (status === 'Red') engineerStatusStats[name].red++;
                else if (status === 'Orange') engineerStatusStats[name].orange++;
                else engineerStatusStats[name].green++;
            }

            // Progress Logic
            const prog = p.progressPercentage || 0;
            if (prog < 5) progressDistribution.lessThan5++;
            if (prog < 20) progressDistribution.lessThan20++;
            if (prog > 60) progressDistribution.moreThan60++;
            if (prog > 80) progressDistribution.moreThan80++;
        });

        res.json({
            statusCounts: { red, orange, green },
            progressDistribution,
            engineerLoad: Object.entries(engineerLoad).map(([name, count]) => ({ name, value: count })),
            opaStatusStats: Object.entries(opaStatusStats).map(([name, stats]) => ({ name, ...stats })),
            engineerStatusStats: Object.entries(engineerStatusStats).map(([name, stats]) => ({ name, ...stats })),
            totalActive: projects.length,
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
};
