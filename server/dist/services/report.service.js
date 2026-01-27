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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const generateProjectReport = (projectId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const project = yield prisma.project.findUnique({
            where: { id: projectId },
            include: {
                documents: true,
                inspectionCalls: true,
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            }
        });
        if (!project)
            throw new Error('Project not found');
        console.log(`Starting report generation for Project ID: ${projectId}, PO: ${project.poNumber}`);
        // 1. Create the summary page (Tabular Form)
        const pdfDoc = yield pdf_lib_1.PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        try {
            const font = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
            const regularFont = yield pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
            page.drawText('PROJECT COMPLETION REPORT', { x: 50, y: height - 50, size: 24, font, color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.5) });
            // High density tabular-like info
            let y = height - 100;
            const addRow = (label, value) => {
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
            addRow('Engineer', ((_a = project.engineer) === null || _a === void 0 ? void 0 : _a.name) || 'Unassigned');
            addRow('JCQAO', ((_b = project.jcqao) === null || _b === void 0 ? void 0 : _b.name) || 'Unassigned');
            console.log('Tabular summary page created');
        }
        catch (summaryError) {
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
                    const docPath = path_1.default.join(__dirname, '../../', doc.path);
                    if (!fs_1.default.existsSync(docPath)) {
                        console.warn(`File not found, skipping: ${docPath}`);
                        continue;
                    }
                    const fileBytes = fs_1.default.readFileSync(docPath);
                    if (doc.filename.toLowerCase().endsWith('.pdf') || doc.originalName.toLowerCase().endsWith('.pdf')) {
                        console.log(`Loading PDF artifact: ${doc.filename} (Type: ${type})`);
                        // Use ignoreEncryption to handle some protected PDFs
                        const externalDoc = yield pdf_lib_1.PDFDocument.load(fileBytes, { ignoreEncryption: true });
                        const pages = yield pdfDoc.copyPages(externalDoc, externalDoc.getPageIndices());
                        pages.forEach(p => pdfDoc.addPage(p));
                        console.log(`Successfully merged ${pages.length} pages from ${doc.filename}`);
                    }
                    else if (doc.filename.toLowerCase().match(/\.(jpg|jpeg|png)$/i)) {
                        console.log(`Embedding image artifact: ${doc.filename} (Type: ${type})`);
                        const isPng = doc.filename.toLowerCase().endsWith('.png');
                        const image = isPng ? yield pdfDoc.embedPng(fileBytes) : yield pdfDoc.embedJpg(fileBytes);
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
                    }
                    else {
                        console.warn(`Unsupported document type, skipping: ${doc.filename}`);
                    }
                }
                catch (e) {
                    console.error(`Failed to process document ${doc.filename}:`, e);
                    // Skip and continue with other documents
                }
            }
        }
        const pdfBytes = yield pdfDoc.save();
        // Clean filename: remove illegal chars for various OS
        const cleanPo = project.poNumber.replace(/[<>:"/\\|?*]/g, '-');
        const reportFilename = `Closure_Report_${cleanPo}_${Date.now()}.pdf`;
        const projectDir = path_1.default.join(__dirname, '../../uploads', projectId.toString());
        const reportsDir = path_1.default.join(projectDir, 'reports');
        if (!fs_1.default.existsSync(reportsDir))
            fs_1.default.mkdirSync(reportsDir, { recursive: true });
        const finalPath = path_1.default.join(reportsDir, reportFilename);
        fs_1.default.writeFileSync(finalPath, pdfBytes);
        // Return relative path for web access
        const webPath = `uploads/${projectId}/reports/${reportFilename}`;
        console.log(`Report generated successfully: ${webPath}`);
        return { filename: reportFilename, path: webPath };
    }
    catch (error) {
        console.error('CRITICAL Error generating project report:', error);
        throw error;
    }
});
exports.generateProjectReport = generateProjectReport;
