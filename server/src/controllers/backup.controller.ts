import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../prisma/dev.db');
const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
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

export const createBackup = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Backup functionality needs to be updated for PostgreSQL' });
};

export const getBackups = async (req: Request, res: Response) => {
    try {
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.db'));
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching backups', error });
    }
};

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

export const restoreBackup = async (req: Request, res: Response) => {
    res.status(501).json({ message: 'Restore functionality needs to be updated for PostgreSQL' });
};
