import { Task, User, SmartScheduleResult } from '../types';

export interface ParseResult {
  title: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  duration: number;
  energy: 'low' | 'medium' | 'high';
  tags: string[];
  notes?: string;
  subtasks: string[];
}

export async function parseNaturalLanguageTask(text: string): Promise<ParseResult> {
  const currentLocalTime = new Date().toISOString();
  const response = await fetch('/api/gemini/parse-task', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, currentLocalTime }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to parse task with Gemini AI');
  }

  return response.json();
}

export async function generateSmartSchedule(tasks: Task[], userProfile: User, moodLogs?: any[], habits?: any[]): Promise<SmartScheduleResult> {
  const currentLocalTime = new Date().toISOString();
  const response = await fetch('/api/gemini/prioritize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tasks, userProfile, currentLocalTime, moodLogs, habits }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to prioritize tasks with Gemini AI');
  }

  return response.json();
}
