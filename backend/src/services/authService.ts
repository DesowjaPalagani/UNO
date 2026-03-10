import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prismaService';
import { LoginCredentials, RegisterCredentials, AuthToken } from '../types';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    async register(credentials: RegisterCredentials): Promise<AuthToken> {
        const { email, username, password } = credentials;

        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            throw new BadRequestException('Email or username already in use');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
            },
        });

        // Create game statistics record
        await this.prisma.gameStatistic.create({
            data: {
                userId: user.id,
            },
        });

        return this.generateToken(user);
    }

    async login(credentials: LoginCredentials): Promise<AuthToken> {
        const { email, password } = credentials;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return this.generateToken(user);
    }

    async validateToken(token: string): Promise<any> {
        try {
            return this.jwt.verify(token);
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    private async generateToken(user: any): Promise<AuthToken> {
        const payload = {
            sub: user.id,
            email: user.email,
            username: user.username,
        };

        const accessToken = this.jwt.sign(payload, {
            expiresIn: process.env.JWT_EXPIRATION || '24h',
        });

        return {
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }
}