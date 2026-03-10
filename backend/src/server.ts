import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import config from '../config';
import { PrismaService } from './services/prismaService';
import { RedisService } from './services/redisService';
import { GameService } from './services/gameService';
import { SocketService } from './services/socketService';
import { AuthService } from './services/authService';
import { JwtService } from '@nestjs/jwt';
import createAuthRoutes from './routes/authRoutes';
import createGameRoutes from './routes/gameRoutes';
import createPlayerRoutes from './routes/playerRoutes';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
});

// Middleware
app.use(cors({
    origin: config.frontend.url,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
const prisma = new PrismaService();
const redis = new RedisService();
const jwtService = new JwtService({
    secret: config.jwt.secret,
    signOptions: { expiresIn: config.jwt.expiresIn },
});
const authService = new AuthService(prisma, jwtService);
const gameService = new GameService(prisma, redis);
const socketService = new SocketService(gameService, redis);

// Set IO server for socket service
socketService.setIOServer(io);

// Routes
app.use('/api/auth', createAuthRoutes(authService));
app.use('/api/games', createGameRoutes(gameService));
app.use('/api/players', createPlayerRoutes(prisma));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`\n🎮 UNO Game Platform Server`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'local'}`);
    console.log(`🔴 Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(async () => {
        console.log('HTTP server closed');
        await prisma.$disconnect();
        await redis.disconnect();
        process.exit(0);
    });
});

export default server;

