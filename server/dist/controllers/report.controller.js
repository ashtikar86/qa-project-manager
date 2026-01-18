"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateProjectReport = void 0;
const pdf_lib_1 = require("pdf-lib");
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const generateProjectReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield client_1.default.project.findUnique({
            where: { id: Number(id) },
            include: {
                documents: true,
            },
        });
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        // Create a new PDFDocument
        const pdfDoc = yield pdf_lib_1.PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const fontSize = 24;
        // Draw Cover Page
        page.drawText(`Project Report: ${project.projectName || project.poNumber}`, {
            x: 50,
            y: height - 4 * fontSize,
            size: fontSize,
            color: (0, pdf_lib_1.rgb)(0, 0, 0),
        });
        page.drawText(`Firm: ${project.firmName}`, { x: 50, y: height - 6 * fontSize, size: 18 });
        page.drawText(`Status: ${project.statusCategory} (${project.progressPercentage}%)`, { x: 50, y: height - 8 * fontSize, size: 18 });
        // Add more details...
        // Append Documents
        const projectFolder = path_1.default.join(__dirname, '../../uploads', project.id.toString());
        for (const doc of project.documents) {
            try {
                const docPath = path_1.default.join(projectFolder, doc.filename);
                if (!fs_1.default.existsSync(docPath))
                    continue;
                const fileBytes = fs_1.default.readFileSync(docPath);
                if (doc.filename.toLowerCase().endsWith('.pdf')) {
                    const srcDoc = yield pdf_lib_1.PDFDocument.load(fileBytes);
                    const copiedPages = yield pdfDoc.copyPages(srcDoc, srcDoc.getPageIndices());
                    copiedPages.forEach((page) => pdfDoc.addPage(page));
                }
                else if (doc.filename.match(/\.(jpg|jpeg|png)$/i)) {
                    // Image embedding
                    let image;
                    if (doc.filename.match(/\.png$/i)) {
                        image = yield pdfDoc.embedPng(fileBytes);
                    }
                    else {
                        image = yield pdfDoc.embedJpg(fileBytes);
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
            }
            catch (err) {
                console.error(`Failed to embed document ${doc.filename}`, err);
            }
        }
        const pdfBytes = yield pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=project-report-${project.poNumber}.pdf`);
        res.send(Buffer.from(pdfBytes));
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating report', error });
    }
});
exports.generateProjectReport = generateProjectReport;
