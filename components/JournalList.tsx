
import React from 'react';
import type { JournalEntry } from '../types';

interface JournalListProps {
    entries: JournalEntry[];
    onViewInsights: (entry: JournalEntry) => void;
}

const getMoodColor = (score: number) => {
    if (score > 7) return 'bg-green-500';
    if (score > 4) return 'bg-yellow-500';
    return 'bg-red-500';
};

const JournalList: React.FC<JournalListProps> = ({ entries, onViewInsights }) => {
    return (
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Past Entries</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {entries.length > 0 ? entries.map(entry => (
                    <div key={entry.id} className="p-4 bg-gray-700 rounded-md">
                        <div className="flex justify-between items-start">
                           <div>
                                <p className="text-sm text-gray-400">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </p>
                                <p className="mt-2 text-gray-200 whitespace-pre-wrap">{entry.text}</p>
                           </div>
                           <div className="flex flex-col items-center ml-4 flex-shrink-0">
                               <div className={`w-4 h-4 rounded-full ${getMoodColor(entry.moodScore)}`} title={`Mood Score: ${entry.moodScore}/10`}></div>
                               <span className="text-xs mt-1 text-gray-400">{entry.moodScore}/10</span>
                           </div>
                        </div>
                        <div className="mt-3 text-right">
                             <button
                                onClick={() => onViewInsights(entry)}
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                                Get Deeper Insights
                            </button>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-500">No entries yet.</p>
                )}
            </div>
        </div>
    );
};

export default JournalList;
