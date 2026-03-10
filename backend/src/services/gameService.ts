import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from './prismaService';
import { RedisService } from './redisService';
import {
    Card,
    GameState,
    GameStatus,
    Player,
    CardColor,
    CreateGameRequest,
    PlayCardRequest,
    DrawCardRequest,
    UnoRequest,
} from '../types';
import {
    createDeck,
    dealInitialHands,
    isValidMove,
    getCardEffect,
    hasPlayerWon,
    calculateScore,
    shouldHaveSaidUno,
    applyUnoPenalty,
    drawCards,
    reseedDeck,
    getPlayableCards,
} from '../utils/gameLogic';

@Injectable()
export class GameService {
    constructor(
        private prisma: PrismaService,
        private redis: RedisService,
    ) {}

    /**
     * Create a new game
     */
    async createGame(request: CreateGameRequest): Promise<GameState> {
        const gameId = uuidv4();
        const code = this.generateGameCode();

        const game = await this.prisma.game.create({
            data: {
                id: gameId,
                code,
                name: request.name,
                hostId: request.userId,
                isPublic: request.isPublic,
                maxPlayers: request.maxPlayers,
                status: 'WAITING' as any,
            },
        });

        // Add host as first player
        await this.prisma.gamePlayer.create({
            data: {
                gameId: gameId,
                userId: request.userId,
                hand: JSON.stringify([]),
                position: 0,
                cardsCount: 0,
            },
        });

        const gameState = await this.initializeGameState(gameId);

        // Cache game state in Redis
        await this.redis.set(`game:${gameId}`, JSON.stringify(gameState));
        await this.redis.addToSet('games:active', gameId);
        if (request.isPublic) {
            await this.redis.addToSet('games:public', gameId);
        }

        return gameState;
    }

    /**
     * Join an existing game
     */
    async joinGame(gameId: string, userId: string, username: string, avatar?: string): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        if (game.status !== 'WAITING') {
            throw new BadRequestException('Game has already started');
        }

        if (game.players.length >= game.maxPlayers) {
            throw new BadRequestException('Game is full');
        }

        // Check if player is already in game
        const existingPlayer = game.players.find((p: any) => p.userId === userId);
        if (existingPlayer) {
            return this.getGameState(gameId);
        }

        // Add player to game
        const position = game.players.length;
        await this.prisma.gamePlayer.create({
            data: {
                gameId: gameId,
                userId: userId,
                hand: JSON.stringify([]),
                position,
                cardsCount: 0,
            },
        });

