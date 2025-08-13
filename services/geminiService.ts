import { GoogleGenAI, Type, Part, GenerateContentResponse } from "@google/genai";
import type { UserInfo, DailyLogEntry, AnalysisReportData, AnalyzedMealData, FullDayAnalysisData, ChatMessage } from '../types';

// Function to get the API key from localStorage
const getApiKey = (): string | null => {
    return localStorage.getItem('gemini-api-key');
};

// Function to get the AI client, throws if key is missing
const getAiClient = (): GoogleGenAI => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API_KEY_MISSING: Gemini API Key not found in user settings.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to convert a File object to a base64 string for the API
const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const analysisReportSchema = {
    type: Type.OBJECT,
    properties: {
        progressScore: { type: Type.NUMBER, description: "一个0-100之间的综合得分，评估用户的整体进展。" },
        keyMetrics: {
            type: Type.OBJECT,
            properties: {
                totalWeightLoss: { type: Type.NUMBER, description: "从初始体重到最新体重的总减重公斤数。" },
                totalWaistReduction: { type: Type.NUMBER, description: "从第一次有记录的腰围到最后一次有记录的腰围的总减少厘米数。如果没有腰围数据，则为0。" },
                avgWeeklyLoss: { type: Type.NUMBER, description: "平均每周减重公斤数。" },
                avgCalorieDeficit: { type: Type.NUMBER, description: "平均每日热量缺口。" },
                avgActivityExpenditure: { type: Type.NUMBER, description: "所有记录日中，每日'estimatedExpenditure'的平均值。" },
            },
            required: ['totalWeightLoss', 'totalWaistReduction', 'avgWeeklyLoss', 'avgCalorieDeficit', 'avgActivityExpenditure']
        },
        consistency: {
            type: Type.OBJECT,
            properties: {
                logStreak: { type: Type.NUMBER, description: "最近连续记录日志的天数。" },
                consistencyPercentage: { type: Type.NUMBER, description: "在所提供的数据期间，记录日志天数的百分比（0-100）。" },
            },
            required: ['logStreak', 'consistencyPercentage']
        },
        weeklySummary: {
            type: Type.ARRAY,
            description: "每周的体重变化摘要。",
            items: {
                type: Type.OBJECT,
                properties: {
                    week: { type: Type.STRING, description: "周的标识符，例如 '第1周' 或 '2023-10-01 ~ 2023-10-07'。" },
                    avgWeight: { type: Type.NUMBER, description: "该周的平均体重。" },
                    weightChange: { type: Type.NUMBER, description: "与上一周相比的体重变化（公斤），第一周为0。" },
                },
                required: ['week', 'avgWeight', 'weightChange']
            }
        },
        sleepAnalysis: {
            type: Type.OBJECT,
            properties: {
                avgHours: { type: Type.NUMBER, description: "平均每晚睡眠小时数。" },
                correlationComment: { type: Type.STRING, description: "一句关于睡眠和进展之间可能关联的简短评论。" }
            },
            required: ['avgHours', 'correlationComment']
        },
        hydrationAnalysis: {
            type: Type.OBJECT,
            properties: {
                avgWaterL: { type: Type.NUMBER, description: "所有记录日中，每日'waterL'的平均值。" },
                comment: { type: Type.STRING, description: "一句关于用户饮水习惯的简短、专业的中文评论。" },
            },
            required: ['avgWaterL', 'comment']
        },
        nutritionInsights: {
            type: Type.OBJECT,
            properties: {
                overall: { type: Type.STRING, description: "一句关于整体饮食结构的简短总结。" },
                positive: { type: Type.STRING, description: "根据餐食名称，饮食中值得表扬的一个方面。" },
                improvement: { type: Type.STRING, description: "根据餐食名称，饮食中可以改进的一个方面。" },
                macroDistribution: {
                    type: Type.OBJECT,
                    properties: {
                        proteinPercentage: { type: Type.NUMBER, description: "蛋白质热量占总摄入热量的平均百分比。计算公式: (平均proteinG * 4) / 平均actualIntake * 100。" },
                        carbsPercentage: { type: Type.NUMBER, description: "碳水化合物热量占总摄入热量的平均百分比。计算公式: (平均carbsG * 4) / 平均actualIntake * 100。" },
                        fatPercentage: { type: Type.NUMBER, description: "脂肪热量占总摄入热量的平均百分比。计算公式: (平均fatG * 9) / 平均actualIntake * 100。" },
                        comment: { type: Type.STRING, description: "一句关于宏量营养素（蛋白质、碳水、脂肪）分配是否均衡、合理的专业中文评论。" }
                    },
                    required: ['proteinPercentage', 'carbsPercentage', 'fatPercentage', 'comment']
                }
            },
            required: ['overall', 'positive', 'improvement', 'macroDistribution']
        },
        achievements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "一个字符串数组，列出用户达成的主要成就（最多3-4个）。"
        },
        actionableTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "一个字符串数组，为用户提供最重要的、可行的改进建议（最多3-4个）。"
        },
        recommendedSuperfoods: {
            type: Type.ARRAY,
            description: "根据用户的饮食和目标，推荐3-5种有益的超级食物。",
            items: {
                type: Type.OBJECT,
                properties: {
                    food: { type: Type.STRING, description: "推荐的食物名称，例如 '牛油果'。" },
                    reason: { type: Type.STRING, description: "推荐该食物的简短、科学的理由，例如 '富含健康单不饱和脂肪，有助于增加饱腹感'。" }
                },
                required: ['food', 'reason']
            }
        },
        exercisePrescription: {
            type: Type.OBJECT,
            description: "根据用户的活动水平和目标，提供个性化的运动处方。",
            properties: {
                recommendation: { type: Type.STRING, description: "一句总结性的运动建议，例如 '建议增加有氧运动频率并引入力量训练'。" },
                details: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "一个包含3-4个具体运动建议的数组，例如 '每周进行3次30分钟的快走或慢跑' 或 '尝试每周2次全身力量训练，如深蹲、俯卧撑'。"
                }
            },
            required: ['recommendation', 'details']
        },
        potentialRisks: {
            type: Type.ARRAY,
            description: "根据数据分析，识别1-3个用户需要关注的潜在风险或不良趋势。",
            items: { type: Type.STRING },
        },
        weeklyOutlook: {
            type: Type.STRING,
            description: "一句总结性的文字，回顾最近一周的表现并对下一周提出展望和鼓励。"
        }
    },
    required: ['progressScore', 'keyMetrics', 'consistency', 'weeklySummary', 'sleepAnalysis', 'hydrationAnalysis', 'nutritionInsights', 'achievements', 'actionableTips', 'recommendedSuperfoods', 'exercisePrescription', 'potentialRisks', 'weeklyOutlook']
};

const singleMealAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        generatedMealName: {
            type: Type.STRING,
            description: "根据食物条目生成一个简洁的餐食名称，例如'鸡肉沙拉和黑咖啡'。"
        },
        estimatedCalories: {
            type: Type.NUMBER,
            description: "估算的该餐食的总热量（千卡）。"
        },
        estimatedProteinG: {
            type: Type.NUMBER,
            description: "估算的该餐食的总蛋白质（克）。"
        },
        estimatedCarbsG: {
            type: Type.NUMBER,
            description: "估算的该餐食的总碳水化合物（克）。"
        },
        estimatedFatG: {
            type: Type.NUMBER,
            description: "估算的该餐食的总脂肪（克）。"
        }
    },
    required: ['generatedMealName', 'estimatedCalories', 'estimatedProteinG', 'estimatedCarbsG', 'estimatedFatG']
};

const fullDayAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        estimatedIntakeCalories: { type: Type.NUMBER, description: "估算的全天三餐摄入的总热量（千卡）。" },
        estimatedIntakeProteinG: { type: Type.NUMBER, description: "估算的全天三餐摄入的总蛋白质（克）。" },
        estimatedIntakeCarbsG: { type: Type.NUMBER, description: "估算的全天三餐摄入的总碳水化合物（克）。" },
        estimatedIntakeFatG: { type: Type.NUMBER, description: "估算的全天三餐摄入的总脂肪（克）。" },
        estimatedExpenditureCalories: { type: Type.NUMBER, description: "根据'运动情况'文字描述估算的总消耗热量（千卡）。如果无运动记录，返回0。" },
        dailySummary: { type: Type.STRING, description: "根据全天的数据（摄入、消耗、缺口、体重变化等）生成一个简短的中文分析小结。例如：'热量缺口达标，体重有下降趋势，很棒的一天！'" },
    },
    required: [
        'estimatedIntakeCalories',
        'estimatedIntakeProteinG',
        'estimatedIntakeCarbsG',
        'estimatedIntakeFatG',
        'estimatedExpenditureCalories',
        'dailySummary'
    ]
};

