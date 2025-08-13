
import type { UserInfo, DailyLogEntry, AnalysisReportData, AnalyzedMealData, FullDayAnalysisData, ChatMessage } from '../types';
import type { Part } from "@google/genai";

// Helper to convert a File object to a base64 string for JSON transfer
const fileToBase64 = async (file: File): Promise<{ base64: string, mimeType: string }> => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return { base64, mimeType: file.type };
};

async function callProxy(action: string, payload: any): Promise<any> {
    const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "An unknown API error occurred" }));
        console.error(`API proxy call failed for action ${action}:`, errorData);
        throw new Error(errorData.details || errorData.error || `Request failed with status ${response.status}`);
    }
    
    // For streaming chat, the response body is handled directly by the caller.
    if (response.headers.get('Content-Type')?.includes('text/plain')) {
        return response.body;
    }

    return response.json();
}

export const analyzeMealInput = async (userInput: string, image: File | null = null, mealTypeHint: string): Promise<AnalyzedMealData | null> => {
    if (!userInput.trim() && !image) return null;
    
    try {
        let imagePayload = null;
        if (image) {
            const { base64, mimeType } = await fileToBase64(image);
            imagePayload = { imageBase64: base64, imageMimeType: mimeType };
        }

        const payload = {
            userInput,
            ...imagePayload,
            mealTypeHint,
        };
        return await callProxy('analyzeMealInput', payload);
    } catch (error) {
        console.error("Error analyzing meal input via proxy:", error);
        return null;
    }
};

export const analyzeFullDayNutrition = async (logData: DailyLogEntry): Promise<FullDayAnalysisData | null> => {
    try {
        return await callProxy('analyzeFullDayNutrition', { logData });
    } catch (error) {
        console.error("Error analyzing full day nutrition via proxy:", error);
        return null;
    }
}

export const generateAnalysisReport = async (userInfo: UserInfo, logs: DailyLogEntry[]): Promise<AnalysisReportData | null> => {
  try {
      return await callProxy('generateAnalysisReport', { userInfo, logs });
  } catch (error) {
    console.error("Error generating analysis report via proxy:", error);
    return null;
  }
};

// Chat functionality is now stateless from the client's perspective.
// It sends the necessary context in each call.
export const sendChatMessageStream = async (
    history: ChatMessage[],
    newUserText: string,
    newUserImage: File | null
): Promise<ReadableStream<Uint8Array> | null> => {
    try {
        // Convert history to a simplified format for the model.
        // We assume past messages are text-only to keep it simple. Images in history are not resent.
        const modelHistory = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        // Prepare the new message parts, which may include an image.
        const newUserMessageParts: Part[] = [];
        if (newUserImage) {
            const { base64, mimeType } = await fileToBase64(newUserImage);
            newUserMessageParts.push({ inlineData: { data: base64, mimeType } });
        }
        if (newUserText.trim()) {
            newUserMessageParts.push({ text: newUserText });
        }

        if (newUserMessageParts.length === 0) return null;

        const payload = { modelHistory, newUserMessageParts };
        
        // The proxy will return a ReadableStream for this action.
        const stream = await callProxy('chat', payload);
        return stream;

    } catch (error) {
        console.error("Error sending chat message via proxy:", error);
        return null;
    }
};
