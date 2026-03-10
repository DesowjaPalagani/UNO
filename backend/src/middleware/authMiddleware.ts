import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            username?: string;
        }
    }
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.sub;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
