'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import GameBoard from '@/components/GameBoard';
import PlayerHand from '@/components/PlayerHand';
import Chat from '@/components/Chat';
import { GameState, Card } from '@/types';
import { apiClient } from '../../../../config/apiClient';
import { initializeSocket } from '../../../../config/socketClient';
import config from '../../../../config';

export default function GameRoomPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.gameId as string;

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectingWildColor, setSelectingWildColor] = useState(false);
  const [messages, setMessages] = useState<{ username: string; message: string; timestamp: Date }[]>([]);
  const [showGameEndModal, setShowGameEndModal] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [unoButtonPressed, setUnoButtonPressed] = useState(false);

  // Fetch initial game state
  useEffect(() => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const userId = localStorage.getItem(config.auth.userIdKey);

    if (!token || !userId) {
      router.push('/login');
      return;
    }

    setMyPlayerId(userId);

    const fetchGameState = async () => {
      try {
        const response = await apiClient.games.get(gameId);
        setGameState(response.data.game);
        setError('');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, [gameId, router]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem(config.auth.tokenKey);

    if (!token) return;

    const newSocket = initializeSocket(token);

    // Connect
    newSocket.on('connect', () => {
      console.log('Connected to game room');
      newSocket.emit('join_game', { gameId });
    });

    // Game state updates
    newSocket.on('game_updated', (data: GameState) => {
      setGameState(data);
      if (data.status === 'FINISHED') {
        setGameEnded(true);
        setShowGameEndModal(true);
      }
    });

    // Card played
    newSocket.on('card_played', (data: any) => {
      console.log('Card played:', data);
      // Update discard pile shown in board
    });

    // UNO declared
    newSocket.on('uno_declared', (data: any) => {
      console.log('UNO declared by:', data.userId);
    });

    // Chat message
    newSocket.on('message_received', (data: { username: string; message: string }) => {
      setMessages((prev) => [...prev, { ...data, timestamp: new Date() }]);
    });

    // Player joined
    newSocket.on('player_joined', (data: any) => {
      console.log('Player joined:', data);
    });

    // Game started
    newSocket.on('game_started', (data: GameState) => {
      setGameState(data);
      setMessages((prev) => [
        ...prev,
        { username: 'System', message: 'Game has started!', timestamp: new Date() },
      ]);
    });

    // Error handling
    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setError('Connection error');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game room');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [gameId, myPlayerId]);

  const isMyTurn = () => {
    if (!gameState || !myPlayerId) return false;
    const myPlayerIndex = gameState.players.findIndex((p) => p.id === myPlayerId);
    return myPlayerIndex === gameState.currentPlayerIndex;
  };

  const getMyHand = (): Card[] => {
    if (!gameState || !myPlayerId) return [];
    const myPlayer = gameState.players.find((p) => p.id === myPlayerId);
    return myPlayer?.hand || [];
  };

  const canPlayCard = (card: Card) => {
    if (!gameState || gameState.discardPile.length === 0) return false;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];

    // Wild cards can always be played
    if (card.color === 'wild') return true;

    // Same color
    if (card.color === topCard.color) return true;

    // Same value
    if (card.value === topCard.value) return true;

    return false;
  };

  const handlePlayCard = async (card: Card) => {
    if (!socket || !isMyTurn()) return;

    if (card.color === 'wild') {
      setSelectedCard(card);
      setSelectingWildColor(true);
      return;
    }

    if (!canPlayCard(card)) {
      setError('Cannot play this card');
      return;
    }

    socket.emit('play_card', {
      gameId,
      cardId: card.id,
      color: card.color,
    });
  };

  const handleWildColorSelected = (color: 'red' | 'blue' | 'green' | 'yellow') => {
    if (!socket || !selectedCard) return;

    socket.emit('play_card', {
      gameId,
      cardId: selectedCard.id,
      color,
    });

    setSelectedCard(null);
    setSelectingWildColor(false);
  };

  const handleDrawCard = () => {
    if (!socket || !isMyTurn()) return;

    socket.emit('draw_card', { gameId });
  };

  const handleDeclareUno = () => {
    if (!socket) return;

    socket.emit('declare_uno', { gameId });
    setUnoButtonPressed(true);
    setTimeout(() => setUnoButtonPressed(false), 1000);
  };

  const handleSendMessage = (message: string) => {
    if (!socket) return;

    socket.emit('send_message', {
      gameId,
      message,
    });
  };

  const handleLeaveGame = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `http://localhost:5000/api/games/${gameId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.push('/lobby');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to leave game');
    }
  };

  const handleReturnToLobby = () => {
    router.push('/lobby');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <motion.div
          className="w-16 h-16 border-4 border-purple-500 border-t-blue-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-6">Game not found</p>
          <motion.button
            onClick={() => router.push('/lobby')}
            whileHover={{ scale: 1.05 }}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Back to Lobby
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      {/* Header */}
      <div className="border-b border-white border-opacity-20 backdrop-blur-lg bg-white bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🎮 Game Room</h1>
          <motion.button
            onClick={handleLeaveGame}
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Leave Game
          </motion.button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          className="mx-4 mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          {error}
        </motion.div>
      )}

      {/* Main game area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Game board - center */}
          <div className="lg:col-span-2 flex flex-col">
            <GameBoard
              gameState={gameState}
              currentPlayerName={gameState.players[gameState.currentPlayerIndex]?.username || 'Unknown'}
              isMyTurn={isMyTurn()}
              onDrawCard={handleDrawCard}
            />

            {/* Game status */}
            <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded-xl border border-white border-opacity-20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-white font-semibold">
                    {gameState.status === 'WAITING' ? '⏳ Waiting to start' : '🎮 In progress'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Direction</p>
                  <p className="text-white font-semibold">
                    {gameState.direction === 'clockwise' ? '↻ Clockwise' : '↺ Counter-clockwise'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Your turn</p>
                  <p className={`font-semibold ${isMyTurn() ? 'text-green-400' : 'text-gray-400'}`}>
                    {isMyTurn() ? '✓ YOUR TURN' : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar - Hand + Actions + Chat */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Player hand */}
            <div className="flex-1 bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded-xl border border-white border-opacity-20 overflow-y-auto">
              <h3 className="text-white font-bold mb-4">Your Hand ({getMyHand().length})</h3>
              <div className="gap-3 flex flex-wrap">
                <AnimatePresence>
                  {getMyHand().map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      onClick={() => handlePlayCard(card)}
                      className={`cursor-pointer rounded-lg p-3 border-2 transition ${
                        canPlayCard(card)
                          ? 'bg-white bg-opacity-20 border-white border-opacity-40 hover:bg-opacity-30'
                          : 'bg-white bg-opacity-10 border-white border-opacity-10 opacity-50'
                      }`}
                    >
                      <p className="text-white font-bold text-sm">{card.value}</p>
                      <div
                        className={`w-8 h-8 rounded-md bg-gradient-to-br ${
                          card.color === 'red' ? 'from-red-500 to-red-700' :
                          card.color === 'blue' ? 'from-blue-500 to-blue-700' :
                          card.color === 'green' ? 'from-green-500 to-green-700' :
                          card.color === 'yellow' ? 'from-yellow-500 to-yellow-700' :
                          'from-purple-600 to-pink-600'
                        }`}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Action buttons */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-4 rounded-xl border border-white border-opacity-20">
              <h3 className="text-white font-bold mb-3">Actions</h3>
              <div className="space-y-2">
                <motion.button
                  onClick={handleDrawCard}
                  disabled={!isMyTurn()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition font-semibold"
                >
                  📥 Draw Card
                </motion.button>

                <motion.button
                  onClick={handleDeclareUno}
                  disabled={getMyHand().length !== 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={unoButtonPressed ? { scale: 1.1 } : { scale: 1 }}
                  className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg transition font-bold"
                >
                  🎯 UNO!
                </motion.button>

                <motion.button
                  onClick={() => router.push('/lobby')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-semibold"
                >
                  ← Back to Lobby
                </motion.button>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 min-h-0">
              <Chat messages={messages} onSendMessage={handleSendMessage} username={localStorage.getItem('username') || 'Unknown'} />
            </div>
          </div>
        </div>
      </div>

      {/* Wild color selector modal */}
      <AnimatePresence>
        {selectingWildColor && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 p-8 rounded-xl border border-white border-opacity-20 text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Choose a color</h3>
              <div className="grid grid-cols-2 gap-4">
                {(['red', 'blue', 'green', 'yellow'] as const).map((color) => (
                  <motion.button
                    key={color}
                    onClick={() => handleWildColorSelected(color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`py-4 px-6 rounded-lg font-bold text-white capitalize transition ${
                      color === 'red' ? 'bg-red-600 hover:bg-red-700' :
                      color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                  >
                    {color}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game end modal */}
      <AnimatePresence>
        {showGameEndModal && gameState?.winner && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-900 to-blue-900 p-8 rounded-xl border border-white border-opacity-20 text-center max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>

              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-4">
                {gameState.winner.id === myPlayerId ? 'You Won!' : `${gameState.winner.username} Won!`}
              </h3>

              <p className="text-gray-300 mb-6">Game finished</p>

              <motion.button
                onClick={handleReturnToLobby}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-bold transition"
              >
                Return to Lobby
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
