import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import 'dotenv/config';
import { PrismaService } from './services/prismaService';
import { RedisService } from './services/redisService';
import { GameService } from './services/gameService';
import { SocketService } from './services/socketService';
import { AuthService } from './services/authService';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
        }),
    ],
    providers: [PrismaService, RedisService, GameService, SocketService, AuthService],
    exports: [PrismaService, RedisService, GameService, SocketService, AuthService, JwtModule],
})
export class AppModule {}
