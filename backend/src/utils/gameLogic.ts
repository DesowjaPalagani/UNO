import { Card, CardColor, CardValue, Player, GameState, Direction } from '../types';
import { v4 as uuidv4 } from 'uuid';

const COLORS: CardColor[] = ['red', 'green', 'blue', 'yellow'];
const NUMBER_VALUES: CardValue[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ACTION_VALUES: CardValue[] = ['skip', 'reverse', 'drawTwo'];
const WILD_VALUES: CardValue[] = ['wildFill', 'wildDrawFour'];

/**
 * Create a complete UNO deck with all cards
 */
export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    let cardId = 0;

    // Number cards (0-9) and action cards (skip, reverse, drawTwo)
    COLORS.forEach(color => {
        // 0 appears once per color
        deck.push({ id: `card_${cardId++}`, color, value: 0 });

        // 1-9 and action cards appear twice per color
        NUMBER_VALUES.slice(1).forEach(value => {
            deck.push({ id: `card_${cardId++}`, color, value });
            deck.push({ id: `card_${cardId++}`, color, value });
        });

        ACTION_VALUES.forEach(value => {
            deck.push({ id: `card_${cardId++}`, color, value });
            deck.push({ id: `card_${cardId++}`, color, value });
        });
    });

    // Wild cards (appear 4 times each)
    for (let i = 0; i < 4; i++) {
        deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'wildFill' });
        deck.push({ id: `card_${cardId++}`, color: 'wild', value: 'wildDrawFour' });
    }

    return shuffleDeck(deck);
};

/**
 * Shuffle deck using Fisher-Yates algorithm
 */
export const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

/**
 * Check if a card can be played on top of another card
 */
export const isValidMove = (playCard: Card, topCard: Card | null, selectedColor?: CardColor): boolean => {
    if (!topCard) return true;

    if (playCard.value === ('wildFill' as CardValue) || playCard.value === ('wildDrawFour' as CardValue)) {
        return true;
    }

    if (playCard.color === 'wild') {
        return true;
    }

    // If a wild card was played, check against selected color
    if (topCard.color === 'wild' && selectedColor) {
        return playCard.color === selectedColor || playCard.value === ('wildFill' as CardValue) || playCard.value === ('wildDrawFour' as CardValue);
    }

    return playCard.color === topCard.color || playCard.value === topCard.value;
};

/**
 * Get playable cards from a player's hand
 */
export const getPlayableCards = (hand: Card[], topCard: Card | null, selectedColor?: CardColor): Card[] => {
    return hand.filter(card => isValidMove(card, topCard, selectedColor));
};

/**
 * Draw cards from deck
 */
export const drawCards = (deck: Card[], count: number): { cards: Card[]; remainingDeck: Card[] } => {
    const drawn: Card[] = [];
    const remaining = [...deck];

    for (let i = 0; i < count && remaining.length > 0; i++) {
        const card = remaining.pop();
        if (card) drawn.push(card);
    }

    return { cards: drawn, remainingDeck: remaining };
};

/**
 * Deal initial hand to players
 */
export const dealInitialHands = (numPlayers: number): { hands: Card[][]; deck: Card[] } => {
    const deck = createDeck();
    const hands: Card[][] = [];

    for (let i = 0; i < numPlayers; i++) {
        hands.push([]);
    }

    // Deal 7 cards to each player
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < numPlayers; j++) {
            const card = deck.pop();
            if (card) hands[j].push(card);
        }
    }

    return { hands, deck };
};

/**
 * Get the next player index
 */
export const getNextPlayerIndex = (
    currentIndex: number,
    totalPlayers: number,
    direction: Direction = 'clockwise',
    skipCount: number = 1
): number => {
    let nextIndex = currentIndex;

    if (direction === 'clockwise') {
        nextIndex = (currentIndex + skipCount) % totalPlayers;
    } else {
        nextIndex = (currentIndex - skipCount + totalPlayers * Math.abs(skipCount)) % totalPlayers;
    }

    return nextIndex;
};

/**
 * Get the effect of playing a card
 */
export const getCardEffect = (
    card: Card,
    currentPlayerIndex: number,
    totalPlayers: number,
    direction: Direction
): {
    nextPlayerIndex: number;
    drawCount: number;
    newDirection: Direction;
    requiresColorSelection: boolean;
} => {
    let nextPlayerIndex = currentPlayerIndex;
    let drawCount = 0;
    let newDirection = direction;
    let requiresColorSelection = false;

    if (card.value === 'skip') {
        nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, direction, 2);
    } else if (card.value === 'reverse') {
        newDirection = direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        // In 2-player games, reverse acts like skip
        if (totalPlayers === 2) {
            nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, newDirection, 1);
        } else {
            nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, newDirection, 1);
        }
    } else if (card.value === 'drawTwo') {
        nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, direction, 1);
        drawCount = 2;
    } else if (card.value === 'wildDrawFour') {
        nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, direction, 1);
        drawCount = 4;
        requiresColorSelection = true;
    } else if (card.value === 'wildFill') {
        requiresColorSelection = true;
        nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, direction, 1);
    } else {
        nextPlayerIndex = getNextPlayerIndex(currentPlayerIndex, totalPlayers, direction, 1);
    }

    return { nextPlayerIndex, drawCount, newDirection, requiresColorSelection };
};

/**
 * Check if a player has won
 */
export const hasPlayerWon = (hand: Card[]): boolean => {
    return hand.length === 0;
};

/**
 * Calculate score for finished game
 */
export const calculateScore = (remainingCards: Card[]): number => {
    let score = 0;

    remainingCards.forEach(card => {
        if (typeof card.value === 'number') {
            score += card.value;
        } else if (card.value === 'skip' || card.value === 'reverse' || card.value === 'drawTwo') {
            score += 20;
        } else if (card.value === 'wildFill' || card.value === 'wildDrawFour') {
            score += 50;
        }
    });

    return score;
};

/**
 * Check if player should have said UNO
 */
export const shouldHaveSaidUno = (handSize: number): boolean => {
    return handSize === 1;
};

/**
 * Apply UNO penalty (draw cards)
 */
export const applyUnoPenalty = (hand: Card[], deck: Card[]): { hand: Card[]; deck: Card[] } => {
    const { cards, remainingDeck } = drawCards(deck, 2);
    return {
        hand: [...hand, ...cards],
        deck: remainingDeck,
    };
};

/**
 * Validate if game can start
 */
export const canGameStart = (playerCount: number, minPlayers: number = 2, maxPlayers: number = 10): boolean => {
    return playerCount >= minPlayers && playerCount <= maxPlayers;
};

/**
 * Re-seed deck if it runs out
 */
export const reseedDeck = (deck: Card[], discardPile: Card[]): Card[] => {
    if (deck.length > 0) return deck;

    if (discardPile.length <= 1) {
        return createDeck();
    }

    const topCard = discardPile[discardPile.length - 1];
    const newDeck = shuffleDeck([...discardPile.slice(0, -1)]);
    return newDeck;
};