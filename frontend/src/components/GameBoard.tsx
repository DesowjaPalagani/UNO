'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GameState } from '../types';
import Card from './Card';
import clsx from 'clsx';

interface GameBoardProps {
  gameState: GameState;
  currentPlayerName: string;
  isMyTurn: boolean;
  onDrawCard?: () => void;
  className?: string;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerName,
  isMyTurn,
  onDrawCard,
  className = '',
}) => {
  const discardTopCard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className={clsx('game-board relative w-full flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-4', className)}>
      {/* Status Info */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-3 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-300">Players: {gameState.players.length}/{gameState.maxPlayers}</p>
        <p className="text-xs text-gray-300 mt-1">Direction: {gameState.direction}</p>
      </div>

      {/* Current Turn */}
      <motion.div
        className="absolute top-4 right-4 bg-black bg-opacity-50 p-3 rounded-lg text-center border border-gray-700"
        animate={isMyTurn ? { scale: [1, 1.05, 1] } : {}}
        transition={isMyTurn ? { duration: 1, repeat: Infinity } : {}}
      >
        <p className="text-xs text-gray-300">Current:</p>
        <p className={clsx('font-bold', isMyTurn ? 'text-green-400' : 'text-yellow-400')}>
          {currentPlayerName}
        </p>
        {isMyTurn && <p className="text-xs text-green-300 mt-1">🎮 Your Turn!</p>}
      </motion.div>

      {/* Cards Area */}
      <div className="flex gap-12 items-center justify-center">
        {/* Draw Pile */}
        <motion.div
          onClick={onDrawCard}
          whileHover={isMyTurn ? { scale: 1.1 } : {}}
          whileTap={isMyTurn ? { scale: 0.95 } : {}}
          className={clsx(
            'draw-pile w-20 h-28 border-2 border-dashed border-gray-400 rounded-lg',
            'flex items-center justify-center cursor-pointer',
            'hover:border-gray-300 transition-colors',
            !isMyTurn && 'opacity-50'
          )}
        >
          <div className="text-center">
            <p className="text-xs text-gray-400 font-semibold">DRAW</p>
            <p className="text-sm font-bold text-gray-300 mt-1">{gameState.deck.length}</p>
          </div>
        </motion.div>

        {/* Discard Pile */}
        <motion.div
          className="discard-pile relative w-20 h-28 flex items-center justify-center"
          initial={{ rotateZ: 0 }}
          animate={{ rotateZ: discardTopCard ? [0, 1, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {discardTopCard && <Card card={discardTopCard} isPlayable={false} />}
          {!discardTopCard && (
            <div className="text-center text-gray-400 text-sm font-semibold">DISCARD</div>
          )}
        </motion.div>
      </div>

      {/* Players List */}
      <motion.div className="absolute bottom-4 left-4 text-xs text-gray-400 max-h-40 overflow-y-auto bg-black bg-opacity-30 p-3 rounded-lg border border-gray-700">
        <p className="font-bold mb-2 text-gray-300">Players:</p>
        {gameState.players.map((player, index) => (
          <motion.div
            key={player.id}
            className={clsx(
              'p-1 mb-1 rounded text-xs',
              index === gameState.currentPlayerIndex 
                ? 'bg-yellow-900 bg-opacity-50 text-yellow-300 font-semibold' 
                : 'text-gray-400'
            )}
            animate={
              index === gameState.currentPlayerIndex 
                ? { backgroundColor: ['rgba(120, 53, 15, 0.5)', 'rgba(217, 119, 6, 0.7)', 'rgba(120, 53, 15, 0.5)'] }
                : {}
            }
            transition={index === gameState.currentPlayerIndex ? { duration: 1, repeat: Infinity } : {}}
          >
            📍 {player.username}: {player.cardsCount} cards {player.hasSaidUno && '🎺'}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default GameBoard;