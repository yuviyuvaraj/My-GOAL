export interface Goal {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: 'daily' | 'one-time';
  targetLimit?: number; // Only for daily goals
  unit?: string; // Count, Kg, Liters, etc.
  reminders: string[]; // List of alarm times (e.g., "08:00", "21:30")
  completed?: boolean; // For one-time goals
  completedAt?: string; // Date of completion for one-time goals (YYYY-MM-DD)
  createdAt: string;
}

export interface ProgressEntry {
  goalId: string;
  date: string; // YYYY-MM-DD
  value: number; // Value tracked
  status: 'not-done' | 'partially-done' | 'completed';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: string; // ISO string
}

export interface Profile {
  name: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  appStartDate: string; // YYYY-MM-DD
}

export type ThemeType = 'light' | 'dark' | 'system';

export interface SimulatedNotification {
  id: string;
  goalId: string;
  goalName: string;
  time: string; // "HH:MM"
  type: 'daily' | 'one-time';
  timestamp: number; // real time it triggered
  snoozedCount: number;
  status: 'active' | 'completed' | 'snoozed' | 'dismissed';
}
