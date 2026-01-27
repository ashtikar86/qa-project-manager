import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const generateProjectReport = async (projectId: number) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                documents: true,
                inspectionCalls: true,
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            }
        });

        if (!project) throw new Error('Project not found');

        console.log(`Starting report generation for Project ID: ${projectId}, PO: ${project.poNumber}`);

        // 1. Create the summary page (Tabular Form)
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        try {
            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

            page.drawText('PROJECT COMPLETION REPORT', { x: 50, y: height - 50, size: 24, font, color: rgb(0.1, 0.2, 0.5) });

            // High density tabular-like info
            let y = height - 100;
            const addRow = (label: string, value: string | null) => {
                if (y < 50) { // Add new page if out of space
                    page = pdfDoc.addPage();
                    y = height - 50;
                }
                page.drawText(label.toUpperCase(), { x: 50, y, size: 10, font });
                page.drawText(value || 'N/A', { x: 200, y, size: 10, font: regularFont });
                y -= 20;
            };

            addRow('Field Unit', project.qaFieldUnit);
            addRow('OPA Name', project.opaName);
            addRow('Classification', project.projectClassification);
            addRow('Firm Name', project.firmName);
            addRow('PO Number', project.poNumber);
            addRow('PO Date', project.poDate ? new Date(project.poDate).toDateString() : 'N/A');
            addRow('Main Equipment', project.mainEquipment);
            addRow('Order Value', `INR ${project.orderValue || 0}`);
            addRow('Engineer', project.engineer?.name || 'Unassigned');
            addRow('JCQAO', project.jcqao?.name || 'Unassigned');

            console.log('Tabular summary page created');
        } catch (summaryError) {
            console.error('Error generating summary page:', summaryError);
            // We can continue with just a blank first page if needed, but summary is important.
            throw new Error(`Failed to generate report summary: ${summaryError}`);
        }

        // 2. Append documents in SEQUENCE
        const sequence = ['PO', 'FCL', 'FCM', 'QAP', 'FAT_TRIAL', 'FORM_IV', 'DRAWING'];
        console.log(`Merging documents in sequence: ${sequence.join(', ')}`);

        for (const type of sequence) {
            const typedDocs = project.documents.filter(d => d.type === type);
            for (const doc of typedDocs) {
                try {
                    const docPath = path.join(__dirname, '../../', doc.path);
                    if (!fs.existsSync(docPath)) {
                        console.warn(`File not found, skipping: ${docPath}`);
                        continue;
                    }

                    const fileBytes = fs.readFileSync(docPath);

                    if (doc.filename.toLowerCase().endsWith('.pdf') || doc.originalName.toLowerCase().endsWith('.pdf')) {
                        console.log(`Loading PDF artifact: ${doc.filename} (Type: ${type})`);
                        // Use ignoreEncryption to handle some protected PDFs
                        const externalDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
                        const pages = await pdfDoc.copyPages(externalDoc, externalDoc.getPageIndices());
                        pages.forEach(p => pdfDoc.addPage(p));
                        console.log(`Successfully merged ${pages.length} pages from ${doc.filename}`);
                    } else if (doc.filename.toLowerCase().match(/\.(jpg|jpeg|png)$/i)) {
                        console.log(`Embedding image artifact: ${doc.filename} (Type: ${type})`);
                        const isPng = doc.filename.toLowerCase().endsWith('.png');
                        const image = isPng ? await pdfDoc.embedPng(fileBytes) : await pdfDoc.embedJpg(fileBytes);
                        const imgPage = pdfDoc.addPage();
                        const { width: pW, height: pH } = imgPage.getSize();

                        // Scale image to fit page
                        const dims = image.scaleToFit(pW - 100, pH - 100);
                        imgPage.drawImage(image, {
                            x: (pW - dims.width) / 2,
                            y: (pH - dims.height) / 2,
                            width: dims.width,
                            height: dims.height
                        });
                    } else {
                        console.warn(`Unsupported document type, skipping: ${doc.filename}`);
                    }
                } catch (e) {
                    console.error(`Failed to process document ${doc.filename}:`, e);
                    // Skip and continue with other documents
                }
            }
        }

        const pdfBytes = await pdfDoc.save();

        // Clean filename: remove illegal chars for various OS
        const cleanPo = project.poNumber.replace(/[<>:"/\\|?*]/g, '-');
        const reportFilename = `Closure_Report_${cleanPo}_${Date.now()}.pdf`;
        const projectDir = path.join(__dirname, '../../uploads', projectId.toString());
        const reportsDir = path.join(projectDir, 'reports');

        if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

        const finalPath = path.join(reportsDir, reportFilename);
        fs.writeFileSync(finalPath, pdfBytes);

        // Return relative path for web access
        const webPath = `uploads/${projectId}/reports/${reportFilename}`;
        console.log(`Report generated successfully: ${webPath}`);

        return { filename: reportFilename, path: webPath };
    } catch (error) {
        console.error('CRITICAL Error generating project report:', error);
        throw error;
    }
};
