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
exports.getDashboardStats = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        let whereClause = { isClosed: false };
        if (user.role === 'JCQAO') {
            whereClause.jcqaoId = user.id;
        }
        else if (user.role === 'ENGINEER') {
            whereClause.engineerId = user.id;
        }
        const projects = yield client_1.default.project.findMany({
            where: whereClause,
            select: {
                id: true,
                poExpiryDate: true,
                dpExtensionDate: true,
                progressPercentage: true,
                statusCategory: true,
            }
        });
        let red = 0;
        let orange = 0;
        let green = 0;
        const progressDistribution = {
            lessThan5: 0,
            lessThan20: 0,
            moreThan60: 0,
            moreThan80: 0,
        };
        const now = new Date();
        const sixtyDays = 60 * 24 * 60 * 60 * 1000;
        projects.forEach((p) => {
            // Status Logic
            const expiry = p.dpExtensionDate ? new Date(p.dpExtensionDate) : new Date(p.poExpiryDate);
            const diff = expiry.getTime() - now.getTime();
            let status = 'Green';
            if (diff < 0) {
                status = 'Red';
            }
            else if (diff < sixtyDays) {
                status = 'Orange';
            }
            if (status === 'Red')
                red++;
            else if (status === 'Orange')
                orange++;
            else
                green++;
            // Progress Logic
            const prog = p.progressPercentage;
            if (prog < 5)
                progressDistribution.lessThan5++;
            if (prog < 20)
                progressDistribution.lessThan20++;
            if (prog > 60)
                progressDistribution.moreThan60++;
            if (prog > 80)
                progressDistribution.moreThan80++;
        });
        res.json({
            statusCounts: { red, orange, green },
            progressDistribution,
            totalActive: projects.length,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});
exports.getDashboardStats = getDashboardStats;
