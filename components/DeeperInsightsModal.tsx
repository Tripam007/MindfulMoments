
import React from 'react';
import type { JournalEntry } from '../types';

interface DeeperInsightsModalProps {
    isOpen: boolean;
    onClose: () => void;
    entry: JournalEntry | null;
    insights: string;
    isLoading: boolean;
}

const DeeperInsightsModal: React.FC<DeeperInsightsModalProps> = ({ isOpen, onClose, entry, insights, isLoading }) => {
    if (!isOpen || !entry) return null;
    
    // A simple markdown parser for bold and lists
    const parseMarkdown = (text: string) => {
        return text
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('* ')) {
                    return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
                }
                if (line.match(/\*\*(.*?)\*\*/)) {
                     return <p key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                }
                return <p key={index} className="mb-2">{line}</p>;
            });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-purple-400">Deeper Insights</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="overflow-y-auto space-y-6">
                    <div className="bg-gray-700 p-4 rounded-md">
                        <p className="text-sm font-semibold text-gray-300 mb-2">Original Entry:</p>
                        <p className="text-gray-200 italic whitespace-pre-wrap">"{entry.text}"</p>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-md">
                        <p className="text-sm font-semibold text-gray-300 mb-2">AI-Powered Reflection:</p>
                        {isLoading ? (
                            <div className="flex justify-center items-center h-24">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                            </div>
                        ) : (
                            <div className="text-gray-300 prose prose-invert prose-sm max-w-none">
                                {parseMarkdown(insights)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 text-right">
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

export default DeeperInsightsModal;
