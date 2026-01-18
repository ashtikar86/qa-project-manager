"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files (uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const qap_routes_1 = __importDefault(require("./routes/qap.routes"));
const inspection_routes_1 = __importDefault(require("./routes/inspection.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const backup_routes_1 = __importDefault(require("./routes/backup.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const backup_job_1 = require("./jobs/backup.job");
// Init Jobs
(0, backup_job_1.initBackupJob)();
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/qap', qap_routes_1.default);
app.use('/api/inspections', inspection_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/backups', backup_routes_1.default);
app.use('/api/reports', report_routes_1.default);
app.get('/', (req, res) => {
    res.json({ message: 'QA Project Management API is running' });
});
// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access internally at http://localhost:${PORT}`);
});
