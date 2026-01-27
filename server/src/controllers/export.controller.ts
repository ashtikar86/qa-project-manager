import { Request, Response } from 'express';
import prisma from '../prisma/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportProjectData = async (req: Request, res: Response) => {
    try {
        const { format: exportFormat } = req.query;
        const projects = await prisma.project.findMany({
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            },
        });

        const data = projects.map(p => ({
            'PO Number': p.poNumber,
            'Firm Name': p.firmName,
            'OPA': p.opaName,
            'Field Unit': p.qaFieldUnit,
            'Status': p.statusCategory,
            'Progress %': p.progressPercentage,
            'JCQAO': p.jcqao?.name || 'N/A',
            'Engineer': p.engineer?.name || 'N/A',
            'PO Date': format(new Date(p.poDate), 'yyyy-MM-dd'),
            'PO Expiry': format(new Date(p.poExpiryDate), 'yyyy-MM-dd'),
            'DP Extension': p.dpExtensionDate ? format(new Date(p.dpExtensionDate), 'yyyy-MM-dd') : 'N/A',
        }));

        if (exportFormat === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=projects_export.xlsx');
            return res.send(buffer);
        }

        if (exportFormat === 'csv') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=projects_export.csv');
            return res.send(csv);
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error exporting data', error });
    }
};
