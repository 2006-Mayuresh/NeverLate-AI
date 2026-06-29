export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed' | 'overdue';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  deadline: string; // ISO date-time string
  priority: Priority;
  status: TaskStatus;
  duration: number; // in minutes
  energy: EnergyLevel; // Low, Medium, High energy required
  tags: string[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
  aiReasoning?: string; // AI explain why this task is scheduled/prioritized
  aiSubtasks?: Subtask[]; // AI generated checklist/breakdown
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarSeed: string; // Used to generate customizable avatars
  energyPreference: 'morning' | 'afternoon' | 'evening'; // When user is most productive
  focusGoal: string; // User's custom core focus goal for the week
  createdAt: string;
}

export interface MoodLog {
  id: string;
  userId: string;
  timestamp: string;
  mood: number; // 1 to 5 (calm, focused, energetic, tired, overwhelmed)
  energy: number; // 1 to 5
  notes?: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  streak: number;
  lastCompleted?: string; // date string (YYYY-MM-DD)
  history: string[]; // list of completed dates (YYYY-MM-DD)
  createdAt: string;
}

export interface SmartScheduleResult {
  prioritizedTasks: {
    taskId: string;
    score: number;
    recommendedTime: string; // String description e.g. "9:00 AM - 10:30 AM" or "Early Morning Focus Session"
    reason: string;
  }[];
  dailyRoutineSuggestions: string[];
  productivityTip: string;
  motivationQuote: string;
  focusRating: number; // 0 - 100 calculated by AI
  coachInsight: string; // Supportive coach commentary on balance, mood, and cognitive pacing
}
