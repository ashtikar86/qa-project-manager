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
exports.exportProjectData = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const XLSX = __importStar(require("xlsx"));
const date_fns_1 = require("date-fns");
const exportProjectData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { format: exportFormat } = req.query;
        const projects = yield client_1.default.project.findMany({
            include: {
                jcqao: { select: { name: true } },
                engineer: { select: { name: true } },
            },
        });
        const data = projects.map(p => {
            var _a, _b;
            return ({
                'PO Number': p.poNumber,
                'Firm Name': p.firmName,
                'OPA': p.opaName,
                'Field Unit': p.qaFieldUnit,
                'Status': p.statusCategory,
                'Progress %': p.progressPercentage,
                'JCQAO': ((_a = p.jcqao) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                'Engineer': ((_b = p.engineer) === null || _b === void 0 ? void 0 : _b.name) || 'N/A',
                'PO Date': (0, date_fns_1.format)(new Date(p.poDate), 'yyyy-MM-dd'),
                'PO Expiry': (0, date_fns_1.format)(new Date(p.poExpiryDate), 'yyyy-MM-dd'),
                'DP Extension': p.dpExtensionDate ? (0, date_fns_1.format)(new Date(p.dpExtensionDate), 'yyyy-MM-dd') : 'N/A',
            });
        });
        if (exportFormat === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=projects_export.xlsx');
            return res.send(buffer);
        }
        if (exportFormat === 'csv') {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=projects_export.csv');
            return res.send(csv);
        }
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ message: 'Error exporting data', error });
    }
});
exports.exportProjectData = exportProjectData;
