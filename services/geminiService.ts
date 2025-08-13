
import { GoogleGenAI, GenerateContentResponse, Chat, Type } from "@google/genai";
import { UserInfo, DailyLogEntry, AnalysisReportData, AnalyzedMealData, FullDayAnalysisData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
        hydrationAnalysis: { // New
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
                macroDistribution: { // New
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
        suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "一个字符串数组，为用户提供最重要的、可行的改进建议（最多3-4个）。"
        }
    },
    required: ['progressScore', 'keyMetrics', 'consistency', 'weeklySummary', 'sleepAnalysis', 'hydrationAnalysis', 'nutritionInsights', 'achievements', 'suggestions']
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
        dailySummary: { type: Type.STRING, description: "根据全天的数据（摄入、消耗、运动、缺口、体重变化等）生成一个简短的中文分析小结。例如：'热量缺口达标，体重有下降趋势，很棒的一天！'" },
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


export const analyzeMealInput = async (userInput: string, image: File | null = null, mealTypeHint: string): Promise<AnalyzedMealData | null> => {
    if (!userInput.trim() && !image) return null;
    
    const model = "gemini-2.5-flash";
    const promptText = `
        你是一位专业的营养分析师，以精准和客观著称。请严格根据用户提供的餐食图片和/或文字描述，按照JSON schema返回分析结果。

        分析上下文:
        - 餐别: "${mealTypeHint}"
        - 用户文字描述: "${userInput || '无'}"
        
        分析标准:
        1.  **主要依据**: 如果提供了图片，以图片内容为主要分析对象。文字描述仅作为补充。
        2.  **精准估算**: 识别所有食物和饮料，并尽可能准确地估算总热量、蛋白质、碳水化合物和脂肪含量。
        3.  **客观命名**: 生成一个简洁、客观的餐食名称来概括这顿饭，例如“烤鸡胸肉配西兰花”。

        你的回答必须是严格遵循schema的JSON对象，不包含任何解释或附加文本。
    `;

    let contents: string | { parts: any[] };

    if (image) {
        // For multimodal requests, structure with parts array
        contents = {
            parts: [
                await fileToGenerativePart(image),
                { text: promptText }
            ]
        };
    } else {
        // For text-only requests, send the prompt as a simple string
        contents = promptText;
    }

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: singleMealAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        if (jsonText) {
             try {
                return JSON.parse(jsonText) as AnalyzedMealData;
            } catch(e) {
                 console.error("Failed to parse JSON response from AI for meal analysis:", jsonText, e);
                 return null;
            }
        }
        console.error("Received empty or invalid response from AI for meal analysis.");
        return null;
    } catch (error) {
        console.error("Error analyzing meal input:", error);
        return null;
    }
};

