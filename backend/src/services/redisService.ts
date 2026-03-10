import { Injectable } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
    private client: RedisClientType;
    private isConnected: boolean = false;

    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.client.on('error', (error: any) => {
            console.error('Redis Client Error', error);
        });

        this.connect();
    }

    private async connect() {
        try {
            await this.client.connect();
            this.isConnected = true;
            console.log('Redis connected');
        } catch (error) {
            console.error('Failed to connect to Redis:', error);
        }
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (!this.isConnected) return;
        try {
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            } else {
                await this.client.set(key, value);
            }
        } catch (error) {
            console.error('Redis set error:', error);
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }

    async delete(key: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis delete error:', error);
        }
    }

    async addToSet(key: string, value: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.sAdd(key, value);
        } catch (error) {
            console.error('Redis sAdd error:', error);
        }
    }

    async removeFromSet(key: string, value: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.sRem(key, value);
        } catch (error) {
            console.error('Redis sRem error:', error);
        }
    }

    async getSet(key: string): Promise<string[]> {
        if (!this.isConnected) return [];
        try {
            return await this.client.sMembers(key);
        } catch (error) {
            console.error('Redis sMembers error:', error);
            return [];
        }
    }

    async exists(key: string): Promise<boolean> {
        if (!this.isConnected) return false;
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}