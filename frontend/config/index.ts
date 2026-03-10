/**
 * Frontend Configuration
 * Dynamically loads environment-specific config from .env variables
 */

type Environment = 'development' | 'qa' | 'production';

interface AppConfig {
  env: Environment;
  isDevelopment: boolean;
  isQA: boolean;
  isProduction: boolean;

  // API Configuration
  api: {
    baseUrl: string;
    prefix: string;
    timeout: number;
  };

  // Socket.io Configuration
  socket: {
    url: string;
    reconnect: boolean;
    reconnectionDelay: number;
    reconnectionDelayMax: number;
    reconnectionAttempts: number;
  };

  // Auth Configuration
  auth: {
    tokenKey: string;
    userIdKey: string;
    usernameKey: string;
  };

  // UI Configuration
  ui: {
    animationEnabled: boolean;
    debugMode: boolean;
  };

  // Game Configuration
  game: {
    minPlayers: number;
    maxPlayers: number;
    cardAnimationEnabled: boolean;
  };
}

const getEnvironment = (): Environment => {
  const env = process.env.NEXT_PUBLIC_ENV || 'development';
  return env as Environment;
};

const createConfig = (): AppConfig => {
  const env = getEnvironment();

  const baseConfigs: Record<Environment, AppConfig> = {
    development: {
      env: 'development',
      isDevelopment: true,
      isQA: false,
      isProduction: false,

      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
        prefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api',
        timeout: 30000,
      },

      socket: {
        url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
        reconnect: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
      },

      auth: {
        tokenKey: 'token',
        userIdKey: 'userId',
        usernameKey: 'username',
      },

      ui: {
        animationEnabled: true,
        debugMode: true,
      },

      game: {
        minPlayers: 2,
        maxPlayers: 10,
        cardAnimationEnabled: true,
      },
    },

    qa: {
      env: 'qa',
      isDevelopment: false,
      isQA: true,
      isProduction: false,

      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://qa-api.example.com',
        prefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api',
        timeout: 30000,
      },

      socket: {
        url: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://qa-api.example.com',
        reconnect: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 15,
      },

      auth: {
        tokenKey: 'token',
        userIdKey: 'userId',
        usernameKey: 'username',
      },

      ui: {
        animationEnabled: true,
        debugMode: false,
      },

      game: {
        minPlayers: 2,
        maxPlayers: 10,
        cardAnimationEnabled: true,
      },
    },

    production: {
      env: 'production',
      isDevelopment: false,
      isQA: false,
      isProduction: true,

      api: {
        baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.uno-game.example.com',
        prefix: process.env.NEXT_PUBLIC_API_PREFIX || '/api',
        timeout: 30000,
      },

      socket: {
        url: process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.uno-game.example.com',
        reconnect: true,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 15000,
        reconnectionAttempts: 20,
      },

      auth: {
        tokenKey: 'token_prod',
        userIdKey: 'userId_prod',
        usernameKey: 'username_prod',
      },

      ui: {
        animationEnabled: true,
        debugMode: false,
      },

      game: {
        minPlayers: 2,
        maxPlayers: 10,
        cardAnimationEnabled: true,
      },
    },
  };

  return baseConfigs[env];
};

export const config = createConfig();

export default config;