const modelName = "gemini-2.5-flash";

export const analyzeMealInput = async (userInput: string, image: File | null = null, mealTypeHint: string): Promise<AnalyzedMealData> => {
    if (!userInput.trim() && !image) throw new Error("User input or image is required.");
    const ai = getAiClient();
    
    const promptText = `你是一位专业的营养分析师，以精准和客观著称。请严格根据用户提供的餐食图片和/或文字描述，按照JSON schema返回分析结果。\n\n分析上下文:\n- 餐别: "${mealTypeHint}"\n- 用户文字描述: "${userInput || '无'}"\n\n分析标准:\n1.  **主要依据**: 如果提供了图片，以图片内容为主要分析对象。文字描述仅作为补充。\n2.  **精准估算**: 识别所有食物和饮料，并尽可能准确地估算总热量、蛋白质、碳水化合物和脂肪含量。\n3.  **客观命名**: 生成一个简洁、客观的餐食名称来概括这顿饭，例如“烤鸡胸肉配西兰花”。\n\n你的回答必须是严格遵循schema的JSON对象，不包含任何解释或附加文本。`;
    
    const parts: Part[] = [];
    if (image) {
        const imagePart = await fileToGenerativePart(image);
        // The vision model works better if the image comes first.
        parts.push(imagePart);
    }
    parts.push({ text: promptText });
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: { responseMimeType: "application/json", responseSchema: singleMealAnalysisSchema },
        });

        return JSON.parse(response.text) as AnalyzedMealData;
    } catch (e) {
        console.error("Error analyzing meal:", e);
        throw e; // Re-throw to be caught by the UI
    }
};

export const analyzeFullDayNutrition = async (logData: DailyLogEntry): Promise<FullDayAnalysisData> => {
    const ai = getAiClient();
    const promptText = `你是一位严格、专业的瘦身教练。你的任务是基于客观数据，提供严谨、真实的分析。请分析用户提供的单日完整记录，并严格按照JSON schema返回分析结果。\n\n用户的单日记录:\n${JSON.stringify(logData)}\n\n你的任务是:\n1.  **分析摄入**: 精准识别所有餐食记录，估算全天摄入的总热量、蛋白质、碳水化合物和脂肪。\n2.  **分析消耗**: 根据用户的运动记录，估算当天的总运动消耗热量。无记录则为0。\n3.  **生成小结 (dailySummary)**: 基于所有数据（摄入、消耗、热量缺口等），生成一句客观、严格的中文评价。不要使用鼓励性或模棱两可的语言。\n\n请确保你的整个回答都是一个严格遵循schema的JSON对象，不要添加任何额外的解释或文本。`;
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: { responseMimeType: "application/json", responseSchema: fullDayAnalysisSchema },
        });
        return JSON.parse(response.text) as FullDayAnalysisData;
    } catch (e) {
        console.error("Error analyzing full day:", e);
        throw e;
    }
};

