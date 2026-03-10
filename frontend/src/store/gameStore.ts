import { create } from 'zustand';
import { GameState, User, Card } from '../types';

interface GameStore {
    // Authentication
    user: User | null;
    token: string | null;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;

    // Game State
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;

    // UI State
    selectedCard: Card | null;
    setSelectedCard: (card: Card | null) => void;
    showColorPicker: boolean;
    setShowColorPicker: (show: boolean) => void;
    selectedColor: string | null;
    setSelectedColor: (color: string | null) => void;

    // Messages
    messages: Array<{ username: string; message: string; timestamp: Date }>;
    addMessage: (username: string, message: string) => void;

    // Gameplay
    isMyTurn: () => boolean;
    getMyHand: () => Card[];
    canPlayCard: (card: Card) => boolean;
    getPlayableCards: () => Card[];

    // Reset
    reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    user: null,
    token: null,
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),

    gameState: null,
    setGameState: (state) => set({ gameState: state }),

    selectedCard: null,
    setSelectedCard: (card) => set({ selectedCard: card }),
    showColorPicker: false,
    setShowColorPicker: (show) => set({ showColorPicker: show }),
    selectedColor: null,
    setSelectedColor: (color) => set({ selectedColor: color }),

    messages: [],
    addMessage: (username, message) =>
        set((state) => ({
            messages: [...state.messages, { username, message, timestamp: new Date() }],
        })),

    isMyTurn: () => {
        const { gameState, user } = get();
        if (!gameState || !user) return false;
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        return currentPlayer?.userId === user.id;
    },

    getMyHand: () => {
        const { gameState, user } = get();
        if (!gameState || !user) return [];
        const player = gameState.players.find((p) => p.userId === user.id);
        return player?.hand || [];
    },

    canPlayCard: (card: Card) => {
        const { gameState } = get();
        if (!gameState) return false;
        const topCard = gameState.currentCard;
        if (!topCard) return true;
        return (
            card.color === topCard.color ||
            card.value === topCard.value ||
            card.color === 'wild'
        );
    },

    getPlayableCards: () => {
        const hand = get().getMyHand();
        return hand.filter((card) => get().canPlayCard(card));
    },

    reset: () =>
        set({
            user: null,
            token: null,
            gameState: null,
            selectedCard: null,
            showColorPicker: false,
            selectedColor: null,
            messages: [],
        }),
}));

export default useGameStore;
