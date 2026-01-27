import { Request, Response } from 'express';
import prisma from '../prisma/client';
import path from 'path';
import fs from 'fs';

interface AuthRequest extends Request {
    user?: any;
}

export const uploadToBank = async (req: Request, res: Response) => {
    try {
        const { category, title } = req.body;
        const file = req.file;
        const user = (req as AuthRequest).user;

        if (!file || !category || !title) {
            return res.status(400).json({ message: 'Missing file, category, or title' });
        }

        const rootBankDir = path.join(__dirname, '../../uploads/knowledge_bank');
        if (!fs.existsSync(rootBankDir)) {
            console.log(`Creating root bank directory: ${rootBankDir}`);
            fs.mkdirSync(rootBankDir, { recursive: true });
        }

        const bankDir = path.join(rootBankDir, category.toLowerCase());
        if (!fs.existsSync(bankDir)) {
            console.log(`Creating category directory: ${bankDir}`);
            fs.mkdirSync(bankDir, { recursive: true });
        }

        const safeFilename = `${Date.now()}_${file.originalname}`;
        const finalPath = path.join(bankDir, safeFilename);

        // Ensure source path is absolute
        const sourcePath = path.isAbsolute(file.path) ? file.path : path.join(process.cwd(), file.path);

        console.log(`Moving file from ${sourcePath} to ${finalPath}`);
        try {
            if (!fs.existsSync(sourcePath)) {
                throw new Error(`Source file not found at ${sourcePath}`);
            }
            fs.copyFileSync(sourcePath, finalPath);
            fs.unlinkSync(sourcePath);
        } catch (fileErr: any) {
            console.error('File operation failed:', fileErr);
            throw new Error(`Failed to move file to storage: ${fileErr.message || fileErr}`);
        }

        const relativePath = `uploads/knowledge_bank/${category.toLowerCase()}/${safeFilename}`;
        console.log(`Saving document to DB with path: ${relativePath}`);

        const item = await prisma.knowledgeBankItem.create({
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
    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error uploading to knowledge bank:', error);
        res.status(500).json({ message: 'Error uploading to knowledge bank', error });
    }
};

export const getBankItems = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const whereClause = category ? { category: String(category) } : {};

        const items = await prisma.knowledgeBankItem.findMany({
            where: whereClause,
            include: {
                uploader: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching knowledge bank items', error });
    }
};

export const deleteBankItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const item = await prisma.knowledgeBankItem.findUnique({ where: { id: Number(id) } });

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const fullPath = path.join(__dirname, '../../', item.path);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        await prisma.knowledgeBankItem.delete({ where: { id: Number(id) } });
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error });
    }
};
