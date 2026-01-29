
import type { JournalEntry, User } from '../types';

const JOURNAL_KEY_PREFIX = 'mindful_moments_journal_';

const getStorageKey = (userId: string) => `${JOURNAL_KEY_PREFIX}${userId}`;

export const getJournalEntries = (user: User): JournalEntry[] => {
    const key = getStorageKey(user.id);
    const entriesJson = localStorage.getItem(key);
    if (!entriesJson) {
        return [];
    }
    try {
        const entries = JSON.parse(entriesJson) as JournalEntry[];
        // Sort by timestamp descending
        return entries.sort((a, b) => b.timestamp - a.timestamp);
    } catch (e) {
        return [];
    }
};

export const addJournalEntry = (user: User, entry: Omit<JournalEntry, 'id' | 'userId'>): JournalEntry => {
    const entries = getJournalEntries(user);
    const newEntry: JournalEntry = {
        ...entry,
        id: `entry_${Date.now()}`,
        userId: user.id,
    };
    const updatedEntries = [newEntry, ...entries];
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(updatedEntries));
    return newEntry;
};
