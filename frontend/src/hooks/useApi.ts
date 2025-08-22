import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  dailyLogsApi,
  mealsApi,
  chatApi,
  reportsApi,
  usersApi,
  DailyLog,
  ChatMessage,
  AnalysisReport,
  UserProfile
} from '../lib/api';

// Query Keys
export const queryKeys = {
  dailyLogs: ['dailyLogs'] as const,
  dailyLog: (id: number) => ['dailyLog', id] as const,
  dailyLogByDate: (date: string) => ['dailyLogByDate', date] as const,
  chatHistory: ['chatHistory'] as const,
  analysisReports: ['analysisReports'] as const,
  latestReport: ['latestReport'] as const,
  userProfile: ['userProfile'] as const,
  apiKeyStatus: ['apiKeyStatus'] as const,
};

// Helper function to transform meal_logs array to breakfast/lunch/dinner fields
const transformMealLogs = (log: DailyLog) => {
  const breakfast = log.meal_logs?.find(meal => meal.meal_type === 'breakfast');
  const lunch = log.meal_logs?.find(meal => meal.meal_type === 'lunch');
  const dinner = log.meal_logs?.find(meal => meal.meal_type === 'dinner');

  return {
    ...log,
    breakfast: breakfast ? {
      text: breakfast.text,
      analysis_data: breakfast.analysis_data,
      image_path: breakfast.image_path,
      id: breakfast.id,
      meal_type: breakfast.meal_type
    } : { text: '', analysis_data: null, image_path: null },
    lunch: lunch ? {
      text: lunch.text,
      analysis_data: lunch.analysis_data,
      image_path: lunch.image_path,
      id: lunch.id,
      meal_type: lunch.meal_type
    } : { text: '', analysis_data: null, image_path: null },
    dinner: dinner ? {
      text: dinner.text,
      analysis_data: dinner.analysis_data,
      image_path: dinner.image_path,
      id: dinner.id,
      meal_type: dinner.meal_type
    } : { text: '', analysis_data: null, image_path: null },
  };
};

// Daily Logs Hooks
export const useDailyLogs = (params?: {
  skip?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: [...queryKeys.dailyLogs, params],
    queryFn: () => dailyLogsApi.getLogs(params),
    select: (data) => data.data.map(transformMealLogs),
  });
};

export const useDailyLog = (id: number) => {
  return useQuery({
    queryKey: queryKeys.dailyLog(id),
    queryFn: () => dailyLogsApi.getLog(id),
    select: (data) => transformMealLogs(data.data),
    enabled: !!id,
  });
};

export const useDailyLogByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.dailyLogByDate(date),
    queryFn: () => dailyLogsApi.getLogByDate(date),
    select: (data) => transformMealLogs(data.data),
    enabled: !!date,
  });
};

export const useCreateDailyLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<DailyLog>) => dailyLogsApi.createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs });
    },
  });
};

export const useUpdateDailyLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DailyLog> }) =>
      dailyLogsApi.updateLog(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog(id) });
    },
  });
};

export const useDeleteDailyLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => dailyLogsApi.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs });
    },
  });
};

// Meals Hooks
export const useAnalyzeMeal = () => {
  return useMutation({
    mutationFn: (data: FormData) => mealsApi.analyzeMeal(data),
  });
};

export const useUploadMealImage = () => {
  return useMutation({
    mutationFn: (data: FormData) => mealsApi.uploadImage(data),
  });
};

export const useAddMealToLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FormData) => mealsApi.addToLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs });
    },
  });
};

// Chat Hooks
export const useChatHistory = (limit?: number) => {
  return useQuery({
    queryKey: [...queryKeys.chatHistory, limit],
    queryFn: () => chatApi.getHistory(limit),
    select: (data) => data.data,
  });
};

export const useClearChatHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => chatApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory });
    },
  });
};

export const useDeleteChatMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: number) => chatApi.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chatHistory });
    },
  });
};

// Reports Hooks
export const useAnalysisReports = (params?: {
  skip?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.analysisReports, params],
    queryFn: () => reportsApi.getReports(params),
    select: (data) => data.data,
  });
};

export const useLatestReport = () => {
  return useQuery({
    queryKey: queryKeys.latestReport,
    queryFn: () => reportsApi.getLatest(),
    select: (data) => data.data,
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (daysBack?: number) => reportsApi.generate(daysBack),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisReports });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestReport });
    },
  });
};

export const useAnalyzeDay = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (logId: number) => reportsApi.analyzeDay(logId),
    onSuccess: (_, logId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLogs });
      queryClient.invalidateQueries({ queryKey: queryKeys.dailyLog(logId) });
    },
  });
};

// User Hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: () => usersApi.getProfile(),
    select: (data) => data.data,
  });
};

export const useApiKeyStatus = () => {
  return useQuery({
    queryKey: queryKeys.apiKeyStatus,
    queryFn: () => usersApi.getApiKeyStatus(),
    select: (data) => data.data,
  });
};
