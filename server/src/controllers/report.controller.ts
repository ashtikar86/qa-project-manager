import { Request, Response } from 'express';
import { PDFDocument, rgb } from 'pdf-lib';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';

export const generateProjectReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            include: {
                documents: true,
            },
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Create a new PDFDocument
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 24;

        // Draw Cover Page
        page.drawText(`Project Report: ${project.projectName || project.poNumber}`, {
            x: 50,
            y: height - 4 * fontSize,
            size: fontSize,
            color: rgb(0, 0, 0),
        });

        page.drawText(`Firm: ${project.firmName}`, { x: 50, y: height - 6 * fontSize, size: 18 });
        page.drawText(`Status: ${project.statusCategory} (${project.progressPercentage}%)`, { x: 50, y: height - 8 * fontSize, size: 18 });
        // Add more details...

        // Append Documents
        const projectFolder = path.join(__dirname, '../../uploads', project.id.toString());

        for (const doc of project.documents) {
            try {
                const docPath = path.join(projectFolder, doc.filename);
                if (!fs.existsSync(docPath)) continue;

                const fileBytes = fs.readFileSync(docPath);

                if (doc.filename.toLowerCase().endsWith('.pdf')) {
                    const srcDoc = await PDFDocument.load(fileBytes);
                    const copiedPages = await pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach((page) => pdfDoc.addPage(page));
                } else if (doc.filename.match(/\.(jpg|jpeg|png)$/i)) {
                    // Image embedding
                    let image;
                    if (doc.filename.match(/\.png$/i)) {
                        image = await pdfDoc.embedPng(fileBytes);
                    } else {
                        image = await pdfDoc.embedJpg(fileBytes);
                    }
                    const imagePage = pdfDoc.addPage();
                    // Scale image to fit page
                    const imageDims = image.scale(0.5); // Naive scaling
                    imagePage.drawImage(image, {
                        x: 50,
                        y: height - imageDims.height - 50,
                        width: imageDims.width,
                        height: imageDims.height,
                    });
                }
            } catch (err) {
                console.error(`Failed to embed document ${doc.filename}`, err);
            }
        }

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=project-report-${project.poNumber}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (error) {
        res.status(500).json({ message: 'Error generating report', error });
    }
};
