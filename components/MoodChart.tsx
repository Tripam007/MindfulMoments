
import React from 'react';
import type { JournalEntry } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MoodChartProps {
    data: JournalEntry[];
}

const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
    const chartData = data
        .map(entry => ({
            name: new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            moodScore: entry.moodScore,
            timestamp: entry.timestamp,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="p-4 bg-gray-800 rounded-lg shadow-md h-64">
             <h3 className="font-semibold text-lg mb-4 text-center">Mood Trend</h3>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart
                        data={chartData}
                        margin={{
                            top: 5,
                            right: 20,
                            left: -10,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                        <YAxis domain={[1, 10]} stroke="#A0AEC0" fontSize={12} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#2D3748', border: '1px solid #4A5568' }} 
                            labelStyle={{ color: '#E2E8F0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '14px' }}/>
                        <Line type="monotone" dataKey="moodScore" stroke="#818CF8" activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data yet. Start journaling to see your mood trend!</p>
                </div>
            )}
        </div>
    );
};

export default MoodChart;
