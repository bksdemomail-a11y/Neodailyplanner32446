
// User profile type for authentication
export type User = {
  id: string;
  username: string;
};

export type TaskCategory = 'Work' | 'Health' | 'Social' | 'Hobby' | 'Personal' | 'Rest';

export type TimeBlock = {
  id: string;
  title: string;
  category: TaskCategory;
  startTime: number; // 0 to 23.99
  endTime: number;
  color: string;
  completed: boolean;
  reminder?: boolean;
};

export type DailyRoutine = {
  date: string; // YYYY-MM-DD
  tasks: TimeBlock[];
  notes?: string;
  mediaLinks?: string[];
};

export type Template = {
  id: string;
  name: string;
  tasks: Omit<TimeBlock, 'id' | 'completed'>[];
};

export type Target = {
  id: string;
  title: string;
  description?: string;
  totalDays: number;
  targetAmount?: number; // e.g., 63
  targetUnit?: string;   // e.g., "videos"
  startDate: string; // YYYY-MM-DD
  completedDates: string[]; // List of YYYY-MM-DD
  missedDates: string[]; // List of YYYY-MM-DD
  color: string;
  isArchived: boolean;
};

export enum ViewMode {
  PLANNER = 'PLANNER',
  HISTORY = 'HISTORY',
  TARGETS = 'TARGETS',
  SYNC = 'SYNC',
  WEATHER = 'WEATHER',
  REFLECTION = 'REFLECTION',
  DAILY_STATS = 'DAILY_STATS'
}

export const CATEGORIES: TaskCategory[] = ['Work', 'Health', 'Social', 'Hobby', 'Personal', 'Rest'];

export const COLORS = [
  { name: 'Sky', bg: 'bg-sky-500', text: 'text-sky-50', hex: '#0ea5e9' },
  { name: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-50', hex: '#10b981' },
  { name: 'Rose', bg: 'bg-rose-500', text: 'text-rose-50', hex: '#f43f5e' },
  { name: 'Amber', bg: 'bg-amber-500', text: 'text-amber-50', hex: '#f59e0b' },
  { name: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-50', hex: '#6366f1' },
  { name: 'Purple', bg: 'bg-purple-500', text: 'text-purple-50', hex: '#a855f7' },
  { name: 'Slate', bg: 'bg-slate-500', text: 'text-slate-50', hex: '#64748b' },
];
