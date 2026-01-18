import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import prisma from '../prisma/client';

interface AuthRequest extends Request {
    user?: User;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as { id: number };
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });

        if (!user || !user.isActive) {
            return res.status(403).json({ message: 'Invalid token or inactive user.' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid token.' });
    }
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};
