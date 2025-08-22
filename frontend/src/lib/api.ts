import axios, { AxiosResponse } from 'axios';

// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8889';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  initial_weight?: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  age?: number;
  gender?: string;
  height?: number;
  initial_weight?: number;
  activity_level?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: number;
  user_id: number;
  date: string;
  weight_kg?: number;
  waist_cm?: number;
  water_l?: number;
  sleep_h?: number;
  bmr?: number;
  tdee?: number;
  actual_intake?: number;
  estimated_expenditure?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  calorie_deficit?: number;
  activity?: string;
  summary?: string;
  meal_logs: MealLog[];
  created_at: string;
  updated_at: string;
}

export interface MealLog {
  id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  text: string;
  image_path?: string;
  analysis_data?: MealAnalysisData;
  created_at: string;
}

export interface MealAnalysisData {
  generatedMealName: string;
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  description: string;
  tags: string[];
  identifiedIngredients: string[];
  dominantColors: string[];
  cuisineStyle: string;
  fatLossRating?: number;
  fatLossAdvantages?: string[];
  fatLossDisadvantages?: string[];
  improvementTips?: string[];
}

export interface ChatMessage {
  id: number;
  user_id: number;
  role: 'user' | 'model';
  text: string;
  image_path?: string;
  created_at: string;
}

export interface AnalysisReport {
  id: number;
  user_id: number;
  report_data: any;
  generated_at: string;
}

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/api/auth/login', data),
  
  register: (data: RegisterRequest): Promise<AxiosResponse<UserProfile>> =>
    api.post('/api/auth/register', data),
  
  getProfile: (): Promise<AxiosResponse<UserProfile>> =>
    api.get('/api/auth/me'),
  
  refreshToken: (): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/api/auth/refresh'),
};

// Users API
export const usersApi = {
  getProfile: (): Promise<AxiosResponse<UserProfile>> =>
    api.get('/api/users/profile'),
  
  updateProfile: (data: Partial<UserProfile>): Promise<AxiosResponse<UserProfile>> =>
    api.put('/api/users/profile', data),
  
  updateApiKey: (gemini_api_key: string): Promise<AxiosResponse<{message: string}>> =>
    api.put('/api/users/api-key', { gemini_api_key }),
  
  getApiKeyStatus: (): Promise<AxiosResponse<{has_api_key: boolean}>> =>
    api.get('/api/users/api-key'),
};

// Daily Logs API
export const dailyLogsApi = {
  getLogs: (params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<AxiosResponse<DailyLog[]>> =>
    api.get('/api/daily-logs', { params }),
  
  createLog: (data: Partial<DailyLog>): Promise<AxiosResponse<DailyLog>> =>
    api.post('/api/daily-logs', data),
  
  getLog: (id: number): Promise<AxiosResponse<DailyLog>> =>
    api.get(`/api/daily-logs/${id}`),
  
  getLogByDate: (date: string): Promise<AxiosResponse<DailyLog>> =>
    api.get(`/api/daily-logs/by-date/${date}`),
  
  updateLog: (id: number, data: Partial<DailyLog>): Promise<AxiosResponse<DailyLog>> =>
    api.put(`/api/daily-logs/${id}`, data),
  
  deleteLog: (id: number): Promise<AxiosResponse<{message: string}>> =>
    api.delete(`/api/daily-logs/${id}`),
};

// Meals API
export const mealsApi = {
  analyzeMeal: (data: FormData): Promise<AxiosResponse<MealAnalysisData>> =>
    api.post('/api/meals/analyze', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  uploadImage: (data: FormData): Promise<AxiosResponse<{filename: string; file_path: string; file_size: number}>> =>
    api.post('/api/meals/upload-image', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  addToLog: (data: FormData): Promise<AxiosResponse<{message: string; meal_id: number}>> =>
    api.post('/api/meals/add-to-log', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  deleteImage: (mealId: number): Promise<AxiosResponse<{message: string}>> =>
    api.delete(`/api/meals/images/${mealId}`),
};

// Meal API (for creating meals)
export const mealApi = {
  createMeal: (data: { date: string; meal_type: string; text: string }): Promise<AxiosResponse<{success: boolean; meal_id?: number; error?: string}>> => {
    const formData = new FormData();
    formData.append('text', data.text);
    formData.append('meal_type', data.meal_type);
    formData.append('date', data.date);

    return api.post('/api/meals/analyze-smart-input', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  createMealWithImage: (data: FormData): Promise<AxiosResponse<{success: boolean; meal_id?: number; error?: string}>> =>
    api.post('/api/meals/analyze-smart-input', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Chat API
export const chatApi = {
  getHistory: (limit?: number): Promise<AxiosResponse<ChatMessage[]>> =>
    api.get('/api/chat/history', { params: { limit } }),
  
  sendMessage: (data: FormData): Promise<Response> =>
    fetch(`${API_BASE_URL}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: data,
    }),
  
  clearHistory: (): Promise<AxiosResponse<{message: string}>> =>
    api.delete('/api/chat/history'),
  
  deleteMessage: (messageId: number): Promise<AxiosResponse<{message: string}>> =>
    api.delete(`/api/chat/message/${messageId}`),
};

// Reports API
export const reportsApi = {
  generate: (daysBack?: number): Promise<AxiosResponse<AnalysisReport>> =>
    api.post('/api/reports/generate', null, { params: { days_back: daysBack } }),
  
  getLatest: (): Promise<AxiosResponse<AnalysisReport | null>> =>
    api.get('/api/reports/latest'),
  
  getReports: (params?: {
    skip?: number;
    limit?: number;
  }): Promise<AxiosResponse<AnalysisReport[]>> =>
    api.get('/api/reports', { params }),
  
  getReport: (id: number): Promise<AxiosResponse<AnalysisReport>> =>
    api.get(`/api/reports/${id}`),
  
  deleteReport: (id: number): Promise<AxiosResponse<{message: string}>> =>
    api.delete(`/api/reports/${id}`),
  
  analyzeDay: (logId: number): Promise<AxiosResponse<{message: string; analysis: any; updated_log: DailyLog}>> =>
    api.post(`/api/reports/analyze-day/${logId}`),
};

// Utility functions
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';

  // If it's already a complete URL (data URL or http URL), return as is
  if (imagePath.startsWith('data:') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Otherwise, construct the full URL with the API base
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('access_token');
};

export const logout = (): void => {
  localStorage.removeItem('access_token');
  window.location.href = '/login';
};

// Data Import/Export API
export const dataImportApi = {
  importFromCsv: (file: File): Promise<AxiosResponse<{message: string; imported_logs: number; skipped_logs: number}>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/data-import/from-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  importFromJson: (file: File): Promise<AxiosResponse<{message: string; imported_logs: number; skipped_logs: number}>> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/data-import/from-json', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  importFromLocalStorage: (data: any): Promise<AxiosResponse<{message: string; imported_logs: number; skipped_logs: number}>> =>
    api.post('/api/data-import/from-localStorage', data),

  exportData: (): Promise<AxiosResponse<any>> =>
    api.get('/api/data-import/export'),
};
