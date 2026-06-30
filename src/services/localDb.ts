import { Task, User, MoodLog, Habit } from '../types';

const CURRENT_USER_KEY = 'neverlate_current_user';

// Mock avatars options
export const AVATAR_SEEDS = [
  'Oliver', 'Sophia', 'Charlie', 'Luna', 'Felix', 'Leo', 'Milo', 'Bella', 'Ruby', 'Zoe'
];

export async function getTasks(userId: string): Promise<Task[]> {
  const response = await fetch(`/api/tasks/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to load tasks from server');
  }
  return response.json();
}

export async function saveTask(task: Task): Promise<void> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    throw new Error('Failed to save task to server');
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  const response = await fetch('/api/tasks/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tasks }),
  });
  if (!response.ok) {
    throw new Error('Failed to save tasks in batch to server');
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete task from server');
  }
}

export async function getUsers(): Promise<User[]> {
  // Stub to prevent compilation issues. Registration checks are handled server-side.
  return [];
}

export async function registerUser(
  name: string,
  email: string,
  energyPreference: 'morning' | 'afternoon' | 'evening',
  focusGoal: string,
  password?: string
): Promise<User> {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, energyPreference, focusGoal, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Registration failed');
  }

  const user = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export async function loginUser(email: string, password?: string): Promise<User | null> {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Login failed');
  }

  const user = await response.json();
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentUser(): User | null {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export async function updateCurrentUserProfile(updatedUser: User): Promise<void> {
  const response = await fetch(`/api/users/${updatedUser.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatedUser),
  });

  if (!response.ok) {
    throw new Error('Failed to update user profile on server');
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
}

// Mood tracking functions
export async function getMoodLogs(userId: string): Promise<MoodLog[]> {
  const response = await fetch(`/api/moods/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to load mood logs from server');
  }
  return response.json();
}

export async function saveMoodLog(log: MoodLog): Promise<void> {
  const response = await fetch('/api/moods', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(log),
  });
  if (!response.ok) {
    throw new Error('Failed to save mood log to server');
  }
}

// Habit tracking functions
export async function getHabits(userId: string): Promise<Habit[]> {
  const response = await fetch(`/api/habits/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to load habits from server');
  }
  return response.json();
}

export async function saveHabit(habit: Habit): Promise<void> {
  const response = await fetch('/api/habits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(habit),
  });
  if (!response.ok) {
    throw new Error('Failed to save habit to server');
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  const response = await fetch(`/api/habits/${habitId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete habit from server');
  }
}
