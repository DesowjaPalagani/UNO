'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Socket } from 'socket.io-client';
import { apiClient } from '../../../config/apiClient';
import { initializeSocket } from '../../../config/socketClient';
import config from '../../../config';

interface Game {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
  isPublic: boolean;
  createdAt: string;
}

interface Leaderboard {
  id: string;
  username: string;
  wins: number;
  losses: number;
  winRate: number;
}

interface PlayerStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameName, setGameName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [isPublic, setIsPublic] = useState(true);
  const [creatingGame, setCreatingGame] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);

  // Initialize socket and fetch data
  useEffect(() => {
    const token = localStorage.getItem(config.auth.tokenKey);
    const savedUsername = localStorage.getItem(config.auth.usernameKey);
    
    if (!token || !savedUsername) {
      router.push('/login');
      return;
    }

    setUsername(savedUsername);

    // Connect socket
    const newSocket = initializeSocket(token);

    newSocket.on('connect', () => {
      console.log('Connected to socket');
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
    });

    setSocket(newSocket);

    // Fetch games and leaderboard
    fetchGamesList();
    fetchLeaderboard();
    fetchPlayerStats();

    return () => {
      newSocket.disconnect();
    };
  }, [router]);

  const fetchGamesList = async () => {
    try {
      const response = await apiClient.games.list();
      setGames(response.data.games || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await apiClient.players.getLeaderboard();
      setLeaderboard(response.data.leaderboard || []);
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const token = localStorage.getItem(config.auth.tokenKey);
      const response = await apiClient.players.getMe();
      const player = response.data.player;
      setPlayerStats({
        wins: player.wins || 0,
        losses: player.losses || 0,
        gamesPlayed: (player.wins || 0) + (player.losses || 0),
      });
    } catch (err: any) {
      console.error('Failed to load player stats:', err);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingGame(true);

    if (!gameName.trim()) {
      setError('Game name is required');
      setCreatingGame(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.games.create({
        {
          name: gameName,
          maxPlayers,
          isPublic,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Join the created game
      router.push(`/game/${response.data.game.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create game');
      setCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    setJoiningGameId(gameId);

    try {
      await apiClient.games.join(gameId, {});
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Navigate to game
      router.push(`/game/${gameId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join game');
      setJoiningGameId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getGameStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'finished':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      {/* Header */}
      <div className="border-b border-white border-opacity-20 backdrop-blur-lg bg-white bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">🎮 Lobby</h1>
            <div className="text-gray-400 text-sm">
              Welcome, <span className="text-purple-400 font-semibold">{username}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error message */}
        {error && (
          <motion.div
            className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            {error}
          </motion.div>
        )}

        {/* Player stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gray-400 text-sm mb-2">Games Played</p>
            <p className="text-3xl font-bold text-white">{playerStats.gamesPlayed}</p>
          </motion.div>

          <motion.div
            className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gray-400 text-sm mb-2">Wins</p>
            <p className="text-3xl font-bold text-green-400">{playerStats.wins}</p>
          </motion.div>

          <motion.div
            className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gray-400 text-sm mb-2">Losses</p>
            <p className="text-3xl font-bold text-red-400">{playerStats.losses}</p>
          </motion.div>

          <motion.div
            className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
            whileHover={{ scale: 1.05 }}
          >
            <p className="text-gray-400 text-sm mb-2">Win Rate</p>
            <p className="text-3xl font-bold text-blue-400">
              {playerStats.gamesPlayed > 0
                ? ((playerStats.wins / playerStats.gamesPlayed) * 100).toFixed(1)
                : 0}
              %
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games list */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Available Games</h2>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold"
              >
                + Create Game
              </motion.button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <motion.div
                  className="w-12 h-12 border-4 border-purple-500 border-t-blue-500 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12 bg-white bg-opacity-5 rounded-xl border border-white border-opacity-20">
                <p className="text-gray-400 mb-4">No games available</p>
                <motion.button
                  onClick={() => setShowCreateModal(true)}
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  Be the first to create one!
                </motion.button>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-4">
                  {games.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20 hover:border-opacity-40 transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                          <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getGameStatusColor(game.status)}`}>
                              {game.status === 'waiting'
                                ? 'Waiting'
                                : game.status === 'in_progress'
                                ? 'Playing'
                                : 'Finished'}
                            </span>
                            {game.isPublic && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                                Public
                              </span>
                            )}
                            <span className="text-gray-400 text-sm">{formatDate(game.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-400">
                            {game.playerCount}/{game.maxPlayers}
                          </p>
                          <p className="text-xs text-gray-400">Players</p>
                        </div>
                      </div>

                      {game.status === 'waiting' && game.playerCount < game.maxPlayers && (
                        <motion.button
                          onClick={() => handleJoinGame(game.id)}
                          disabled={joiningGameId === game.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold disabled:opacity-50"
                        >
                          {joiningGameId === game.id ? 'Joining...' : 'Join Game'}
                        </motion.button>
                      )}

                      {game.status === 'in_progress' && (
                        <div className="py-2 text-center">
                          <p className="text-gray-400 text-sm">Game in progress</p>
                        </div>
                      )}

                      {game.status === 'finished' && (
                        <div className="py-2 text-center">
                          <p className="text-gray-400 text-sm">Game finished</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Top Players</h2>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl border border-white border-opacity-20 overflow-hidden">
              <AnimatePresence>
                {leaderboard.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">No leaderboard data</div>
                ) : (
                  <div className="divide-y divide-white divide-opacity-10">
                    {leaderboard.slice(0, 10).map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-white hover:bg-opacity-5 transition"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-purple-400 w-8">{index + 1}.</span>
                            <span className="text-white font-semibold">{player.username}</span>
                          </div>
                          <span className="text-yellow-400 font-bold">{player.wins}W</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400 pl-11">
                          <span>{player.losses}L</span>
                          <span>{(player.winRate * 100).toFixed(1)}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Create game modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 p-8 rounded-xl border border-white border-opacity-20 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-white mb-6">Create Game</h3>

              <form onSubmit={handleCreateGame} className="space-y-4">
                {/* Game name */}
                <div>
                  <label htmlFor="gameName" className="block text-sm font-medium text-gray-200 mb-2">
                    Game Name
                  </label>
                  <input
                    id="gameName"
                    type="text"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    placeholder="Awesome Game"
                    disabled={creatingGame}
                    className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
                  />
                </div>

                {/* Max players */}
                <div>
                  <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-200 mb-2">
                    Max Players
                  </label>
                  <select
                    id="maxPlayers"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    disabled={creatingGame}
                    className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
                  >
                    <option value={2}>2 players</option>
                    <option value={3}>3 players</option>
                    <option value={4}>4 players</option>
                    <option value={6}>6 players</option>
                    <option value={10}>10 players</option>
                  </select>
                </div>

                {/* Public toggle */}
                <div className="flex items-center gap-3">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={creatingGame}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-200">
                    Make this game public (visible to all players)
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <motion.button
                    type="submit"
                    disabled={creatingGame}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition font-semibold disabled:opacity-50"
                  >
                    {creatingGame ? 'Creating...' : 'Create'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setGameName('');
                    }}
                    disabled={creatingGame}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 text-white rounded-lg hover:bg-opacity-20 transition font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
