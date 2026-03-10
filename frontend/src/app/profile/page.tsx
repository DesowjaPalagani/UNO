'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../../../config/apiClient';
import config from '../../../config';

interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  wins: number;
  losses: number;
  createdAt: string;
}

interface GameRecord {
  id: string;
  opponent: string;
  result: 'win' | 'loss';
  duration: number;
  date: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem(config.auth.tokenKey);
    if (!token) {
      router.push('/login');
      return;
    }

    fetchProfile();
    fetchGameHistory();
  }, [router]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:5000/api/players/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data.player);
      setNewUsername(response.data.player.username);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameHistory = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('http://localhost:5000/api/games/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGameHistory(response.data.games || []);
    } catch (err: any) {
      console.error('Failed to load game history:', err);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (newUsername === profile?.username) {
      setEditing(false);
      return;
    }

    setSavingUsername(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.patch(
        'http://localhost:5000/api/players/me',
        { username: newUsername },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data.player);
      localStorage.setItem('username', newUsername);
      setEditing(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update username');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await axios.post('http://localhost:5000/api/players/me/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfile(response.data.player);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');

    try {
      await axios.delete('http://localhost:5000/api/players/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      localStorage.removeItem(config.auth.tokenKey);
      localStorage.removeItem(config.auth.userIdKey);
      localStorage.removeItem(config.auth.usernameKey);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete account');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-6">Profile not found</p>
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

  const winRate =
    profile.wins + profile.losses > 0
      ? ((profile.wins / (profile.wins + profile.losses)) * 100).toFixed(1)
      : '0';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      {/* Header */}
      <div className="border-b border-white border-opacity-20 backdrop-blur-lg bg-white bg-opacity-5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">👤 Profile</h1>
          <div className="flex gap-3">
            <Link
              href="/lobby"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Back to Lobby
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

      {/* Error message */}
      {error && (
        <motion.div
          className="mx-auto max-w-6xl px-4 mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg text-red-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
        >
          {error}
        </motion.div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile section */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-8 rounded-xl border border-white border-opacity-20">
              {/* Avatar */}
              <div className="text-center mb-6">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover border-4 border-purple-500"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-4xl font-bold text-white">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    whileHover={{ scale: 1.1 }}
                    className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition disabled:opacity-50"
                  >
                    📷
                  </motion.button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                {uploadingAvatar && (
                  <p className="text-purple-400 text-sm mb-4">Uploading...</p>
                )}
              </div>

              {/* Username */}
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-2">Username</p>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      disabled={savingUsername}
                      className="flex-1 px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
                    />
                    <motion.button
                      onClick={handleUpdateUsername}
                      disabled={savingUsername}
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition"
                    >
                      {savingUsername ? '...' : '✓'}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setEditing(false);
                        setNewUsername(profile.username);
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                    >
                      ✕
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-white font-semibold">{profile.username}</p>
                    <motion.button
                      onClick={() => setEditing(true)}
                      whileHover={{ scale: 1.05 }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
                    >
                      Edit
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Email</p>
                <p className="text-white font-semibold">{profile.email}</p>
              </div>

              {/* Member since */}
              <div className="mb-6 pb-6 border-b border-white border-opacity-20">
                <p className="text-gray-400 text-sm mb-2">Member Since</p>
                <p className="text-white font-semibold">{formatDate(profile.createdAt)}</p>
              </div>

              {/* Delete account */}
              <motion.button
                onClick={() => setShowDeleteConfirm(true)}
                whileHover={{ scale: 1.02 }}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
              >
                Delete Account
              </motion.button>
            </div>
          </motion.div>

          {/* Stats section */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-gray-400 text-sm mb-2">Total Games</p>
                <p className="text-4xl font-bold text-white">{profile.wins + profile.losses}</p>
              </motion.div>

              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-gray-400 text-sm mb-2">Win Rate</p>
                <p className="text-4xl font-bold text-blue-400">{winRate}%</p>
              </motion.div>

              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-gray-400 text-sm mb-2">Wins</p>
                <p className="text-4xl font-bold text-green-400">{profile.wins}</p>
              </motion.div>

              <motion.div
                className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20"
                whileHover={{ scale: 1.05 }}
              >
                <p className="text-gray-400 text-sm mb-2">Losses</p>
                <p className="text-4xl font-bold text-red-400">{profile.losses}</p>
              </motion.div>
            </div>

            {/* Game history */}
            <div className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-xl border border-white border-opacity-20">
              <h3 className="text-xl font-bold text-white mb-4">Recent Games</h3>

              {gameHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No game history yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {gameHistory.slice(0, 20).map((game, index) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-white bg-opacity-5 rounded-lg border border-white border-opacity-10 hover:bg-opacity-10 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  game.result === 'win'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                }`}
                              >
                                {game.result === 'win' ? 'WIN' : 'LOSS'}
                              </span>
                              <span className="text-white font-semibold">vs {game.opponent}</span>
                            </div>
                            <p className="text-gray-400 text-xs">{formatDate(game.date)}</p>
                          </div>
                          <span className="text-gray-400 text-sm">{formatDuration(game.duration)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-900 p-8 rounded-xl border border-white border-opacity-20 max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-2xl font-bold text-white mb-4">Delete Account?</h3>
              <p className="text-gray-300 mb-6">
                This action cannot be undone. All your data will be permanently deleted.
              </p>

              <div className="flex gap-3">
                <motion.button
                  onClick={handleDeleteAccount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
                >
                  Delete
                </motion.button>
                <motion.button
                  onClick={() => setShowDeleteConfirm(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-semibold"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