export const generateAnalysisReport = async (userInfo: UserInfo, logs: DailyLogEntry[]): Promise<AnalysisReportData> => {
    const ai = getAiClient();
    const prompt = `你是一位严格、专业的健身教练和营养专家，以客观、数据驱动和深度分析著称。\n
你的任务是分析以下用户的个人资料和最近最多60天的每日记录，并严格按照JSON schema返回一份全面、专业且充满洞察的中文分析报告。\n
你的分析必须是真实、直接、一针见血的。避免空洞的鼓励，专注于提供可执行的建议和深刻的见解。\n\n
**用户个人资料:** ${JSON.stringify(userInfo)}\n
**用户每日记录 (最近60天):** ${JSON.stringify(logs.slice(-60))}\n\n
**核心分析指令:**\n
1.  **数据为王**: 所有指标（得分、平均值、趋势）必须严格基于所提供的数据进行计算。\n
2.  **全面分析**: 利用所有可用的数据字段，包括体重、腰围、饮水、睡眠、运动消耗、饮食详情和宏量营养素。\n
3.  **精准计算**: 确保 \\\`totalWaistReduction\\\`, \\\`avgActivityExpenditure\\\`, \\\`avgWaterL\\\`, 和 \\\`macroDistribution\\\` 等指标计算准确无误。\n
4.  **专业评论**: 基于计算出的数据，提供关于饮水、睡眠、宏量营养素分配的专业、科学的评论。\n
5.  **深度洞察 (新)**:\n
    a.  **个性化运动处方 (exercisePrescription)**: 基于用户的减重趋势和现有活动水平，设计一个具体的、个性化的运动计划。如果用户已有运动习惯，提出优化建议；如果缺乏运动，提供一个可行的起点。\n
    b.  **为你推荐的超级食物 (recommendedSuperfoods)**: 根据用户的饮食记录，识别其可能缺乏的营养素或可以优化的方面，推荐3-5种具体的“超级食物”，并说明理由（例如，增加饱腹感、提供关键微量元素、富含蛋白质等）。\n
    c.  **潜在风险与关注点 (potentialRisks)**: 识别数据中可能预示问题的模式。例如：睡眠时长与体重停滞是否相关？热量缺口是否过大或过小？是否存在饮食种类过于单一的情况？提出1-3个最需要用户警惕的风险点。\n
    d.  **周度回顾与展望 (weeklyOutlook)**: 用一段激励人心但又切合实际的话，总结最近一周的核心表现，并为下一周设定一个明确的焦点或小目标。\n
6.  **直言不讳**: 'achievements' 和 'actionableTips' 必须具体、可操作，直指核心问题和成就。\n\n
请确保你的整个回答都严格遵循JSON格式，并且所有文本都使用简体中文。`;
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: analysisReportSchema },
        });
        return JSON.parse(response.text) as AnalysisReportData;
    } catch (e) {
        console.error("Error generating report:", e);
        throw e;
    }
};

export const sendChatMessageStream = async (
    history: ChatMessage[],
    newUserText: string,
    newUserImage: File | null
): Promise<AsyncGenerator<GenerateContentResponse>> => {
    const ai = getAiClient();
    
    const modelHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const newUserMessageParts: Part[] = [];
    if (newUserImage) {
        // Image should come first for vision models
        newUserMessageParts.push(await fileToGenerativePart(newUserImage));
    }
    if (newUserText.trim()) {
        newUserMessageParts.push({ text: newUserText });
    }


    if (newUserMessageParts.length === 0) throw new Error("No user input provided.");

    const systemInstruction = `你是一位严格但专业的瘦身教练。你的回答必须是客观、严谨且基于事实的。\n- 当用户提问时，提供直接、准确的答案。\n- 当用户上传食物图片时，进行严格的分析，识别食物并提供热量和营养的估算。你的评价应该是中立的，例如“这份餐食估算热量为X，蛋白质Y克...”，而不是“这看起来很美味”。\n- 你的核心目标是提供真实、有帮助的指导，而不是一味地鼓励。\n- 保持回答的专业性和准确性，所有回答都必须使用中文。`;
    
    try {
        const contents = [...modelHistory, { role: 'user', parts: newUserMessageParts }];
        
        return ai.models.generateContentStream({
            model: modelName,
            contents,
            config: { systemInstruction },
        });
    } catch (e) {
        console.error("Error sending chat message:", e);
        throw e;
    }
};