
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LiveSession, LiveServerMessage } from '@google/genai';
import { connectToLiveConversation, createPcmBlob, checkForCrisis } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

type Transcription = {
    author: 'user' | 'kai';
    text: string;
};

interface TalkItOutProps {
    onCrisisDetected: () => void;
}

const TalkItOut: React.FC<TalkItOutProps> = ({ onCrisisDetected }) => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState<Transcription[]>([]);
    
    const sessionPromise = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContext = useRef<AudioContext | null>(null);
    const outputAudioContext = useRef<AudioContext | null>(null);
    const mediaStream = useRef<MediaStream | null>(null);
    const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
    
    let currentInputTranscription = useRef('');
    let currentOutputTranscription = useRef('');
    let nextStartTime = useRef(0);
    const audioSources = useRef<Set<AudioBufferSourceNode>>(new Set());

    const onMessage = useCallback(async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription?.text) {
            const text = message.serverContent.outputTranscription.text;
            currentOutputTranscription.current += text;
        } else if (message.serverContent?.inputTranscription?.text) {
            const text = message.serverContent.inputTranscription.text;
            currentInputTranscription.current += text;
        }

        if (message.serverContent?.turnComplete) {
            const fullInput = currentInputTranscription.current.trim();
            const fullOutput = currentOutputTranscription.current.trim();
            
            if (fullInput) {
                checkForCrisis(fullInput).then(isCrisis => {
                    if (isCrisis) {
                        onCrisisDetected();
                    }
                });
            }

            setTranscript(prev => {
                const newTranscript = [...prev];
                if (fullInput) newTranscript.push({ author: 'user', text: fullInput });
                if (fullOutput) newTranscript.push({ author: 'kai', text: fullOutput });
                return newTranscript;
            });
            
            currentInputTranscription.current = '';
            currentOutputTranscription.current = '';
        }

        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio && outputAudioContext.current) {
            nextStartTime.current = Math.max(nextStartTime.current, outputAudioContext.current.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
            const source = outputAudioContext.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.current.destination);
            source.onended = () => audioSources.current.delete(source);
            source.start(nextStartTime.current);
            nextStartTime.current += audioBuffer.duration;
            audioSources.current.add(source);
        }

        if (message.serverContent?.interrupted) {
            for (const source of audioSources.current.values()) {
                source.stop();
            }
            audioSources.current.clear();
            nextStartTime.current = 0;
        }
    }, [onCrisisDetected]);

    const startSession = async () => {
        if (isSessionActive) return;
        setIsConnecting(true);
        setTranscript([]);

        try {
            inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            sessionPromise.current = connectToLiveConversation({
                onOpen: () => {
                    const source = inputAudioContext.current!.createMediaStreamSource(mediaStream.current!);
                    scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.current.onaudioprocess = (audioEvent) => {
                        const inputData = audioEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        if(sessionPromise.current) {
                           sessionPromise.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                        }
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current!.destination);
                    setIsConnecting(false);
                    setIsSessionActive(true);
                },
                onMessage,
                onError: (e) => { console.error('Session error:', e); stopSession(); },
                onClose: () => { console.log('Session closed'); stopSession(); }
            });

        } catch (error) {
            console.error("Failed to start session:", error);
            alert("Could not start session. Please check microphone permissions.");
            setIsConnecting(false);
        }
    };

    const stopSession = useCallback(() => {
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
        if (outputAudioContext.current) {
            outputAudioContext.current.close();
            outputAudioContext.current = null;
        }
        setIsSessionActive(false);
        setIsConnecting(false);
    }, []);

    useEffect(() => {
        return () => stopSession();
    }, [stopSession]);

    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">Talk It Out with Kai</h2>
            <p className="text-sm text-gray-400 mb-4">Have a real-time, supportive conversation. Kai is here to listen without judgment. Just start the session and begin speaking.</p>
            
            <div className="flex justify-center mb-4">
                <button
                    onClick={isSessionActive ? stopSession : startSession}
                    disabled={isConnecting}
                    className={`px-8 py-3 font-bold text-lg rounded-full transition-all duration-300 ${
                        isSessionActive 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:bg-gray-500 disabled:cursor-wait`}
                >
                    {isConnecting ? 'Connecting...' : isSessionActive ? 'End Session' : 'Start Session'}
                </button>
            </div>

            <div className="h-80 bg-gray-900 rounded-md p-4 overflow-y-auto space-y-4">
                {transcript.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        {isSessionActive ? 'Listening...' : 'Start a session to see the transcript.'}
                    </div>
                )}
                {transcript.map((item, index) => (
                    <div key={index} className={`flex ${item.author === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${item.author === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="text-sm">{item.text}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TalkItOut;
