
import React, { useState, useEffect, useCallback } from 'react';
import type { User, JournalEntry, TrendAnalysis } from '../types';
import { logout } from '../services/authService';
import { getJournalEntries, addJournalEntry } from '../services/journalService';
import JournalForm from './JournalForm';
import MoodChart from './MoodChart';
import JournalList from './JournalList';
import SupportModal from './SupportModal';
import DeeperInsightsModal from './DeeperInsightsModal';
import TalkItOut from './TalkItOut';
import CrisisModal from './CrisisModal';
import CrisisConfirmationModal from './CrisisConfirmationModal';
import { getDeeperInsights } from '../services/geminiService';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

const NEGATIVE_TREND_THRESHOLD = 4.0;

const analyzeTrend = (entries: JournalEntry[]): TrendAnalysis => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.timestamp >= oneWeekAgo);

    if (recentEntries.length < 2) { // Require at least 2 entries for a meaningful average
        return { isNegativeTrend: false, average: null, label: "Not enough entries in the last 7 days to analyze a trend. Keep journaling!" };
    }

    const sum = recentEntries.reduce((acc, entry) => acc + entry.moodScore, 0);
    const average = sum / recentEntries.length;

    // Calculate unique days
    const uniqueDays = new Set(recentEntries.map(e => new Date(e.timestamp).toDateString()));
    const numberOfDays = uniqueDays.size;

    let labelText = '';
    if (numberOfDays === 1) {
        const isToday = uniqueDays.has(new Date().toDateString());
        labelText = isToday ? "Today's average mood score is" : "The average mood score for that day is";
    } else {
        labelText = `Your average mood score over the last ${numberOfDays} days is`;
    }

    return {
        isNegativeTrend: average < NEGATIVE_TREND_THRESHOLD,
        average: parseFloat(average.toFixed(2)),
        label: labelText,
    };
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [insights, setInsights] = useState<string>('');
    const [isInsightsLoading, setIsInsightsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('journal');
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [showCrisisConfirmationModal, setShowCrisisConfirmationModal] = useState(false);

    const fetchEntries = useCallback(() => {
        const userEntries = getJournalEntries(user);
        setEntries(userEntries);
        const analysis = analyzeTrend(userEntries);
        setTrendAnalysis(analysis);
        if (analysis.isNegativeTrend) {
            setShowSupportModal(true);
        }
    }, [user]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleAddEntry = (entry: Omit<JournalEntry, 'id' | 'userId'>) => {
        addJournalEntry(user, entry);
        fetchEntries(); // Refetch to update list and chart
    };

    const handleViewInsights = async (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setIsInsightsLoading(true);
        const result = await getDeeperInsights(entry.text);
        setInsights(result);
        setIsInsightsLoading(false);
    };

    const handleCloseInsights = () => {
        setSelectedEntry(null);
        setInsights('');
    };

    const handleLogout = () => {
        logout();
        onLogout();
    };
    
    const TabButton = ({ tabName, label }: {tabName: string; label: string}) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    const handleCrisisDetected = () => {
        setShowCrisisConfirmationModal(true);
    };

    const handleConfirmShowCrisisResources = () => {
        setShowCrisisConfirmationModal(false);
        setShowCrisisModal(true);
    };

    const handleCancelCrisisConfirmation = () => {
        setShowCrisisConfirmationModal(false);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        Mindful Moments
                    </h1>
                    <p className="text-gray-400">Welcome, {user.email}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600"
                >
                    Logout
                </button>
            </header>
            
            <div className="mb-6 flex space-x-2 border-b border-gray-700 pb-2">
                <TabButton tabName="journal" label="My Journal" />
                <TabButton tabName="talk" label="Talk It Out" />
            </div>

            {activeTab === 'journal' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <JournalForm onAddEntry={handleAddEntry} onCrisisDetected={handleCrisisDetected} />
                        <JournalList entries={entries} onViewInsights={handleViewInsights} />
                    </div>
                    <div className="space-y-8">
                        <MoodChart data={entries} />
                        <div className="p-4 bg-gray-800 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Trend Analysis</h3>
                            {trendAnalysis && trendAnalysis.average !== null ? (
                                <p className="text-gray-300">
                                    {trendAnalysis.label} <span className="font-bold text-indigo-400">{trendAnalysis.average}</span>.
                                </p>
                            ) : (
                                <p className="text-gray-400">{trendAnalysis?.label || "Keep journaling to see your trends!"}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {activeTab === 'talk' && <TalkItOut onCrisisDetected={handleCrisisDetected} />}

            <SupportModal
                isOpen={showSupportModal && !showCrisisModal}
                onClose={() => setShowSupportModal(false)}
            />
            <DeeperInsightsModal
                isOpen={!!selectedEntry}
                onClose={handleCloseInsights}
                entry={selectedEntry}
                insights={insights}
                isLoading={isInsightsLoading}
            />
            <CrisisConfirmationModal
                isOpen={showCrisisConfirmationModal}
                onConfirm={handleConfirmShowCrisisResources}
                onCancel={handleCancelCrisisConfirmation}
            />
            <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />
            <footer className="mt-12 text-center text-xs text-gray-500">
                <p className="font-bold">Disclaimer:</p>
                <p>This application is not a medical tool. It provides wellness insights and resource suggestions only. If you are in crisis, please contact a healthcare professional.</p>
            </footer>
        </div>
    );
};

export default Dashboard;
