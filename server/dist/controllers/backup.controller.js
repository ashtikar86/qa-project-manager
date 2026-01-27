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
exports.restoreBackup = exports.getBackups = exports.createBackup = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(__dirname, '../../prisma/dev.db');
const backupDir = path_1.default.join(__dirname, '../../backups');
if (!fs_1.default.existsSync(backupDir)) {
    fs_1.default.mkdirSync(backupDir, { recursive: true });
}
// export const createBackup = async (req: Request, res: Response) => {
//     try {
//         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//         const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
//         fs.copyFileSync(dbPath, backupFile);
//         res.json({ message: 'Backup created successfully', version: `backup-${timestamp}.db` });
//     } catch (error) {
//         res.status(500).json({ message: 'Error creating backup', error });
//     }
// };
const createBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(501).json({ message: 'Backup functionality needs to be updated for PostgreSQL' });
});
exports.createBackup = createBackup;
const getBackups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = fs_1.default.readdirSync(backupDir).filter(f => f.endsWith('.db'));
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching backups', error });
    }
});
exports.getBackups = getBackups;
// export const restoreBackup = async (req: Request, res: Response) => {
//     try {
//         const { filename } = req.body;
//         const backupFile = path.join(backupDir, filename);
//         if (!fs.existsSync(backupFile)) {
//             return res.status(404).json({ message: 'Backup file not found' });
//         }
//         // Ideally, we should stop writing to DB or restart service. 
//         // SQLite can handle copy over if unlocked, but risky if active.
//         // For this app, we assume low concurrency.
//         fs.copyFileSync(backupFile, dbPath);
//         res.json({ message: 'Database restored successfully. Please restart server if issues occur.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error restoring backup', error });
//     }
// };
const restoreBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(501).json({ message: 'Restore functionality needs to be updated for PostgreSQL' });
});
exports.restoreBackup = restoreBackup;
