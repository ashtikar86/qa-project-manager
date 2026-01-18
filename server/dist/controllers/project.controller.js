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
exports.updateProject = exports.getProjectById = exports.getProjects = exports.assignProject = exports.createProject = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Helper to create project folder
const createProjectFolder = (projectId) => {
    const projectPath = path_1.default.join(__dirname, '../../uploads', projectId.toString());
    if (!fs_1.default.existsSync(projectPath)) {
        fs_1.default.mkdirSync(projectPath, { recursive: true });
    }
};
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { qaFieldUnit, opaName, projectClassification, firmName, poNumber, poDate, poReceiptDate, poExpiryDate, mainEquipment, } = req.body;
        const project = yield client_1.default.project.create({
            data: {
                qaFieldUnit,
                opaName,
                projectClassification,
                firmName,
                poNumber,
                poDate: new Date(poDate),
                poReceiptDate: new Date(poReceiptDate),
                poExpiryDate: new Date(poExpiryDate),
                mainEquipment: mainEquipment || '',
                statusCategory: 'Green',
            },
        });
        createProjectFolder(project.id);
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating project', error });
    }
});
exports.createProject = createProject;
const assignProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { jcqaoId, engineerId } = req.body;
        const project = yield client_1.default.project.update({
            where: { id: Number(id) },
            data: {
                jcqaoId: jcqaoId ? Number(jcqaoId) : undefined,
                engineerId: engineerId ? Number(engineerId) : undefined,
            },
            include: {
                jcqao: { select: { name: true, username: true } },
                engineer: { select: { name: true, username: true } },
            },
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Error assigning project', error });
    }
});
exports.assignProject = assignProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        let whereClause = {};
        if (user.role === 'JCQAO') {
            whereClause.jcqaoId = user.id;
        }
        else if (user.role === 'ENGINEER') {
            whereClause.engineerId = user.id;
        }
        const projects = yield client_1.default.project.findMany({
            where: whereClause,
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            },
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching projects', error });
    }
});
exports.getProjects = getProjects;
const getProjectById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield client_1.default.project.findUnique({
            where: { id: Number(id) },
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
                lineItems: true,
                documents: true,
                qapSerials: true,
            },
        });
        if (!project)
            return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching project', error });
    }
});
exports.getProjectById = getProjectById;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firmName, poNumber, mainEquipment, orderValue, fclDate, fcmDate, drawingApprovalDate, qapApprovalDate, dpExtensionDate, presentStatus, remarks, statusCategory, } = req.body;
        const updatedProject = yield client_1.default.project.update({
            where: { id: Number(id) },
            data: {
                firmName, poNumber, mainEquipment,
                orderValue: orderValue ? Number(orderValue) : undefined,
                fclDate: fclDate ? new Date(fclDate) : undefined,
                fcmDate: fcmDate ? new Date(fcmDate) : undefined,
                drawingApprovalDate: drawingApprovalDate ? new Date(drawingApprovalDate) : undefined,
                qapApprovalDate: qapApprovalDate ? new Date(qapApprovalDate) : undefined,
                dpExtensionDate: dpExtensionDate ? new Date(dpExtensionDate) : undefined,
                presentStatus,
                remarks,
                statusCategory,
            },
        });
        res.json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating project', error });
    }
});
exports.updateProject = updateProject;
