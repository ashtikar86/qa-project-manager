"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBackupJob = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dbPath = path_1.default.join(__dirname, '../../prisma/dev.db');
const backupDir = path_1.default.join(__dirname, '../../backups');
if (!fs_1.default.existsSync(backupDir)) {
    fs_1.default.mkdirSync(backupDir, { recursive: true });
}
const initBackupJob = () => {
    // Run weekly on Sunday at midnight (0 0 * * 0)
    // cron.schedule('0 0 * * 0', () => {
    //     console.log('Running weekly backup...');
    //     try {
    //         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    //         const backupFile = path.join(backupDir, `weekly-backup-${timestamp}.db`);
    //         fs.copyFileSync(dbPath, backupFile);
    //         console.log(`Weekly backup created: ${backupFile}`);
    //     } catch (error) {
    //         console.error('Weekly backup failed:', error);
    //     }
    // });
    console.log('PostgreSQL backup job not yet implemented');
};
exports.initBackupJob = initBackupJob;
