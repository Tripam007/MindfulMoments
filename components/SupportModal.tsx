
import React, { useState, useEffect, useRef } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData } from '../utils/audioUtils';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VolumeUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);


const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const audioSource = useRef<AudioBufferSourceNode | null>(null);

    const supportiveMessage = "It looks like things might have been a bit tough lately. Remember that it's okay to not be okay, and your feelings are valid. Taking a moment for yourself can make a big difference. Please consider reaching out to a friend, family member, or a professional if you need to talk.";

    // Effect to pre-fetch audio when modal opens
    useEffect(() => {
        if (isOpen && !audioBuffer && !isLoadingAudio) {
            // Initialize AudioContext if it doesn't exist
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

            setIsLoadingAudio(true);
            generateSpeech(supportiveMessage)
                .then(base64Audio => {
                    if (base64Audio && audioContext.current) {
                        return decodeAudioData(decode(base64Audio), audioContext.current, 24000, 1);
                    }
                    return Promise.reject("Failed to generate or receive audio data.");
                })
                .then(buffer => {
                    setAudioBuffer(buffer);
                })
                .catch(error => {
                    console.error("Error pre-fetching audio:", error);
                })
                .finally(() => {
                    setIsLoadingAudio(false);
                });
        }

        // Cleanup audio when modal is closed
        return () => {
            if (audioSource.current) {
                audioSource.current.stop();
                setIsPlaying(false);
            }
        };
    }, [isOpen, audioBuffer, isLoadingAudio, supportiveMessage]);

    const handlePlayAudio = () => {
        if (!audioContext.current || !audioBuffer || isPlaying) return;

        try {
            const source = audioContext.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.current.destination);
            source.onended = () => {
                setIsPlaying(false);
                audioSource.current = null;
            };
            source.start();
            audioSource.current = source;
            setIsPlaying(true);
        } catch (error) {
            console.error("Error playing audio:", error);
        }
    };

    if (!isOpen) return null;
    
    const isButtonDisabled = isLoadingAudio || isPlaying || !audioBuffer;
    let buttonText = 'Read Aloud';
    if (isLoadingAudio) {
        buttonText = 'Loading Audio...';
    } else if (isPlaying) {
        buttonText = 'Playing...';
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-lg w-full m-4 shadow-xl">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">A Gentle Check-in</h2>
                <p className="text-gray-300 mb-6">{supportiveMessage}</p>
                
                <div className="bg-gray-700 p-4 rounded-md">
                    <h3 className="font-semibold mb-3 text-gray-200">Wellness Resources</h3>
                    <ul className="list-disc list-inside space-y-2 text-indigo-400">
                        <li><a href="https://www.mentalhealth.gov" target="_blank" rel="noopener noreferrer" className="hover:underline">MentalHealth.gov</a> - General Information</li>
                        <li><a href="https://988lifeline.org/" target="_blank" rel="noopener noreferrer" className="hover:underline">988 Suicide & Crisis Lifeline</a> - Immediate Support</li>
                        <li><a href="https://www.nami.org/Home" target="_blank" rel="noopener noreferrer" className="hover:underline">NAMI</a> - National Alliance on Mental Illness</li>
                    </ul>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={handlePlayAudio}
                        disabled={isButtonDisabled}
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-wait"
                    >
                        <VolumeUpIcon />
                        {buttonText}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportModal;
