import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import documentRoutes from './routes/document.routes';
import qapRoutes from './routes/qap.routes';
import inspectionRoutes from './routes/inspection.routes';
import dashboardRoutes from './routes/dashboard.routes';
import backupRoutes from './routes/backup.routes';
import reportRoutes from './routes/report.routes';
import { initBackupJob } from './jobs/backup.job';

// Init Jobs
initBackupJob();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/qap', qapRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'QA Project Management API is running' });
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access internally at http://localhost:${PORT}`);
});
