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
exports.deleteBankItem = exports.getBankItems = exports.uploadToBank = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadToBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, title } = req.body;
        const file = req.file;
        const user = req.user;
        if (!file || !category || !title) {
            return res.status(400).json({ message: 'Missing file, category, or title' });
        }
        const rootBankDir = path_1.default.join(__dirname, '../../uploads/knowledge_bank');
        if (!fs_1.default.existsSync(rootBankDir)) {
            console.log(`Creating root bank directory: ${rootBankDir}`);
            fs_1.default.mkdirSync(rootBankDir, { recursive: true });
        }
        const bankDir = path_1.default.join(rootBankDir, category.toLowerCase());
        if (!fs_1.default.existsSync(bankDir)) {
            console.log(`Creating category directory: ${bankDir}`);
            fs_1.default.mkdirSync(bankDir, { recursive: true });
        }
        const safeFilename = `${Date.now()}_${file.originalname}`;
        const finalPath = path_1.default.join(bankDir, safeFilename);
        // Ensure source path is absolute
        const sourcePath = path_1.default.isAbsolute(file.path) ? file.path : path_1.default.join(process.cwd(), file.path);
        console.log(`Moving file from ${sourcePath} to ${finalPath}`);
        try {
            if (!fs_1.default.existsSync(sourcePath)) {
                throw new Error(`Source file not found at ${sourcePath}`);
            }
            fs_1.default.copyFileSync(sourcePath, finalPath);
            fs_1.default.unlinkSync(sourcePath);
        }
        catch (fileErr) {
            console.error('File operation failed:', fileErr);
            throw new Error(`Failed to move file to storage: ${fileErr.message || fileErr}`);
        }
        const relativePath = `uploads/knowledge_bank/${category.toLowerCase()}/${safeFilename}`;
        console.log(`Saving document to DB with path: ${relativePath}`);
        const item = yield client_1.default.knowledgeBankItem.create({
            data: {
                category,
                title,
                filename: safeFilename,
                originalName: file.originalname,
                path: relativePath,
                uploadedBy: user.id
            },
            include: {
                uploader: { select: { name: true } }
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        console.error('Error uploading to knowledge bank:', error);
        res.status(500).json({ message: 'Error uploading to knowledge bank', error });
    }
});
exports.uploadToBank = uploadToBank;
const getBankItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.query;
        const whereClause = category ? { category: String(category) } : {};
        const items = yield client_1.default.knowledgeBankItem.findMany({
            where: whereClause,
            include: {
                uploader: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching knowledge bank items', error });
    }
});
exports.getBankItems = getBankItems;
const deleteBankItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield client_1.default.knowledgeBankItem.findUnique({ where: { id: Number(id) } });
        if (!item)
            return res.status(404).json({ message: 'Item not found' });
        const fullPath = path_1.default.join(__dirname, '../../', item.path);
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
        }
        yield client_1.default.knowledgeBankItem.delete({ where: { id: Number(id) } });
        res.json({ message: 'Item deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting item', error });
    }
});
exports.deleteBankItem = deleteBankItem;
