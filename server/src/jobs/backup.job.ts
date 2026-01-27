import cron from 'node-cron';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(__dirname, '../../prisma/dev.db');
const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

export const initBackupJob = () => {
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
