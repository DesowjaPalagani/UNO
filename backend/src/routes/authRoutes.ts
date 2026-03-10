import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { LoginCredentials, RegisterCredentials } from '../types';
import { verifyToken } from '../middleware/authMiddleware';

const createAuthRoutes = (authService: AuthService) => {
    const router = Router();

    // Register
    router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const credentials: RegisterCredentials = req.body;
            const token = await authService.register(credentials);
            res.status(201).json(token);
        } catch (error) {
            next(error);
        }
    });

    // Login
    router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const credentials: LoginCredentials = req.body;
            const token = await authService.login(credentials);
            res.json(token);
        } catch (error) {
            next(error);
        }
    });

    // Validate token
    router.post('/validate', verifyToken, async (req: Request & { userId?: string }, res: Response) => {
        res.json({
            valid: true,
            userId: req.userId,
        });
    });

    return router;
};

export default createAuthRoutes;
