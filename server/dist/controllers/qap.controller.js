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
exports.deleteQAPSerial = exports.createQAPSerial = exports.getQAPSerials = exports.updateQAPSerial = exports.uploadAndParseQAP = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const qap_service_1 = require("../services/qap.service");
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
        // 2. Parse and Save Record
        yield client_1.default.document.create({
            data: {
                projectId: Number(projectId),
                type: 'QAP',
                filename: safeFilename,
                originalName: file.originalname,
                path: `uploads/${projectId}/${safeFilename}`,
            },
        });
        const count = yield (0, qap_service_1.parseQAPExcel)(Number(projectId), finalPath);
        res.status(201).json({ message: 'QAP Uploaded and Parsed', count });
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
            orderBy: { id: 'asc' }
        });
        res.json(serials);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching QAP Serials', error });
    }
});
exports.getQAPSerials = getQAPSerials;
const createQAPSerial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, serialNumber, description } = req.body;
        if (!projectId || !serialNumber || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const serial = yield client_1.default.qAPSerial.create({
            data: {
                projectId: Number(projectId),
                serialNumber,
                description,
                isCompleted: false
            }
        });
        res.status(201).json(serial);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating QAP Serial', error });
    }
});
exports.createQAPSerial = createQAPSerial;
const deleteQAPSerial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield client_1.default.qAPSerial.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'QAP Serial deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting QAP Serial', error });
    }
});
exports.deleteQAPSerial = deleteQAPSerial;
