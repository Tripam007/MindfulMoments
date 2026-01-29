
import { GoogleGenAI, Type, Modality, GenerateContentResponse, LiveSession, LiveServerMessage } from "@google/genai";
import type { User } from '../types';
import { encode } from '../utils/audioUtils';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key.");
}

const getAIClient = () => new GoogleGenAI({ apiKey: API_KEY });

export const checkForCrisis = async (text: string): Promise<boolean> => {
    if (!text || text.trim().length < 10) { // Basic check to avoid API calls for very short/empty text
        return false;
    }
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the following text for any explicit mention or strong implication of immediate self-harm, suicide, or a life-threatening crisis. Respond with only a single word: "CRISIS" if such content is present, otherwise respond with "OK". Do not provide any other explanation or text. Text: "${text}"`,
        });
        return response.text.trim().toUpperCase() === 'CRISIS';
    } catch (error) {
        console.error("Error checking for crisis:", error);
        // Fail safe: if the check fails, assume it's not a crisis to avoid false alarms.
        return false;
    }
};

export const getSentimentScore = async (text: string): Promise<{ score: number; sentiment: 'Positive' | 'Negative' | 'Neutral' }> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the sentiment of the following journal entry. Respond with only a valid JSON object in the format {"score": number, "sentiment": "string"} where 'score' is a normalized mood score from 1 (very negative) to 10 (very positive), and 'sentiment' is one of 'Positive', 'Negative', or 'Neutral'. Do not include any other text or markdown formatting. Journal Entry: "${text}"`,
        });
        
        const jsonString = response.text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonString);
        return result;
    } catch (error) {
        console.error("Error getting sentiment score:", error);
        // Fallback for safety
        return { score: 5, sentiment: 'Neutral' };
    }
};

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: audioBase64 } },
                    { text: "Transcribe this audio recording of a journal entry." }
                ]
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return "Audio transcription failed.";
    }
};

export const getDeeperInsights = async (text: string): Promise<string> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `You are an empathetic wellness assistant. Analyze the following journal entry, but do not provide medical advice or diagnosis. Instead, offer gentle, supportive reflections, identify potential underlying themes or emotions, and ask thoughtful questions that might help the user explore their feelings further. Format your response using markdown. Maintain a compassionate and non-judgmental tone. Journal Entry: "${text}"`,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting deeper insights:", error);
        return "Could not generate deeper insights at this time.";
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

export const connectToLiveConversation = async (callbacks: {
    onOpen: () => void,
    onMessage: (message: LiveServerMessage) => Promise<void>,
    onError: (error: ErrorEvent) => void,
    onClose: (event: CloseEvent) => void
}): Promise<LiveSession> => {
    const ai = getAIClient();
    return await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a compassionate, non-judgmental listening AI named Kai. Your role is to provide a safe space for users to talk about their feelings. Listen actively, offer empathetic reflections, and ask gentle, open-ended questions. Do not give advice, solve problems, or provide medical diagnoses. Keep your responses calm and brief.',
        },
    });
};


export const connectToLiveTranscription = async (callbacks: {
    onOpen: () => void;
    onMessage: (message: LiveServerMessage) => Promise<void>;
    onError: (error: ErrorEvent) => void;
    onClose: (event: CloseEvent) => void;
}): Promise<LiveSession> => {
    const ai = getAIClient();
    return await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO], // Required by API, but system prompt will prevent audio output
            inputAudioTranscription: {},
            systemInstruction: 'You are a highly accurate and silent transcription service. Transcribe the user\'s speech into text. Do not respond, comment, or generate any conversational output. Only provide the transcription.',
        },
    });
};


export function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