export const analyzeFullDayNutrition = async (logData: DailyLogEntry): Promise<FullDayAnalysisData | null> => {

    const model = "gemini-2.5-flash";
    const promptText = `
        你是一位严格、专业的瘦身教练。你的任务是基于客观数据，提供严谨、真实的分析。请分析用户提供的单日完整记录，并严格按照JSON schema返回分析结果。

        用户的单日记录:
        ${JSON.stringify(logData)}

        你的任务是:
        1.  **分析摄入**: 精准识别所有餐食记录，估算全天摄入的总热量、蛋白质、碳水化合物和脂肪。
        2.  **分析消耗**: 根据用户的运动记录，估算当天的总运动消耗热量。无记录则为0。
        3.  **生成小结 (dailySummary)**: 基于所有数据（摄入、消耗、热量缺口等），生成一句客观、严格的中文评价。不要使用鼓励性或模棱两可的语言。
            - 优秀示例: "热量缺口为-950kcal，摄入控制得当，运动量充足，成功实现了显著的热量缺口，这有助于您的体重管理目标。继续保持。"
            - 差评示例: "热量摄入超出消耗500kcal，未形成有效缺口。需审视今日饮食或增加运动量。"
            - 必须指出核心问题或成功之处。

        请确保你的整个回答都是一个严格遵循schema的JSON对象，不要添加任何额外的解释或文本。
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: promptText,
            config: {
                responseMimeType: "application/json",
                responseSchema: fullDayAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        if (jsonText) {
             try {
                return JSON.parse(jsonText) as FullDayAnalysisData;
            } catch(e) {
                 console.error("Failed to parse JSON response from AI for full day analysis:", jsonText, e);
                 return null;
            }
        }
        console.error("Received empty or invalid response from AI for full day analysis.");
        return null;
    } catch (error) {
        console.error("Error analyzing full day nutrition:", error);
        return null;
    }
}


export const generateAnalysisReport = async (userInfo: UserInfo, logs: DailyLogEntry[]): Promise<AnalysisReportData | null> => {
  const model = "gemini-2.5-flash";
  const prompt = `
    你是一位严格、专业的瘦身教练，以客观和严谨的数据分析著称。
    你的任务是分析以下用户数据，并严格按照JSON schema返回一份专业的中文分析报告。
    你的评价必须是真实、直接、一针见血的。避免任何空洞的鼓励，专注于基于数据的评价和可执行的建议。

    用户的个人资料是: ${JSON.stringify(userInfo)}。
    用户的每日记录是 (只显示最近60天): ${JSON.stringify(logs.slice(-60))}。

    分析的核心原则:
    1.  **数据为王**: 所有指标（得分、平均值、趋势）必须严格基于所提供的数据。
    2.  **全面分析**: 利用所有可用的数据字段进行分析，包括体重、腰围、饮水、睡眠、运动消耗和宏量营养素。
    3.  **精准计算**:
        - \`totalWaistReduction\`: 计算第一次和最后一次有效腰围记录之间的差值。
        - \`avgActivityExpenditure\`: 计算所有记录日中\`estimatedExpenditure\`的平均值。
        - \`avgWaterL\`: 计算所有记录日中\`waterL\`的平均值。
        - \`macroDistribution\`: 根据平均摄入量计算。首先计算所有记录日中\`proteinG\`, \`carbsG\`, \`fatG\`, \`actualIntake\`的平均值。然后使用公式 (平均蛋白*4 / 平均总摄入*100), (平均碳水*4 / 平均总摄入*100), (平均脂肪*9 / 平均总摄入*100) 来计算百分比。确保三者之和约等于100。
    4.  **专业评论**: 基于计算出的数据，提供关于饮水、宏量营养素分配的专业评论。
    5.  **直言不讳**: 'achievements'部分只列出真正通过数据验证的、有意义的成就。'suggestions'部分必须是具体、可操作的指令，而不是模糊的建议。例如，用“将每日平均热量摄入减少200kcal”代替“注意饮食”。

    请确保你的整个回答都严格遵循JSON格式，并且所有文本都是中文。
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisReportSchema,
      },
    });
    const jsonText = response.text.trim();
    // A quick check to see if we got a valid-looking JSON object.
    if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
        return JSON.parse(jsonText) as AnalysisReportData;
    }
    console.error("Received non-JSON response from AI:", jsonText);
    return null;
  } catch (error) {
    console.error("Error generating analysis report:", error);
    return null;
  }
};

export const createChat = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `你是一位严格但专业的瘦身教练。你的回答必须是客观、严谨且基于事实的。
      - 当用户提问时，提供直接、准确的答案。
      - 当用户上传食物图片时，进行严格的分析，识别食物并提供热量和营养的估算。你的评价应该是中立的，例如“这份餐食估算热量为X，蛋白质Y克...”，而不是“这看起来很美味”。
      - 你的核心目标是提供真实、有帮助的指导，而不是一味地鼓励。
      - 保持回答的专业性和准确性，所有回答都必须使用中文。`,
    },
  });
};

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};