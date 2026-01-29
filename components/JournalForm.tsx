
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { JournalEntry } from '../types';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { getSentimentScore, connectToLiveTranscription, createPcmBlob, checkForCrisis } from '../services/geminiService';

interface JournalFormProps {
    onAddEntry: (entry: Omit<JournalEntry, 'id' | 'userId'>) => void;
    onCrisisDetected: () => void;
}

const MicIcon = ({ recording }: { recording: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${recording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const JournalForm: React.FC<JournalFormProps> = ({ onAddEntry, onCrisisDetected }) => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);

    const stopLiveSession = useCallback(() => {
        if (sessionPromise.current) {
            sessionPromise.current.then(session => session.close());
            sessionPromise.current = null;
        }
        if (mediaStream.current) {
            mediaStream.current.getTracks().forEach(track => track.stop());
            mediaStream.current = null;
        }
        if (scriptProcessor.current) {
            scriptProcessor.current.disconnect();
            scriptProcessor.current = null;
        }
        if (inputAudioContext.current) {
            inputAudioContext.current.close();
            inputAudioContext.current = null;
        }
        setIsLiveActive(false);
        setIsConnecting(false);
    }, []);

    const onMessage = async (message: LiveServerMessage) => {
        const textChunk = message.serverContent?.inputTranscription?.text;
        if (textChunk) {
            setText(prev => (prev && !prev.endsWith(' ') ? prev + ' ' + textChunk : prev + textChunk).trimStart());
        }
    };

    const startLiveSession = async () => {
        setIsConnecting(true);
        try {
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sessionPromise.current = connectToLiveTranscription({
                onOpen: () => {
                    const source = inputAudioContext.current!.createMediaStreamSource(mediaStream.current!);
                    scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.current.onaudioprocess = (audioEvent) => {
                        const inputData = audioEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        if (sessionPromise.current) {
                            sessionPromise.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        }
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current!.destination);
                    setIsConnecting(false);
                    setIsLiveActive(true);
                },
                onMessage,
                onError: (e) => { console.error('Session error:', e); stopLiveSession(); },
                onClose: () => stopLiveSession()
            });
        } catch (error) {
            console.error("Failed to start live session:", error);
            alert("Could not start live transcription. Please check microphone permissions.");
            stopLiveSession();
        }
    };
    
    const handleToggleLiveSession = () => {
        if (isLiveActive) {
            stopLiveSession();
        } else {
            startLiveSession();
        }
    };
    
    useEffect(() => {
        // Cleanup on unmount
        return () => stopLiveSession();
    }, [stopLiveSession]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedText = text.trim();
        if (!trimmedText) return;

        setIsLoading(true);
        try {
            const isCrisis = await checkForCrisis(trimmedText);
            if (isCrisis) {
                onCrisisDetected();
                setIsLoading(false);
                return; 
            }

            const sentimentData = await getSentimentScore(trimmedText);
            const newEntry = {
                text: trimmedText,
                timestamp: Date.now(),
                moodScore: sentimentData.score,
                sentiment: sentimentData.sentiment,
            };
            onAddEntry(newEntry);
            setText('');
        } catch (error) {
            console.error("Error submitting entry:", error);
            alert("Failed to save entry. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a new journal entry or use your voice..."
                    className="w-full h-32 p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    rows={5}
                />
                 <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={handleToggleLiveSession}
                        disabled={isConnecting}
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                        aria-label={isLiveActive ? 'Stop live transcription' : 'Start live transcription'}
                    >
                        <MicIcon recording={isLiveActive} />
                    </button>
                    {isConnecting && <span className="text-sm text-gray-400">Connecting mic...</span>}
                    {isLiveActive && <span className="text-sm text-red-400 animate-pulse">Live transcription active...</span>}
                    <button
                        type="submit"
                        disabled={isLoading || isLiveActive || isConnecting}
                        className="px-6 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Saving...' : 'Save Entry'}
                    </button>
                 </div>
            </form>
        </div>
    );
};

export default JournalForm;
