
export interface JournalEntry {
    id: string;
    userId: string;
    text: string;
    timestamp: number;
    moodScore: number; // 1-10
    sentiment: 'Positive' | 'Negative' | 'Neutral';
}

export interface User {
    id: string;
    email: string;
}

export interface TrendAnalysis {
    isNegativeTrend: boolean;
    average: number | null;
    label: string;
}
