import axios, { AxiosInstance, AxiosError } from 'axios';
import config from './index';

/**
 * API Client configured with environment settings
 */

interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${config.api.baseUrl}${config.api.prefix}`,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.axiosInstance.interceptors.request.use((cfg) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem(config.auth.tokenKey) : null;
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`;
      }
      return cfg;
    });

    // Handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (config.isDevelopment) {
          console.error('API Error:', error.response?.data || error.message);
        }
        throw {
          message: error.response?.data?.error || error.message,
          status: error.response?.status,
          data: error.response?.data,
        } as ApiError;
      }
    );
  }

  get instance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Auth endpoints
  auth = {
    register: (data: { email: string; username: string; password: string }) =>
      this.axiosInstance.post('/auth/register', data),
    
    login: (data: { email: string; password: string }) =>
      this.axiosInstance.post('/auth/login', data),
    
    validate: () =>
      this.axiosInstance.post('/auth/validate', {}),
  };

  // Game endpoints
  games = {
    create: (data: any) =>
      this.axiosInstance.post('/games', data),
    
    list: () =>
      this.axiosInstance.get('/games'),
    
    get: (gameId: string) =>
      this.axiosInstance.get(`/games/${gameId}`),
    
    join: (gameId: string, data: any) =>
      this.axiosInstance.post(`/games/${gameId}/join`, data),
    
    start: (gameId: string) =>
      this.axiosInstance.post(`/games/${gameId}/start`, {}),
    
    leave: (gameId: string) =>
      this.axiosInstance.post(`/games/${gameId}/leave`, {}),
    
    history: () =>
      this.axiosInstance.get('/games/history'),
  };

  // Player endpoints
  players = {
    getMe: () =>
      this.axiosInstance.get('/players/me'),
    
    getLeaderboard: () =>
      this.axiosInstance.get('/players/leaderboard/top'),
    
    getProfile: (userId: string) =>
      this.axiosInstance.get(`/players/${userId}`),
    
    updateProfile: (data: any) =>
      this.axiosInstance.put('/players/me', data),
    
    uploadAvatar: (formData: FormData) =>
      this.axiosInstance.post('/players/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    deleteAccount: () =>
      this.axiosInstance.delete('/players/me'),
  };
}

export const apiClient = new ApiClient();
export default apiClient;
