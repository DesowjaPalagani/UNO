// Card Types
export type CardColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';
export type CardValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 'skip' | 'reverse' | 'drawTwo' | 'wildFill' | 'wildDrawFour';

export interface Card {
    id: string;
    color: CardColor;
    value: CardValue;
}

// Player Types
export interface Player {
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    hand: Card[];
    cardsCount: number;
    hasSaidUno: boolean;
    position: number;
    score: number;
    isBot?: boolean;
}

export interface GamePlayer extends Player {
    joinedAt: Date;
}

// Game Types
export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
export type Direction = 'clockwise' | 'counterclockwise';

export interface GameState {
    id: string;
    code: string;
    name: string;
    status: GameStatus;
    hostId: string;
    players: Player[];
    maxPlayers: number;
    minPlayers: number;
    isPublic: boolean;
    currentPlayerIndex: number;
    direction: Direction;
    deck: Card[];
    discardPile: Card[];
    currentCard: Card | null;
    drawCount: number;
    isGameOver: boolean;
    winner?: Player;
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
}

export interface GameAction {
    type: 'PLAY_CARD' | 'DRAW_CARD' | 'UNO' | 'CHALLENGE';
    playerId: string;
    card?: Card;
    selectedColor?: CardColor;
    timestamp: Date;
}

// Socket Events
export interface SocketMessage {
    event: string;
    data: any;
}

export interface JoinGameRequest {
    gameId: string;
    userId: string;
    username: string;
    avatar?: string;
}

export interface PlayCardRequest {
    gameId: string;
    playerId: string;
    card: Card;
    selectedColor?: CardColor;
}

export interface DrawCardRequest {
    gameId: string;
    playerId: string;
}

export interface UnoRequest {
    gameId: string;
    playerId: string;
}

export interface CreateGameRequest {
    name: string;
    isPublic: boolean;
    maxPlayers: number;
    userId: string;
    username: string;
}

// Error Types
export interface GameError {
    code: string;
    message: string;
    statusCode: number;
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    username: string;
}

export interface AuthToken {
    accessToken: string;
    refreshToken?: string;
    user: {
        id: string;
        email: string;
        username: string;
    };
}

// Redis Keys
export const REDIS_KEYS = {
    GAME: (gameId: string) => `game:${gameId}`,
    GAME_STATE: (gameId: string) => `game:state:${gameId}`,
    ACTIVE_GAMES: 'games:active',
    PUBLIC_GAMES: 'games:public',
    PLAYER_GAMES: (playerId: string) => `player:${playerId}:games`,
} as const;