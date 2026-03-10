import { Router, Request, Response, NextFunction } from 'express';
import { PrismaService } from '../services/prismaService';
import { verifyToken } from '../middleware/authMiddleware';

const createPlayerRoutes = (prisma: PrismaService) => {
    const router = Router();

    // Get player profile
    router.get('/me', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId },
                include: { statistics: true },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                statistics: user.statistics,
            });
        } catch (error) {
            next(error);
        }
    });

    // Get player by ID
    router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.params.userId },
                include: { statistics: true },
            });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                id: user.id,
                username: user.username,
                avatar: user.avatar,
                statistics: user.statistics,
            });
        } catch (error) {
            next(error);
        }
    });

    // Update player profile
    router.put('/me', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            const { username, avatar } = req.body;

            const user = await prisma.user.update({
                where: { id: req.userId },
                data: {
                    username: username || undefined,
                    avatar: avatar || undefined,
                },
                include: { statistics: true },
            });

            res.json({
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                statistics: user.statistics,
            });
        } catch (error) {
            next(error);
        }
    });

    // Get leaderboard
    router.get('/leaderboard/top', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const stats = await prisma.gameStatistic.findMany({
                include: { user: true },
                orderBy: { wins: 'desc' },
                take: limit,
            });

            const leaderboard = stats.map((stat: any) => ({
                rank: stats.indexOf(stat) + 1,
                username: stat.user.username,
                wins: stat.wins,
                totalGames: stat.totalGames,
                winRate: stat.winRate,
            }));

            res.json(leaderboard);
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default createPlayerRoutes;
