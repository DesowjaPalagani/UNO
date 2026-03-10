'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{ x: [0, 100, 0], y: [0, 100, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 ml-96"
          animate={{ x: [0, -100, 0], y: [0, -100, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-6xl md:text-7xl font-bold text-white mb-6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎮 UNO
        </motion.h1>

        <p className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Play real-time multiplayer UNO with friends online
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/login"
              className="btn btn-primary px-8 py-4 rounded-lg text-lg inline-block"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/register"
              className="btn btn-secondary px-8 py-4 rounded-lg text-lg inline-block"
            >
              Create Account
            </Link>
          </motion.div>
        </div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {[
            { icon: '👥', title: '2-10 Players', desc: 'Play with 2 to 10 players' },
            { icon: '⚡', title: 'Real-time', desc: 'Instant multiplayer sync' },
            { icon: '🎯', title: 'Full Rules', desc: 'Complete UNO rules' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="bg-white bg-opacity-10 backdrop-blur-lg p-6 rounded-lg border border-white border-opacity-20"
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
