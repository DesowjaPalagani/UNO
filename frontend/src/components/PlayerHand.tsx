'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { Card as CardType } from '../types';
import clsx from 'clsx';

interface PlayerHandProps {
  cards: CardType[];
  isMyTurn: boolean;
  canPlayCards: CardType[];
  onCardSelect: (card: CardType) => void;
  selectedCard: CardType | null;
  className?: string;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  isMyTurn,
  canPlayCards,
  onCardSelect,
  selectedCard,
  className = '',
}) => {
  const isCardPlayable = (card: CardType) =>
    canPlayCards.some((c) => c.id === card.id);

  return (
    <motion.div
      className={clsx(
        'player-hand flex flex-wrap gap-1 justify-center items-end',
        'max-w-6xl m-auto py-4 px-4',
        className
      )}
      layout
    >
      <AnimatePresence>
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            layoutId={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.02 }}
          >
            <Card
              card={card}
              isSelected={selectedCard?.id === card.id}
              isPlayable={isMyTurn && isCardPlayable(card)}
              onClick={() => isMyTurn && isCardPlayable(card) && onCardSelect(card)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default PlayerHand;