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
exports.getQAPSerials = exports.updateQAPSerial = exports.uploadAndParseQAP = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const xlsx = __importStar(require("xlsx"));
const uploadAndParseQAP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.body;
        const file = req.file;
        if (!file || !projectId) {
            return res.status(400).json({ message: 'Missing file or projectId' });
        }
        // 1. Save File
        const projectFolder = path_1.default.join(__dirname, '../../uploads', projectId.toString());
        if (!fs_1.default.existsSync(projectFolder)) {
            fs_1.default.mkdirSync(projectFolder, { recursive: true });
        }
        const safeFilename = `${Date.now()}_QAP_${file.originalname}`;
        const finalPath = path_1.default.join(projectFolder, safeFilename);
        fs_1.default.renameSync(file.path, finalPath);
        // 2. Parse File
        const workbook = xlsx.readFile(finalPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        // 3. Save Document Record
        yield client_1.default.document.create({
            data: {
                projectId: Number(projectId),
                type: 'QAP',
                filename: safeFilename,
                originalName: file.originalname,
                path: `uploads/${projectId}/${safeFilename}`,
            },
        });
        // 4. Create QAP Serials
        const serialsToCreate = data.map((row) => ({
            projectId: Number(projectId),
            serialNumber: String(row['Serial No'] || row['Serial'] || row['Sl. No.'] || Object.values(row)[0] || ''),
            description: String(row['Description'] || row['Activity'] || Object.values(row)[1] || ''),
        })).filter(s => s.serialNumber && s.description);
        // Use transaction as createMany might be tricky with SQLite/Prisma versions
        const transactions = serialsToCreate.map(serial => client_1.default.qAPSerial.create({ data: serial }));
        yield client_1.default.$transaction(transactions);
        res.status(201).json({ message: 'QAP Uploaded and Parsed', count: serialsToCreate.length });
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error processing QAP', error });
    }
});
exports.uploadAndParseQAP = uploadAndParseQAP;
const updateQAPSerial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isCompleted, remarks } = req.body;
        const serial = yield client_1.default.qAPSerial.update({
            where: { id: Number(id) },
            data: {
                isCompleted,
                remarks,
                completedAt: isCompleted ? new Date() : null,
            },
        });
        // Update Project Progress
        const projectId = serial.projectId;
        const totalSerials = yield client_1.default.qAPSerial.count({ where: { projectId } });
        const completedSerials = yield client_1.default.qAPSerial.count({ where: { projectId, isCompleted: true } });
        const progress = totalSerials > 0 ? (completedSerials / totalSerials) * 100 : 0;
        yield client_1.default.project.update({
            where: { id: projectId },
            data: { progressPercentage: progress }
        });
        res.json(Object.assign(Object.assign({}, serial), { projectProgress: progress }));
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating QAP Serial', error });
    }
});
exports.updateQAPSerial = updateQAPSerial;
const getQAPSerials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const serials = yield client_1.default.qAPSerial.findMany({
            where: { projectId: Number(projectId) },
        });
        res.json(serials);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching QAP Serials', error });
    }
});
exports.getQAPSerials = getQAPSerials;
