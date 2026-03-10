import 'dotenv/config';

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isQA: process.env.NODE_ENV === 'qa',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  server: {
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || 'localhost',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },

  // Frontend URL (CORS)
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    prefix: process.env.API_PREFIX || '/api',
  },

  // Socket.io
  socket: {
    port: parseInt(process.env.SOCKET_PORT || '5000', 10),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // Game Settings
  game: {
    minPlayers: parseInt(process.env.MIN_PLAYERS || '2', 10),
    maxPlayers: parseInt(process.env.MAX_PLAYERS || '10', 10),
    initialHandSize: parseInt(process.env.INITIAL_HAND_SIZE || '7', 10),
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
