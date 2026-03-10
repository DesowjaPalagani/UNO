import { Socket, io as ioClient, ManagerOptions, SocketOptions } from 'socket.io-client';
import config from './index';

/**
 * Socket.io Client configured with environment settings
 */

let socket: Socket | null = null;

export const initializeSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  const socketOptions: Partial<ManagerOptions & SocketOptions> = {
    reconnection: config.socket.reconnect,
    reconnectionDelay: config.socket.reconnectionDelay,
    reconnectionDelayMax: config.socket.reconnectionDelayMax,
    reconnectionAttempts: config.socket.reconnectionAttempts,
    auth: token ? { token } : undefined,
  };

  socket = ioClient(config.socket.url, socketOptions);

  socket.on('connect', () => {
    if (config.isDevelopment) {
      console.log('Socket.io connected:', socket?.id);
    }
  });

  socket.on('disconnect', () => {
    if (config.isDevelopment) {
      console.log('Socket.io disconnected');
    }
  });

  socket.on('error', (error) => {
    if (config.isDevelopment) {
      console.error('Socket.io error:', error);
    }
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
};