        // Update user record if needed
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                username: username,
                avatar: avatar || undefined,
            },
        });

        return this.getGameState(gameId);
    }

    /**
     * Start a game
     */
    async startGame(gameId: string): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: { include: { user: true } } },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        if (game.players.length < game.minPlayers) {
            throw new BadRequestException('Not enough players to start game');
        }

        // Deal initial hands
        const { hands, deck } = dealInitialHands(game.players.length);

        // Get first card from deck
        const firstCard = deck.pop()!;
        const discardPile = [firstCard];

        // Update game status
        const now = new Date();
        await this.prisma.game.update({
            where: { id: gameId },
            data: {
                status: 'IN_PROGRESS',
                startedAt: now,
                deck: JSON.stringify(deck),
                discardPile: JSON.stringify(discardPile),
                currentPlayerIndex: 0,
            },
        });

        // Update player hands
        for (let i = 0; i < game.players.length; i++) {
            await this.prisma.gamePlayer.update({
                where: { id: game.players[i].id },
                data: {
                    hand: JSON.stringify(hands[i]),
                    cardsCount: hands[i].length,
                },
            });
        }

        return this.getGameState(gameId);
    }

    /**
     * Play a card
     */
    async playCard(request: PlayCardRequest): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: request.gameId },
            include: { players: true },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        if (game.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Game is not in progress');
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== request.playerId) {
            throw new BadRequestException('It is not your turn');
        }

        const hand = JSON.parse(currentPlayer.hand) as Card[];
        const discardPile = JSON.parse(game.discardPile || '[]') as Card[];
        const topCard = discardPile[discardPile.length - 1] || null;

        // Validate move
        const selectedColor = request.selectedColor;
        if (!isValidMove(request.card, topCard, selectedColor)) {
            throw new BadRequestException('Invalid card play');
        }

        // Check if card is in player's hand
        const cardIndex = hand.findIndex(c => c.id === request.card.id);
        if (cardIndex === -1) {
            throw new BadRequestException('Card not in player hand');
        }

        // Remove card from hand
        const playedCard = hand.splice(cardIndex, 1)[0];
        const newDiscardPile = [...discardPile, playedCard];

        // Update deck state if needed
        let deck = JSON.parse(game.deck || JSON.stringify(createDeck())) as Card[];

        // Get card effect
        const cardEffect = getCardEffect(playedCard, game.currentPlayerIndex, game.players.length, game.direction as 'clockwise' | 'counterclockwise');

        let nextPlayerIndex = cardEffect.nextPlayerIndex;
        let drawCount = cardEffect.drawCount;
        let newDirection = cardEffect.newDirection;
        let isGameOver = false;
        let winner = undefined;

        // Update player hand
        await this.prisma.gamePlayer.update({
            where: { id: currentPlayer.id },
            data: {
                hand: JSON.stringify(hand),
                cardsCount: hand.length,
                hasSaidUno: hand.length === 1,
            },
        });

        // Check if player won
        if (hasPlayerWon(hand)) {
            isGameOver = true;
            winner = { ...game, ...currentPlayer };
            
            // Update game as finished
            await this.prisma.game.update({
                where: { id: request.gameId },
                data: {
                    status: 'FINISHED' as any,
                    endedAt: new Date(),
                    currentPlayerIndex: nextPlayerIndex,
                    direction: newDirection as any,
                },
            });

            // Update statistics
            await this.recordGameResult(request.gameId, request.playerId, true);
        } else {
            // Handle draw cards for next player
            if (drawCount > 0) {
                const nextPlayer = game.players[nextPlayerIndex];
                const nextPlayerHand = JSON.parse(nextPlayer.hand) as Card[];
                const { cards: drawnCards, remainingDeck } = drawCards(deck, drawCount);
                deck = remainingDeck;

                await this.prisma.gamePlayer.update({
                    where: { id: nextPlayer.id },
                    data: {
                        hand: JSON.stringify([...nextPlayerHand, ...drawnCards]),
                        cardsCount: nextPlayerHand.length + drawnCards.length,
                    },
                });

                // Skip the next player (they drew cards)
                nextPlayerIndex = nextPlayerIndex === 0 ? 1 : 0;
            }

            // Update game state
            await this.prisma.game.update({
                where: { id: request.gameId },
                data: {
                    deck: JSON.stringify(deck),
                    discardPile: JSON.stringify(newDiscardPile),
                    currentPlayerIndex: nextPlayerIndex,
                    direction: newDirection,
                },
            });
        }

        return this.getGameState(request.gameId);
    }

    /**
     * Draw a card
     */
    async drawCard(request: DrawCardRequest): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: request.gameId },
            include: { players: true },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const currentPlayer = game.players[game.currentPlayerIndex];
        if (currentPlayer.userId !== request.playerId) {
            throw new BadRequestException('It is not your turn');
        }

        const hand = JSON.parse(currentPlayer.hand) as Card[];
        let deck = JSON.parse(game.deck || JSON.stringify(createDeck())) as Card[];

        // Reseed deck if empty
        if (deck.length === 0) {
            const discardPile = JSON.parse(game.discardPile || '[]') as Card[];
            deck = reseedDeck(deck, discardPile);
        }

        const { cards: drawnCards, remainingDeck } = drawCards(deck, 1);

        // Update player hand
        await this.prisma.gamePlayer.update({
            where: { id: currentPlayer.id },
            data: {
                hand: JSON.stringify([...hand, ...drawnCards]),
                cardsCount: hand.length + drawnCards.length,
            },
        });

        // Update game
        const nextPlayerIndex = game.currentPlayerIndex === 0 ? 1 : 0;
        await this.prisma.game.update({
            where: { id: request.gameId },
            data: {
                deck: JSON.stringify(remainingDeck),
                currentPlayerIndex: nextPlayerIndex,
            },
        });

        return this.getGameState(request.gameId);
    }

    /**
     * Declare UNO
     */
    async declarUno(request: UnoRequest): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: request.gameId },
            include: { players: true },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const player = game.players.find((p: any) => p.userId === request.playerId);
        if (!player) {
            throw new NotFoundException('Player not found');
        }

        const hand = JSON.parse(player.hand) as Card[];

        if (hand.length !== 1) {
            throw new BadRequestException('Cannot declare UNO when hand size is not 1');
        }

        await this.prisma.gamePlayer.update({
            where: { id: player.id },
            data: { hasSaidUno: true },
        });

        return this.getGameState(request.gameId);
    }

    /**
     * Get current game state
     */
    async getGameState(gameId: string): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: { include: { user: true } } },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        const playersData = game.players.map((gp: any) => ({
            id: gp.id,
            userId: gp.userId,
            username: gp.user.username,
            avatar: gp.user.avatar,
            hand: JSON.parse(gp.hand) as Card[],
            cardsCount: gp.cardsCount,
            hasSaidUno: gp.hasSaidUno,
            position: gp.position,
            score: gp.score,
        }));

        return {
            id: game.id,
            code: game.code,
            name: game.name,
            status: game.status as GameStatus,
            hostId: game.hostId,
            players: playersData,
            maxPlayers: game.maxPlayers,
            minPlayers: game.minPlayers,
            isPublic: game.isPublic,
            currentPlayerIndex: game.currentPlayerIndex,
            direction: game.direction as 'clockwise' | 'counterclockwise',
            deck: JSON.parse(game.deck || '[]') as Card[],
            discardPile: JSON.parse(game.discardPile || '[]') as Card[],
            currentCard: (JSON.parse(game.discardPile || '[]') as Card[])[0] || null,
            drawCount: 0,
            isGameOver: game.status === 'FINISHED',
            createdAt: game.createdAt,
            startedAt: game.startedAt || undefined,
            endedAt: game.endedAt || undefined,
        };
    }

    /**
     * Get game by code
     */
    async getGameByCode(code: string): Promise<GameState> {
        const game = await this.prisma.game.findUnique({
            where: { code },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        return this.getGameState(game.id);
    }

    /**
     * List public games for matchmaking
     */
    async listPublicGames(limit: number = 20): Promise<GameState[]> {
        const games = await this.prisma.game.findMany({
            where: {
                isPublic: true,
                status: 'WAITING',
            },
            include: { players: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(games.map((game: any) => this.getGameState(game.id)));
    }

    /**
     * Get player's games
     */
    async getPlayerGames(userId: string): Promise<GameState[]> {
        const games = await this.prisma.game.findMany({
            where: {
                players: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: { players: true },
        });

        return Promise.all(games.map((game: any) => this.getGameState(game.id)));
    }

    /**
     * Leave a game
     */
    async leaveGame(gameId: string, userId: string): Promise<void> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: true },
        });

        if (!game) {
            throw new NotFoundException('Game not found');
        }

        // If game hasn't started, just remove the player
        if (game.status === 'WAITING') {
            await this.prisma.gamePlayer.deleteMany({
                where: {
                    gameId: gameId,
                    userId: userId,
                },
            });

            // If this was the last player, delete the game
            const remainingPlayers = await this.prisma.gamePlayer.count({
                where: { gameId: gameId },
            });

            if (remainingPlayers === 0) {
                await this.prisma.game.delete({ where: { id: gameId } });
                await this.redis.delete(`game:${gameId}`);
                await this.redis.removeFromSet('games:active', gameId);
                await this.redis.removeFromSet('games:public', gameId);
            }
        }
    }

    /**
     * Initialize game state
     */
    private async initializeGameState(gameId: string): Promise<GameState> {
        return this.getGameState(gameId);
    }

    /**
     * Generate unique game code
     */
    private generateGameCode(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Record game result for statistics
     */
    private async recordGameResult(gameId: string, winnerId: string, won: boolean): Promise<void> {
        const game = await this.prisma.game.findUnique({
            where: { id: gameId },
            include: { players: { include: { user: true } } },
        });

        if (!game) return;

        // Update statistics for all players
        for (const player of game.players) {
            const stats = await this.prisma.gameStatistic.findUnique({
                where: { userId: player.userId },
            });

            if (stats) {
                const isWinner = player.userId === winnerId;
                await this.prisma.gameStatistic.update({
                    where: { userId: player.userId },
                    data: {
                        totalGames: stats.totalGames + 1,
                        wins: isWinner ? stats.wins + 1 : stats.wins,
                        losses: isWinner ? stats.losses : stats.losses + 1,
                        winRate: ((isWinner ? stats.wins + 1 : stats.wins) / (stats.totalGames + 1)) * 100,
                    },
                });
            }
        }
    }
}