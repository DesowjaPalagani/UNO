import { Router, Request, Response, NextFunction } from 'express';
import { GameService } from '../services/gameService';
import { verifyToken } from '../middleware/authMiddleware';

const createGameRoutes = (gameService: GameService) => {
    const router = Router();

    // Create a new game
    router.post('/', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            const { name, isPublic = true, maxPlayers = 10 } = req.body;
            if (!req.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const gameState = await gameService.createGame({
                name,
                isPublic,
                maxPlayers,
                userId: req.userId,
                username: (req as any).username,
            });
            res.status(201).json(gameState);
        } catch (error) {
            next(error);
        }
    });

    // Get game by ID
    router.get('/:gameId', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const gameState = await gameService.getGameState(req.params.gameId);
            res.json(gameState);
        } catch (error) {
            next(error);
        }
    });

    // Get game by code
    router.get('/code/:code', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const gameState = await gameService.getGameByCode(req.params.code);
            res.json(gameState);
        } catch (error) {
            next(error);
        }
    });

    // List public games for matchmaking
    router.get('/', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const limit = parseInt(req.query.limit as string) || 20;
            const games = await gameService.listPublicGames(limit);
            res.json(games);
        } catch (error) {
            next(error);
        }
    });

    // Get player's games
    router.get('/player/:userId', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            const games = await gameService.getPlayerGames(req.params.userId);
            res.json(games);
        } catch (error) {
            next(error);
        }
    });

    // Join a game
    router.post('/:gameId/join', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const gameState = await gameService.joinGame(
                req.params.gameId,
                req.userId,
                (req as any).username,
                req.body.avatar,
            );
            res.json(gameState);
        } catch (error) {
            next(error);
        }
    });

    // Start a game
    router.post('/:gameId/start', verifyToken, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const gameState = await gameService.startGame(req.params.gameId);
            res.json(gameState);
        } catch (error) {
            next(error);
        }
    });

    // Leave a game
    router.post('/:gameId/leave', verifyToken, async (req: Request & { userId?: string }, res: Response, next: NextFunction) => {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            await gameService.leaveGame(req.params.gameId, req.userId);
            res.json({ success: true });
        } catch (error) {
            next(error);
        }
    });

    return router;
};

export default createGameRoutes;
