
// /api/proxy.ts
// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Part } from "@google/genai";

// Schemas copied from original frontend services/geminiService.ts
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

// Helper to stream Gemini response to Vercel response
async function streamToResponse(stream: AsyncGenerator<any>, res: VercelResponse) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
            res.write(text);
        }
    }
    res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Moved API Key check and AI initialization inside the handler for better error reporting.
    if (!process.env.API_KEY) {
        console.error("Vercel Function Error: API_KEY environment variable is not set.");
        return res.status(500).json({
            error: 'Server configuration error.',
            details: 'The API_KEY environment variable is not set on the server. Please check your Vercel project settings and trigger a new deployment for the changes to take effect.'
        });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = "gemini-2.5-flash";

    try {
        const { action, payload } = req.body;

        switch (action) {
            case 'analyzeMealInput': {
                const { userInput, imageBase64, imageMimeType, mealTypeHint } = payload;
                if (!userInput?.trim() && !imageBase64) {
                    return res.status(400).json({ error: 'User input or image is required.' });
                }

                const promptText = `你是一位专业的营养分析师，以精准和客观著称。请严格根据用户提供的餐食图片和/或文字描述，按照JSON schema返回分析结果。\n\n分析上下文:\n- 餐别: "${mealTypeHint}"\n- 用户文字描述: "${userInput || '无'}"\n\n分析标准:\n1.  **主要依据**: 如果提供了图片，以图片内容为主要分析对象。文字描述仅作为补充。\n2.  **精准估算**: 识别所有食物和饮料，并尽可能准确地估算总热量、蛋白质、碳水化合物和脂肪含量。\n3.  **客观命名**: 生成一个简洁、客观的餐食名称来概括这顿饭，例如“烤鸡胸肉配西兰花”。\n\n你的回答必须是严格遵循schema的JSON对象，不包含任何解释或附加文本。`;
                
                let contents: string | { parts: Part[] };
                if (imageBase64 && imageMimeType) {
                    contents = { parts: [{ inlineData: { data: imageBase64, mimeType: imageMimeType } }, { text: promptText }] };
                } else {
                    contents = promptText;
                }

                const response = await ai.models.generateContent({
                    model,
                    contents,
                    config: { responseMimeType: "application/json", responseSchema: singleMealAnalysisSchema },
                });
                
                return res.status(200).json(JSON.parse(response.text));
            }

            case 'analyzeFullDayNutrition': {
                const { logData } = payload;
                const promptText = `你是一位严格、专业的瘦身教练。你的任务是基于客观数据，提供严谨、真实的分析。请分析用户提供的单日完整记录，并严格按照JSON schema返回分析结果。\n\n用户的单日记录:\n${JSON.stringify(logData)}\n\n你的任务是:\n1.  **分析摄入**: 精准识别所有餐食记录，估算全天摄入的总热量、蛋白质、碳水化合物和脂肪。\n2.  **分析消耗**: 根据用户的运动记录，估算当天的总运动消耗热量。无记录则为0。\n3.  **生成小结 (dailySummary)**: 基于所有数据（摄入、消耗、热量缺口等），生成一句客观、严格的中文评价。不要使用鼓励性或模棱两可的语言。\n\n请确保你的整个回答都是一个严格遵循schema的JSON对象，不要添加任何额外的解释或文本。`;

                const response = await ai.models.generateContent({
                    model,
                    contents: promptText,
                    config: { responseMimeType: "application/json", responseSchema: fullDayAnalysisSchema },
                });
                return res.status(200).json(JSON.parse(response.text));
            }

            case 'generateAnalysisReport': {
                const { userInfo, logs } = payload;
                const prompt = `你是一位严格、专业的瘦身教练，以客观和严谨的数据分析著称。\n你的任务是分析以下用户数据，并严格按照JSON schema返回一份专业的中文分析报告。\n你的评价必须是真实、直接、一针见血的。避免任何空洞的鼓励，专注于基于数据的评价和可执行的建议。\n\n用户的个人资料是: ${JSON.stringify(userInfo)}。\n用户的每日记录是 (只显示最近60天): ${JSON.stringify(logs.slice(-60))}。\n\n分析的核心原则:\n1.  **数据为王**: 所有指标（得分、平均值、趋势）必须严格基于所提供的数据。\n2.  **全面分析**: 利用所有可用的数据字段进行分析，包括体重、腰围、饮水、睡眠、运动消耗和宏量营养素。\n3.  **精准计算**: \`totalWaistReduction\`, \`avgActivityExpenditure\`, \`avgWaterL\`, \`macroDistribution\`等指标必须精确计算。\n4.  **专业评论**: 基于计算出的数据，提供关于饮水、宏量营养素分配的专业评论。\n5.  **直言不讳**: 'achievements'和'suggestions'必须具体、可操作。\n\n请确保你的整个回答都严格遵循JSON格式，并且所有文本都是中文。`;

                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: analysisReportSchema },
                });
                return res.status(200).json(JSON.parse(response.text));
            }

            case 'chat': {
                const { modelHistory, newUserMessageParts } = payload;
                
                const systemInstruction = `你是一位严格但专业的瘦身教练。你的回答必须是客观、严谨且基于事实的。\n- 当用户提问时，提供直接、准确的答案。\n- 当用户上传食物图片时，进行严格的分析，识别食物并提供热量和营养的估算。你的评价应该是中立的，例如“这份餐食估算热量为X，蛋白质Y克...”，而不是“这看起来很美味”。\n- 你的核心目标是提供真实、有帮助的指导，而不是一味地鼓励。\n- 保持回答的专业性和准确性，所有回答都必须使用中文。`;
                
                const contents = [...modelHistory, { role: 'user', parts: newUserMessageParts }];

                const stream = await ai.models.generateContentStream({
                    model,
                    contents,
                    config: { systemInstruction },
                });
                
                await streamToResponse(stream, res);
                return; // End execution after streaming
            }

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error: any) {
        console.error(`Error in API proxy for action [${req.body?.action}]:`, error);
        res.status(500).json({ error: 'An internal server error occurred', details: error.message });
    }
}
