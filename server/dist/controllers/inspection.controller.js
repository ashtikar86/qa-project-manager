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
exports.getInspectionCalls = exports.updateInspectionCall = exports.createInspectionCall = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const createInspectionCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, callNumber, callDate, inspectionDate, location } = req.body;
        const inspection = yield client_1.default.inspectionCall.create({
            data: {
                projectId: Number(projectId),
                callNumber,
                callDate: new Date(callDate),
                inspectionDate: new Date(inspectionDate),
                location,
                status: 'Pending',
            },
        });
        res.status(201).json(inspection);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating inspection call', error });
    }
});
exports.createInspectionCall = createInspectionCall;
const updateInspectionCall = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, jirDocumentPath } = req.body;
        const inspection = yield client_1.default.inspectionCall.update({
            where: { id: Number(id) },
            data: {
                status,
                jirDocumentPath
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
