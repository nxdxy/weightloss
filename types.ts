
export interface UserInfo {
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null;
  initialWeight: number | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
}

export interface MealLog {
  text: string; // Will store a summary like "鸡肉沙拉 (~450 kcal)"
  image?: string;
  analysis?: AnalyzedMealData; // The full analysis object
}

export interface DailyLogEntry {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  waterL: number | null;
  sleepH: number | null;
  breakfast: MealLog;
  lunch: MealLog;
  dinner: MealLog;
  activity: string;
  bmr: number | null; // ADDED: Basal Metabolic Rate
  tdee: number | null; // ADDED: Total Daily Energy Expenditure
  actualIntake: number | null;
  estimatedExpenditure: number | null; // This is "activity expenditure"
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  calorieDeficit: number | null;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // base64 data URL
}

export enum Page {
  PROFILE = 'Profile',
  CHAT = 'Chat',
  LOG = 'Log',
  REPORT = 'Report',
  SETTINGS = 'Settings',
  FOOD_KNOWLEDGE = '饮食知识库',
}

export interface WeeklySummary {
  week: string; // e.g., "Week 1"
  avgWeight: number | null;
  weightChange: number | null; // change from previous week
}

export interface AnalysisReportData {
  progressScore: number; // A score from 0-100
  keyMetrics: {
    totalWeightLoss: number;
    avgWeeklyLoss: number;
    avgCalorieDeficit: number;
    totalWaistReduction: number;
    avgActivityExpenditure: number;
  };
  consistency: {
    logStreak: number;
    consistencyPercentage: number;
  };
  weeklySummary: WeeklySummary[];
  sleepAnalysis: {
    avgHours: number;
    correlationComment: string;
  };
  hydrationAnalysis: {
      avgWaterL: number;
      comment: string;
  };
  nutritionInsights: {
    overall: string;
    positive: string;
    improvement: string;
    macroDistribution: {
        proteinPercentage: number;
        carbsPercentage: number;
        fatPercentage: number;
        comment: string;
    }
  };
  achievements: string[];
  actionableTips: string[]; // Renamed from suggestions
  // NEW FIELDS FOR ENHANCED REPORT
  recommendedSuperfoods: {
      food: string;
      reason: string;
  }[];
  exercisePrescription: {
      recommendation: string;
      details: string[];
  };
  potentialRisks: string[];
  weeklyOutlook: string;
}


export interface StoredAnalysisReport {
  data: AnalysisReportData | null;
  generatedAt: string | null;
}

export interface AnalyzedMealData {
  generatedMealName: string; // "鸡肉沙拉"
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
  // New fields inspired by the screenshot
  description: string; // "一份看起来很健康的沙拉，包含烤鸡胸肉、混合生菜、圣女果和一些坚果..."
  tags: string[]; // ["高蛋白", "减脂餐", "健康"]
  identifiedIngredients: string[]; // ["鸡胸肉", "生菜", "圣女果", "黄瓜", "杏仁"]
  dominantColors: string[]; // ["绿色", "白色", "红色"]
  cuisineStyle: string; // "西式简餐"
}


export interface FullDayAnalysisData {
  estimatedIntakeCalories: number;
  estimatedIntakeProteinG: number;
  estimatedIntakeCarbsG: number;
  estimatedIntakeFatG: number;
  estimatedExpenditureCalories: number;
  dailySummary: string;
}