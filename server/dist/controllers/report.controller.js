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
exports.reopenProject = exports.closeProject = exports.createProjectReport = void 0;
const report_service_1 = require("../services/report.service");
const client_1 = __importDefault(require("../prisma/client"));
const createProjectReport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const report = yield (0, report_service_1.generateProjectReport)(Number(id));
        // Fetch project for naming in Knowledge Bank
        const projectDetails = yield client_1.default.project.findUnique({
            where: { id: Number(id) }
        });
        // Optionally save report metadata in DB
        yield client_1.default.document.create({
            data: {
                projectId: Number(id),
                type: 'PROJECT_REPORT',
                filename: report.filename,
                originalName: report.filename,
                path: report.path.split('uploads')[1] ? `uploads${report.path.split('uploads')[1]}` : report.path,
            }
        });
        // AUTO-ARCHIVE to Knowledge Bank
        yield client_1.default.knowledgeBankItem.create({
            data: {
                category: 'REPORTS',
                title: 'Project Closure Report',
                filename: report.filename,
                originalName: `${(projectDetails === null || projectDetails === void 0 ? void 0 : projectDetails.opaName) || 'N/A'} - ${(projectDetails === null || projectDetails === void 0 ? void 0 : projectDetails.poNumber) || 'N/A'}`,
                path: report.path.split('uploads')[1] ? `uploads${report.path.split('uploads')[1]}` : report.path,
                uploadedBy: user.id
            }
        });
        res.json(Object.assign({ message: 'Report generated successfully' }, report));
        // ARCHIVE the project now and remove from engineer
        yield client_1.default.project.update({
            where: { id: Number(id) },
            data: {
                isClosed: true,
                isClosureRequested: false,
                isClosureApproved: false,
                engineerId: null // Removed from engineer active list
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating report', error });
    }
});
exports.createProjectReport = createProjectReport;
const closeProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield client_1.default.project.update({
            where: { id: Number(id) },
            data: { isClosureApproved: true }
        });
        res.json({ message: 'Project closure request approved. Engineer can now generate the final report.', project });
    }
    catch (error) {
        res.status(500).json({ message: 'Error approving project closure', error });
    }
});
exports.closeProject = closeProject;
const reopenProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const project = yield client_1.default.project.update({
            where: { id: Number(id) },
            data: {
                isClosed: false,
                isClosureRequested: false,
                isClosureApproved: false
            }
        });
        res.json({ message: 'Project reopened', project });
    }
    catch (error) {
        res.status(500).json({ message: 'Error reopening project', error });
    }
});
exports.reopenProject = reopenProject;
