'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card as CardType } from '../types';
import clsx from 'clsx';

interface CardProps {
  card?: CardType;
  color?: string;
  value?: string | number;
  onClick?: () => void;
  isSelected?: boolean;
  isPlayable?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  card,
  color = card?.color,
  value = card?.value,
  onClick,
  isSelected = false,
  isPlayable = false,
  className = '',
}) => {
  const getColorClass = (cardColor: string) => {
    switch (cardColor) {
      case 'red': return 'bg-card-red';
      case 'blue': return 'bg-card-blue';
      case 'green': return 'bg-card-green';
      case 'yellow': return 'bg-card-yellow text-gray-900';
      case 'wild': return 'bg-gradient-to-br from-card-wild via-purple-600 to-pink-600';
      default: return 'bg-gray-500';
    }
  };

  const getValueLabel = (val: string | number) => {
    if (typeof val === 'number') return val.toString();
    switch (val) {
      case 'skip': return '⊘';
      case 'reverse': return '↻';
      case 'drawTwo': return '+2';
      case 'wildFill': return 'WILD';
      case 'wildDrawFour': return '+4 W';
      default: return val;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: isPlayable ? 1.1 : 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={isPlayable ? onClick : undefined}
      className={clsx(
        'uno-card flex flex-col items-center justify-center font-bold text-xl',
        'rounded-lg shadow-lg w-20 h-28',
        'relative cursor-pointer transition-all',
        getColorClass(color as string),
        isSelected && 'ring-4 ring-yellow-300 transform -translate-y-2',
        !isPlayable && 'opacity-50 cursor-not-allowed hover:scale-100',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="font-bold text-center text-lg">{getValueLabel(value as string | number)}</span>
    </motion.div>
  );
};

export default Card;