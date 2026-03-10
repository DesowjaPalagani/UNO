import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from './gameService';
import { RedisService } from './redisService';
import { JoinGameRequest, PlayCardRequest, DrawCardRequest, UnoRequest } from '../types';

@Injectable()
export class SocketService {
    private io!: Server;
    private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

    constructor(
        private gameService: GameService,
        private redis: RedisService,
    ) {}

    setIOServer(io: Server) {
        this.io = io;
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket: Socket) => {
            console.log('User connected:', socket.id);

            // User joined
            socket.on('join_game', async (data: JoinGameRequest, callback) => {
                try {
                    this.connectedUsers.set(socket.id, data.userId);

                    // Join socket room
                    socket.join(`game:${data.gameId}`);

                    // Update game state
                    const gameState = await this.gameService.joinGame(
                        data.gameId,
                        data.userId,
                        data.username,
                        data.avatar,
                    );

                    // Broadcast to all players in room
                    this.io.to(`game:${data.gameId}`).emit('game_updated', gameState);
                    this.io.to(`game:${data.gameId}`).emit('player_joined', {
                        username: data.username,
                        playerCount: gameState.players.length,
                    });

                    callback({ success: true, gameState });
                } catch (error: any) {
                    callback({ success: false, error: error.message });
                }
            });

            // Start game
            socket.on('start_game', async (data: { gameId: string }, callback) => {
                try {
                    const gameState = await this.gameService.startGame(data.gameId);
                    this.io.to(`game:${data.gameId}`).emit('game_started', gameState);
                    callback({ success: true, gameState });
                } catch (error: any) {
                    callback({ success: false, error: error.message });
                }
            });

            // Play card
            socket.on('play_card', async (data: PlayCardRequest, callback) => {
                try {
                    const gameState = await this.gameService.playCard(data);
                    this.io.to(`game:${data.gameId}`).emit('game_updated', gameState);
                    this.io.to(`game:${data.gameId}`).emit('card_played', {
                        playerId: data.playerId,
                        card: data.card,
                        currentPlayerIndex: gameState.currentPlayerIndex,
                    });
                    callback({ success: true, gameState });
                } catch (error: any) {
                    callback({ success: false, error: error.message });
                }
            });

            // Draw card
            socket.on('draw_card', async (data: DrawCardRequest, callback) => {
                try {
                    const gameState = await this.gameService.drawCard(data);
                    this.io.to(`game:${data.gameId}`).emit('game_updated', gameState);
                    callback({ success: true, gameState });
                } catch (error: any) {
                    callback({ success: false, error: error.message });
                }
            });

            // Declare UNO
            socket.on('declare_uno', async (data: UnoRequest, callback) => {
                try {
                    const gameState = await this.gameService.declarUno(data);
                    this.io.to(`game:${data.gameId}`).emit('game_updated', gameState);
                    this.io.to(`game:${data.gameId}`).emit('uno_declared', {
                        playerId: data.playerId,
                    });
                    callback({ success: true, gameState });
                } catch (error: any) {
                    callback({ success: false, error: error.message });
                }
            });

            // Send message
            socket.on('send_message', (data: { gameId: string; message: string; username: string }, callback) => {
                this.io.to(`game:${data.gameId}`).emit('message_received', {
                    username: data.username,
                    message: data.message,
                    timestamp: new Date(),
                });
                callback({ success: true });
            });

            // Disconnect
            socket.on('disconnect', () => {
                const userId = this.connectedUsers.get(socket.id);
                this.connectedUsers.delete(socket.id);
                console.log('User disconnected:', socket.id, 'userId:', userId);
            });
        });
    }

    broadcastGameUpdate(gameId: string, event: string, data: any) {
        this.io.to(`game:${gameId}`).emit(event, data);
    }

    notifyPlayer(userId: string, event: string, data: any) {
        // Find socket for user
        for (const [socketId, connectedUserId] of this.connectedUsers) {
            if (connectedUserId === userId) {
                this.io.to(socketId).emit(event, data);
            }
        }
    }
}