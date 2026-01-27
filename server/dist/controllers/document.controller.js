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
exports.getProjectDocuments = exports.uploadDocument = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const qap_service_1 = require("../services/qap.service");
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, type } = req.body;
        const file = req.file;
        if (!file || !projectId || !type) {
            return res.status(400).json({ message: 'Missing file, projectId, or type' });
        }
        // Move file to project folder
        const projectFolder = path_1.default.join(__dirname, '../../uploads', projectId.toString());
        if (!fs_1.default.existsSync(projectFolder)) {
            fs_1.default.mkdirSync(projectFolder, { recursive: true });
        }
        const targetPath = path_1.default.join(projectFolder, file.originalname);
        // Check if exists, maybe append timestamp? For now overwrite or suffix.
        // Let's use internal filename to avoid collision but keep original name in DB
        const safeFilename = `${Date.now()}_${file.originalname}`;
        const finalPath = path_1.default.join(projectFolder, safeFilename);
        fs_1.default.renameSync(file.path, finalPath);
        const relativePath = `uploads/${projectId}/${safeFilename}`;
        const document = yield client_1.default.document.create({
            data: {
                projectId: Number(projectId),
                type,
                filename: safeFilename,
                originalName: file.originalname,
                path: relativePath,
            },
        });
        // Trigger QAP parsing if type is QAP
        if (type === 'QAP') {
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            const supportedExts = ['.xlsx', '.xls', '.xlsb', '.xlsm', '.pdf', '.docx', '.odt', '.txt', '.csv', '.ods', '.xps'];
            if (supportedExts.includes(ext)) {
                try {
                    yield (0, qap_service_1.parseQAPExcel)(Number(projectId), finalPath);
                }
                catch (err) {
                    console.error('QAP parsing failed but document saved:', err);
                }
            }
            else {
                console.log(`QAP upload has unsupported extension ${ext}, skipping auto-parsing.`);
            }
        }
        res.status(201).json(document);
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path); // Clean up temp file on error
        }
        res.status(500).json({ message: 'Error uploading document', error });
    }
});
exports.uploadDocument = uploadDocument;
const getProjectDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const documents = yield client_1.default.document.findMany({
            where: { projectId: Number(projectId) },
        });
        res.json(documents);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching documents', error });
    }
});
exports.getProjectDocuments = getProjectDocuments;
