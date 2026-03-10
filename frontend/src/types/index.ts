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

// User Types
export interface User {
    id: string;
    email: string;
    username: string;
    avatar?: string;
}

export interface AuthToken {
    accessToken: string;
    user: User;
}

// Chat Types
export interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: Date;
}

// Game Events
export interface GameEvent {
    type: 'join' | 'leave' | 'play' | 'draw' | 'uno' | 'message' | 'start' | 'end';
    playerId: string;
    username: string;
    data?: any;
}
