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
const status_1 = require("../utils/status");
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
            include: {
                engineer: { select: { name: true } }
            }
        });
        let red = 0;
        let orange = 0;
        let green = 0;
        const engineerLoad = {};
        const opaStatusStats = {};
        const engineerStatusStats = {};
        const progressDistribution = {
            lessThan5: 0,
            lessThan20: 0,
            moreThan60: 0,
            moreThan80: 0,
        };
        projects.forEach((p) => {
            const status = (0, status_1.calculateStatusCategory)(new Date(p.poExpiryDate), p.dpExtensionDate ? new Date(p.dpExtensionDate) : null);
            if (status === 'Red')
                red++;
            else if (status === 'Orange')
                orange++;
            else
                green++;
            // OPA Status Tracking
            const opa = p.qaFieldUnit || 'Unknown';
            if (!opaStatusStats[opa])
                opaStatusStats[opa] = { red: 0, orange: 0, green: 0 };
            if (status === 'Red')
                opaStatusStats[opa].red++;
            else if (status === 'Orange')
                opaStatusStats[opa].orange++;
            else
                opaStatusStats[opa].green++;
            // Engineer Status Tracking
            if (p.engineer) {
                const name = p.engineer.name;
                engineerLoad[name] = (engineerLoad[name] || 0) + 1;
                if (!engineerStatusStats[name])
                    engineerStatusStats[name] = { red: 0, orange: 0, green: 0 };
                if (status === 'Red')
                    engineerStatusStats[name].red++;
                else if (status === 'Orange')
                    engineerStatusStats[name].orange++;
                else
                    engineerStatusStats[name].green++;
            }
            // Progress Logic
            const prog = p.progressPercentage || 0;
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
            engineerLoad: Object.entries(engineerLoad).map(([name, count]) => ({ name, value: count })),
            opaStatusStats: Object.entries(opaStatusStats).map(([name, stats]) => (Object.assign({ name }, stats))),
            engineerStatusStats: Object.entries(engineerStatusStats).map(([name, stats]) => (Object.assign({ name }, stats))),
            totalActive: projects.length,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error });
    }
});
exports.getDashboardStats = getDashboardStats;
