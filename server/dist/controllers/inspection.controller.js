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
exports.completeInspectionCall = exports.getAllInspectionCalls = exports.getInspectionCalls = exports.updateInspectionCall = exports.createInspectionCall = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const createInspectionCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, callNumber, callDate, inspectionDate, location } = req.body;
        const file = req.file;
        // 1. Fetch the project to get the assigned Engineer
        const targetProject = yield client_1.default.project.findUnique({
            where: { id: Number(projectId) },
            select: { engineerId: true }
        });
        if (targetProject === null || targetProject === void 0 ? void 0 : targetProject.engineerId) {
            // 2. Check for same-day conflicts (different location) for this engineer
            const targetDate = new Date(inspectionDate);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            const conflictingCall = yield client_1.default.inspectionCall.findFirst({
                where: {
                    project: { engineerId: targetProject.engineerId },
                    inspectionDate: {
                        gte: startOfDay,
                        lte: endOfDay
                    },
                    NOT: {
                        location: {
                            equals: location,
                            mode: 'insensitive'
                        }
                    }
                },
                include: {
                    project: {
                        select: { poNumber: true }
                    }
                }
            });
            if (conflictingCall && conflictingCall.project) {
                if (req.file && fs_1.default.existsSync(req.file.path))
                    fs_1.default.unlinkSync(req.file.path);
                return res.status(400).json({
                    message: `Schedule Conflict: Engineer is already assigned to a DIFFERENT location on this day (Project: ${conflictingCall.project.poNumber}, Location: ${conflictingCall.location}).`
                });
            }
        }
        let callDocumentPath = null;
        if (file) {
            const projectFolder = path_1.default.join(__dirname, '../../uploads', projectId.toString());
            if (!fs_1.default.existsSync(projectFolder)) {
                fs_1.default.mkdirSync(projectFolder, { recursive: true });
            }
            const safeFilename = `Call_${Date.now()}_${file.originalname}`;
            const finalPath = path_1.default.join(projectFolder, safeFilename);
            fs_1.default.renameSync(file.path, finalPath);
            callDocumentPath = `uploads/${projectId}/${safeFilename}`;
            // Track in general documents
            yield client_1.default.document.create({
                data: {
                    projectId: Number(projectId),
                    type: 'INSPECTION_CALL',
                    filename: safeFilename,
                    originalName: file.originalname,
                    path: callDocumentPath
                }
            });
        }
        const inspection = yield client_1.default.inspectionCall.create({
            data: {
                projectId: Number(projectId),
                callNumber,
                callDate: new Date(callDate),
                inspectionDate: new Date(inspectionDate),
                location,
                status: 'Pending',
                callDocumentPath
            },
        });
        res.status(201).json(inspection);
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error creating inspection call', error });
    }
});
exports.createInspectionCall = createInspectionCall;
const updateInspectionCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, jirDocumentPath, remarks } = req.body;
        const inspection = yield client_1.default.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status,
                jirDocumentPath,
                remarks
            }
        });
        res.json(inspection);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating inspection call', error });
    }
});
exports.updateInspectionCall = updateInspectionCall;
const getInspectionCalls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.params;
        const inspections = yield client_1.default.inspectionCall.findMany({
            where: { projectId: Number(projectId) },
        });
        res.json(inspections);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching inspections', error });
    }
});
exports.getInspectionCalls = getInspectionCalls;
const getAllInspectionCalls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'DDG'].includes(user.role);
        let whereClause = {};
        if (!isAdmin) {
            if (user.role === 'JCQAO') {
                whereClause.project = { jcqaoId: user.id };
            }
            else if (user.role === 'ENGINEER') {
                whereClause.project = { engineerId: user.id };
            }
        }
        const inspections = yield client_1.default.inspectionCall.findMany({
            where: whereClause,
            include: {
                project: {
                    select: {
                        poNumber: true,
                        firmName: true,
                        isClosed: true
                    }
                }
            },
            orderBy: {
                inspectionDate: 'desc'
            }
        });
        res.json(inspections);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching all inspections', error });
    }
});
exports.getAllInspectionCalls = getAllInspectionCalls;
const completeInspectionCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { remarks } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: 'JIR file (PDF/Image) is required to complete inspection.' });
        }
        const inspection = yield client_1.default.inspectionCall.findUnique({
            where: { id: Number(id) }
        });
        if (!inspection) {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Inspection call not found' });
        }
        // Move file to project folder
        const projectFolder = path_1.default.join(__dirname, '../../uploads', inspection.projectId.toString());
        if (!fs_1.default.existsSync(projectFolder)) {
            fs_1.default.mkdirSync(projectFolder, { recursive: true });
        }
        const safeFilename = `JIR_${Date.now()}_${file.originalname}`;
        const finalPath = path_1.default.join(projectFolder, safeFilename);
        fs_1.default.renameSync(file.path, finalPath);
        const relativePath = `uploads/${inspection.projectId}/${safeFilename}`;
        const updated = yield client_1.default.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status: 'Completed',
                jirDocumentPath: relativePath,
                remarks: remarks || null
            }
        });
        // Track in general documents as well
        yield client_1.default.document.create({
            data: {
                projectId: inspection.projectId,
                type: 'JIR',
                filename: safeFilename,
                originalName: file.originalname,
                path: relativePath
            }
        });
        res.json(updated);
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Error completing inspection call', error });
    }
});
exports.completeInspectionCall = completeInspectionCall;
