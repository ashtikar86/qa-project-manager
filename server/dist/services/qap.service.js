"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.parseQAPExcel = void 0;
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pdf_parse_1 = require("pdf-parse");
const mammoth_1 = __importDefault(require("mammoth"));
const prisma = new client_1.PrismaClient();
const parseQAPExcel = (projectId, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ext = path_1.default.extname(filePath).toLowerCase();
        let serials = [];
        if (['.xlsx', '.xls', '.xlsb', '.xlsm', '.csv', '.ods'].includes(ext)) {
            const fileBuffer = fs_1.default.readFileSync(filePath);
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            serials = data.map(row => {
                const serialNumber = row['Serial Number'] || row['S.No'] || row['Serial'] || row['Serial No'] || row['Sl. No.'] || '';
                const description = row['Description'] || row['Item Description'] || row['Item'] || row['Activity'] || '';
                if (!serialNumber && !description)
                    return null;
                return {
                    projectId,
                    serialNumber: String(serialNumber),
                    description: String(description),
                    isCompleted: false,
                };
            }).filter(item => item !== null);
        }
        else if (ext === '.txt') {
            const content = fs_1.default.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter((l) => l.trim());
            serials = lines.map((line, index) => ({
                projectId,
                serialNumber: String(index + 1),
                description: line.trim(),
                isCompleted: false
            }));
        }
        else if (ext === '.pdf') {
            const dataBuffer = fs_1.default.readFileSync(filePath);
            const parser = new pdf_parse_1.PDFParse({ data: dataBuffer });
            const data = yield parser.getText();
            yield parser.destroy();
            const lines = data.text.split('\n').filter((l) => l.trim().length > 2);
            // Regex for common serial numbers: 1, 1.1, 1.1.1, (a), (i), A, B, etc.
            const serialRegex = /^([0-9]+(\.[0-9]+)*|[a-z]\.|\([a-z]\)|[A-Z]\.|\([0-9]+\))\s+/;
            serials = lines.map((line, index) => {
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
                }
                else {
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
                yield prisma.document.create({
                    data: {
                        projectId,
                        type: 'QAP_CONVERTED',
                        filename: path_1.default.basename(excelPath),
                        originalName: path_1.default.basename(excelPath),
                        path: `uploads/${projectId}/${path_1.default.basename(excelPath)}`,
                    }
                });
            }
            catch (err) {
                console.error('Failed to save converted Excel:', err);
            }
        }
        else if (ext === '.docx') {
            const result = yield mammoth_1.default.extractRawText({ path: filePath });
            const lines = result.value.split('\n').filter((l) => l.trim().length > 5);
            serials = lines.map((line, index) => ({
                projectId,
                serialNumber: String(index + 1),
                description: line.trim(),
                isCompleted: false
            }));
        }
        if (serials.length > 0) {
            yield prisma.qAPSerial.deleteMany({ where: { projectId } });
            for (const serial of serials) {
                yield prisma.qAPSerial.create({ data: serial });
            }
            yield prisma.project.update({
                where: { id: projectId },
                data: { progressPercentage: 0 }
            });
        }
        return serials.length;
    }
    catch (error) {
        console.error('Error parsing QAP file:', error);
        throw error;
    }
});
exports.parseQAPExcel = parseQAPExcel;
