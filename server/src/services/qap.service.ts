import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const prisma = new PrismaClient();

export const parseQAPExcel = async (projectId: number, filePath: string) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        let serials: any[] = [];

        if (['.xlsx', '.xls', '.xlsb', '.xlsm', '.csv', '.ods'].includes(ext)) {
            const fileBuffer = fs.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data: any[] = XLSX.utils.sheet_to_json(worksheet);

            serials = data.map(row => {
                const serialNumber = row['Serial Number'] || row['S.No'] || row['Serial'] || row['Serial No'] || row['Sl. No.'] || '';
                const description = row['Description'] || row['Item Description'] || row['Item'] || row['Activity'] || '';

                if (!serialNumber && !description) return null;

                return {
                    projectId,
                    serialNumber: String(serialNumber),
                    description: String(description),
                    isCompleted: false,
                };
            }).filter(item => item !== null);
        } else if (ext === '.txt') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter((l: string) => l.trim());
            serials = lines.map((line: string, index: number) => ({
                projectId,
                serialNumber: String(index + 1),
                description: line.trim(),
                isCompleted: false
            }));
        } else if (ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: dataBuffer });
            const data = await parser.getText();
            await parser.destroy();

            const lines = data.text.split('\n').filter((l: string) => l.trim().length > 2);

            // Regex for common serial numbers: 1, 1.1, 1.1.1, (a), (i), A, B, etc.
            const serialRegex = /^([0-9]+(\.[0-9]+)*|[a-z]\.|\([a-z]\)|[A-Z]\.|\([0-9]+\))\s+/;

            serials = lines.map((line: string, index: number) => {
                const trimmedLine = line.trim();
                const match = trimmedLine.match(serialRegex);

                if (match) {
                    const serialNumber = match[1];
                    const description = trimmedLine.replace(serialRegex, '').trim();
                    return {
                        projectId,
                        serialNumber,
                        description,
                        isCompleted: false
                    };
                } else {
                    // Fallback if no serial number found
                    return {
                        projectId,
                        serialNumber: `P${index + 1}`,
                        description: trimmedLine,
                        isCompleted: false
                    };
                }
            });

            // "Convert to Excel" - save the extracted data as an excel for later use
            try {
                const excelData = serials.map(s => ({
                    'Serial Number': s.serialNumber,
                    'Description': s.description,
                    'Status': 'Pending',
                    'Remarks': ''
                }));
                const ws = XLSX.utils.json_to_sheet(excelData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Parsed QAP');
                const excelPath = filePath.replace('.pdf', '_converted.xlsx');
                XLSX.writeFile(wb, excelPath);

                // Also add as a document record
                await prisma.document.create({
                    data: {
                        projectId,
                        type: 'QAP_CONVERTED',
                        filename: path.basename(excelPath),
                        originalName: path.basename(excelPath),
                        path: `uploads/${projectId}/${path.basename(excelPath)}`,
                    }
                });
            } catch (err) {
                console.error('Failed to save converted Excel:', err);
            }
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({ path: filePath });
            const lines = result.value.split('\n').filter((l: string) => l.trim().length > 5);
            serials = lines.map((line: string, index: number) => ({
                projectId,
                serialNumber: String(index + 1),
                description: line.trim(),
                isCompleted: false
            }));
        }

        if (serials.length > 0) {
            await prisma.qAPSerial.deleteMany({ where: { projectId } });

            for (const serial of serials) {
                await prisma.qAPSerial.create({ data: serial as any });
            }

            await prisma.project.update({
                where: { id: projectId },
                data: { progressPercentage: 0 }
            });
        }

        return serials.length;
    } catch (error) {
        console.error('Error parsing QAP file:', error);
        throw error;
    }
};
