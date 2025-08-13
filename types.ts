
export interface UserInfo {
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null;
  initialWeight: number | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
}

export interface DailyLogEntry {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  waterL: number | null;
  sleepH: number | null;
  breakfast: string;
  lunch: string;
  dinner: string;
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
  generatedMealName: string; // e.g., "Chicken Salad with Black Coffee"
  estimatedCalories: number;
  estimatedProteinG: number;
  estimatedCarbsG: number;
  estimatedFatG: number;
}

export interface FullDayAnalysisData {
  estimatedIntakeCalories: number;
  estimatedIntakeProteinG: number;
  estimatedIntakeCarbsG: number;
  estimatedIntakeFatG: number;
  estimatedExpenditureCalories: number;
  dailySummary: string;
}
