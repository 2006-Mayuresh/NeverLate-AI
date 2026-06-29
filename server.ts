import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DatabaseSync } from "node:sqlite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new DatabaseSync("neverlate.db");

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    avatarSeed TEXT,
    energyPreference TEXT,
    focusGoal TEXT,
    createdAt TEXT
  );
  
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    deadline TEXT,
    priority TEXT,
    status TEXT,
    duration INTEGER,
    energy TEXT,
    tags TEXT,
    notes TEXT,
    createdAt TEXT,
    completedAt TEXT,
    aiReasoning TEXT,
    aiSubtasks TEXT
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    timestamp TEXT,
    mood INTEGER,
    energy INTEGER,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS habits (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    streak INTEGER,
    lastCompleted TEXT,
    history TEXT,
    createdAt TEXT
  );
`);

// Initialize Gemini SDK with telemetry and fallback checking
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in the environment. AI features will require configuration.");
}

// Helper function to call generateContent with fallback models in case of high demand (503) or rate limits
async function generateContentWithFallback(aiInstance: GoogleGenAI, params: any) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Attempting generation with model: ${modelName}`);
      const response = await aiInstance.models.generateContent({
        ...params,
        model: modelName,
      });
      
      if (response && response.text) {
        console.log(`[Gemini] Success using model: ${modelName}`);
        return response;
      }
      throw new Error(`Empty response returned from model: ${modelName}`);
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || JSON.stringify(err);
      console.warn(`[Gemini] Model ${modelName} failed. Error: ${errMsg}`);
    }
  }

  throw lastError || new Error("All fallback Gemini models failed.");
}

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    aiConfigured: !!ai,
    environment: process.env.NODE_ENV || "development"
  });
});

// Endpoint: Parse Natural Language input into structured Task elements
app.post("/api/gemini/parse-task", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "AI_NOT_CONFIGURED",
        message: "Gemini API key is missing. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const { text, currentLocalTime } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing parameter: text" });
    }

    const prompt = `
      You are NeverLate AI's task extraction assistant. Parse the following natural language task description into a structured JSON payload:
      "${text}"

      Context:
      - Current local time: ${currentLocalTime || new Date().toISOString()}
      - Analyze relative dates/times (e.g., "tomorrow at 3pm", "tonight", "next Monday morning", "by Friday at 5 PM") and calculate the absolute ISO 8601 date string for the deadline.
      - Estimate a realistic task duration in minutes. Default to 30 minutes if unspecified.
      - Map priority to 'low', 'medium', or 'high'. Be conservative but reasonable.
      - Assign the task a required mental energy level ('low', 'medium', or 'high'). For example, administrative things like calling a dentist or doing dishes are 'low', writing an essay or preparing for exams are 'high'.
      - Extract any relevant tags (e.g. ['health', 'finance', 'work', 'study', 'household', 'urgent']).
      - Brainstorm and generate a list of 2-4 tactical 'subtasks' (step-by-step checklist) to help the user start and complete this task.
      - Extract additional context, notes, or contact info into the 'notes' field.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Extract a concise, clear title for the task." },
            deadline: { type: Type.STRING, description: "ISO 8601 absolute date-time string computed for the deadline (e.g., '2026-06-27T14:00:00.000Z')." },
            priority: { type: Type.STRING, description: "The calculated urgency/importance of the task.", enum: ["low", "medium", "high"] },
            duration: { type: Type.INTEGER, description: "Estimated time to complete this task in minutes." },
            energy: { type: Type.STRING, description: "The estimated cognitive focus or mental effort required.", enum: ["low", "medium", "high"] },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted tags or categories."
            },
            notes: { type: Type.STRING, description: "Any other parsed details, description, notes, links, or contact info. Keep blank if nothing relevant exists." },
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A short breakdown list of 2-4 tactical steps/subtasks."
            }
          },
          required: ["title", "deadline", "priority", "duration", "energy", "tags", "subtasks"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini model.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in parse-task:", err);
    res.status(500).json({ error: "PARSING_FAILED", message: err.message });
  }
});

// Endpoint: Calculate smart task priorities, scheduling blocks, daily routine recommendations, and focus metrics
app.post("/api/gemini/prioritize", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({
        error: "AI_NOT_CONFIGURED",
        message: "Gemini API key is missing. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const { tasks, userProfile, currentLocalTime, moodLogs, habits } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Missing or invalid tasks array" });
    }

    const prompt = `
      You are the supportive productivity coach of NeverLate AI. Your voice is warm, empathetic, highly motivating, and balanced—like a wise mentor who cares about mental well-being as much as task completion. You believe in "pacing, not racing" and focus on healthy habit building.

      User Profile:
      - Name: ${userProfile?.name || "User"}
      - Energy Peak Preference: ${userProfile?.energyPreference || "morning"} (The user is most productive during this time)
      - Focus/Weekly Goal: "${userProfile?.focusGoal || "Stay on top of deadlines and balance my energy levels."}"

      Recent Mood & Energy Trackers logged by user (Scale 1-5 where 5 is high/optimal):
      ${moodLogs ? JSON.stringify(moodLogs.slice(0, 5), null, 2) : "None logged yet"}

      Current Habits list & Streaks:
      ${habits ? JSON.stringify(habits, null, 2) : "None registered yet"}

      Current Local Time: ${currentLocalTime || new Date().toISOString()}

      Current Pending Task List:
      ${JSON.stringify(tasks, null, 2)}

      Instructions:
      1. For each pending task, calculate an internal priority score from 1 to 100 based on:
         - Proximity of the deadline (tasks with close deadlines get higher scores, overdue tasks get critical focus).
         - Alignment of the task's required energy with the user's peak energy time preference.
         - The base priority ('high', 'medium', 'low') provided by the user.
         - The user's recent mood. If the user is feeling exhausted or overwhelmed, adjust task weightings gently to encourage 'low' effort or small habit wins first.
      2. Suggest a specific block or recommended time frame to do each task (e.g., "9:00 AM - 10:15 AM", "During your peak Afternoon focus session", "After dinner quick-win").
      3. Draft a tailored set of 3-4 daily routine suggestions / timeline block suggestions for the day (e.g., "8:30 AM: Plan Day & Breathe deeply", "9:15 AM: High Energy block (chemistry lab study)", "1:30 PM: Gentle walk & low-energy administrative chores").
      4. Formulate a personalized productivity tip and an inspiring motivational quote.
      5. Calculate a composite "Focus Rating" (0 to 100) that rates how well balanced this daily schedule is (higher if tasks are well distributed, lower if too many high energy tasks are clustered or deadlines are dangerously close).
      6. Draft a dedicated "coachInsight" message (2-3 sentences). Speak directly to ${userProfile?.name || "User"} with deep empathy. Mention their goal, celebrate any habit streaks, provide a gentle course-correction if they feel overwhelmed or have overdue tasks, and guide them with kind, supportive advice.
      
      Provide a structured JSON output that perfectly matches the following schema.
    `;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritizedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  taskId: { type: Type.STRING, description: "The ID of the task." },
                  score: { type: Type.INTEGER, description: "Calculated prioritized score between 1 and 100." },
                  recommendedTime: { type: Type.STRING, description: "Description or slot recommendation (e.g., '10:00 AM Focus Block', 'Evening Quick Win')." },
                  reason: { type: Type.STRING, description: "A concise sentence explaining why this task is scheduled at this time and why it has this score." }
                },
                required: ["taskId", "score", "recommendedTime", "reason"]
              }
            },
            dailyRoutineSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 actionable steps for the day."
            },
            productivityTip: { type: Type.STRING, description: "A highly tailored, practical tip." },
            motivationQuote: { type: Type.STRING, description: "A crisp motivational quote." },
            focusRating: { type: Type.INTEGER, description: "Aggregate schedule focus rating from 0 to 100." },
            coachInsight: { type: Type.STRING, description: "Supportive, warm coaching advice summarizing goals, habits, and emotional health." }
          },
          required: ["prioritizedTasks", "dailyRoutineSuggestions", "productivityTip", "motivationQuote", "focusRating", "coachInsight"]
        }
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini model.");
    }

    const parsedData = JSON.parse(response.text.trim());
    res.json(parsedData);
  } catch (err: any) {
    console.error("Error in prioritize:", err);
    res.status(500).json({ error: "PRIORITIZATION_FAILED", message: err.message });
  }
});

// ==========================================
// DB CRUD Endpoints
// ==========================================

// Register User
app.post("/api/users/register", (req, res) => {
  try {
    const { name, email, energyPreference, focusGoal } = req.body;
    if (!name || !email || !energyPreference || !focusGoal) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if email already exists
    const checkUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email) as any;
    if (checkUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    const AVATAR_SEEDS = ['Oliver', 'Sophia', 'Charlie', 'Luna', 'Felix', 'Leo', 'Milo', 'Bella', 'Ruby', 'Zoe'];
    const newUser = {
      id: 'user_' + Math.random().toString(36).substring(2, 11),
      email,
      name,
      avatarSeed: AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)],
      energyPreference,
      focusGoal,
      createdAt: new Date().toISOString()
    };

    db.prepare(`
      INSERT INTO users (id, email, name, avatarSeed, energyPreference, focusGoal, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(newUser.id, newUser.email, newUser.name, newUser.avatarSeed, newUser.energyPreference, newUser.focusGoal, newUser.createdAt);

    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("Register user error:", err);
    res.status(500).json({ error: "REGISTRATION_FAILED", message: err.message });
  }
});

// Login User
app.post("/api/users/login", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email) as any;
    if (!user) {
      return res.status(404).json({ message: "No user found with this email. Click \"Create account\" to sign up!" });
    }

    res.json(user);
  } catch (err: any) {
    console.error("Login user error:", err);
    res.status(500).json({ error: "LOGIN_FAILED", message: err.message });
  }
});

// Update User Profile
app.put("/api/users/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, avatarSeed, energyPreference, focusGoal, createdAt } = req.body;

    db.prepare(`
      UPDATE users
      SET name = ?, energyPreference = ?, focusGoal = ?
      WHERE id = ?
    `).run(name, energyPreference, focusGoal, userId);

    res.json({ id: userId, email, name, avatarSeed, energyPreference, focusGoal, createdAt });
  } catch (err: any) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "UPDATE_FAILED", message: err.message });
  }
});

// Get Tasks
app.get("/api/tasks/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const rows = db.prepare("SELECT * FROM tasks WHERE userId = ?").all(userId) as any[];
    const tasks = rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      aiSubtasks: row.aiSubtasks ? JSON.parse(row.aiSubtasks) : undefined
    }));
    res.json(tasks);
  } catch (err: any) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "FETCH_FAILED", message: err.message });
  }
});

// Save Task (upsert)
app.post("/api/tasks", (req, res) => {
  try {
    const task = req.body;
    const { id, userId, title, deadline, priority, status, duration, energy, tags, notes, createdAt, completedAt, aiReasoning, aiSubtasks } = task;

    db.prepare(`
      INSERT INTO tasks (id, userId, title, deadline, priority, status, duration, energy, tags, notes, createdAt, completedAt, aiReasoning, aiSubtasks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        deadline = excluded.deadline,
        priority = excluded.priority,
        status = excluded.status,
        duration = excluded.duration,
        energy = excluded.energy,
        tags = excluded.tags,
        notes = excluded.notes,
        completedAt = excluded.completedAt,
        aiReasoning = excluded.aiReasoning,
        aiSubtasks = excluded.aiSubtasks
    `).run(
      id,
      userId,
      title,
      deadline,
      priority,
      status,
      duration,
      energy,
      JSON.stringify(tags || []),
      notes || null,
      createdAt,
      completedAt || null,
      aiReasoning || null,
      aiSubtasks ? JSON.stringify(aiSubtasks) : null
    );

    res.status(200).json({ message: "Task saved successfully" });
  } catch (err: any) {
    console.error("Save task error:", err);
    res.status(500).json({ error: "SAVE_FAILED", message: err.message });
  }
});

// Batch Save Tasks
app.post("/api/tasks/batch", (req, res) => {
  try {
    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Missing tasks array" });
    }

    const insertOrUpdate = db.prepare(`
      INSERT INTO tasks (id, userId, title, deadline, priority, status, duration, energy, tags, notes, createdAt, completedAt, aiReasoning, aiSubtasks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        deadline = excluded.deadline,
        priority = excluded.priority,
        status = excluded.status,
        duration = excluded.duration,
        energy = excluded.energy,
        tags = excluded.tags,
        notes = excluded.notes,
        completedAt = excluded.completedAt,
        aiReasoning = excluded.aiReasoning,
        aiSubtasks = excluded.aiSubtasks
    `);

    db.exec("BEGIN TRANSACTION");
    try {
      for (const task of tasks) {
        insertOrUpdate.run(
          task.id,
          task.userId,
          task.title,
          task.deadline,
          task.priority,
          task.status,
          task.duration,
          task.energy,
          JSON.stringify(task.tags || []),
          task.notes || null,
          task.createdAt,
          task.completedAt || null,
          task.aiReasoning || null,
          task.aiSubtasks ? JSON.stringify(task.aiSubtasks) : null
        );
      }
      db.exec("COMMIT");
    } catch (txErr) {
      db.exec("ROLLBACK");
      throw txErr;
    }

    res.status(200).json({ message: "Tasks saved successfully in batch" });
  } catch (err: any) {
    console.error("Batch save tasks error:", err);
    res.status(500).json({ error: "BATCH_SAVE_FAILED", message: err.message });
  }
});

// Delete Task
app.delete("/api/tasks/:taskId", (req, res) => {
  try {
    const { taskId } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
    res.json({ message: "Task deleted successfully" });
  } catch (err: any) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "DELETE_FAILED", message: err.message });
  }
});

// Get Mood Logs
app.get("/api/moods/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const logs = db.prepare("SELECT * FROM mood_logs WHERE userId = ? ORDER BY timestamp DESC").all(userId) as any[];
    res.json(logs);
  } catch (err: any) {
    console.error("Get moods error:", err);
    res.status(500).json({ error: "FETCH_FAILED", message: err.message });
  }
});

// Save Mood Log
app.post("/api/moods", (req, res) => {
  try {
    const { id, userId, timestamp, mood, energy, notes } = req.body;
    db.prepare(`
      INSERT INTO mood_logs (id, userId, timestamp, mood, energy, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, userId, timestamp, mood, energy, notes || null);
    res.status(201).json({ message: "Mood log saved successfully" });
  } catch (err: any) {
    console.error("Save mood log error:", err);
    res.status(500).json({ error: "SAVE_FAILED", message: err.message });
  }
});

// Get Habits
app.get("/api/habits/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const rows = db.prepare("SELECT * FROM habits WHERE userId = ?").all(userId) as any[];
    const habits = rows.map(row => ({
      ...row,
      history: JSON.parse(row.history || '[]')
    }));
    res.json(habits);
  } catch (err: any) {
    console.error("Get habits error:", err);
    res.status(500).json({ error: "FETCH_FAILED", message: err.message });
  }
});

// Save Habit
app.post("/api/habits", (req, res) => {
  try {
    const habit = req.body;
    const { id, userId, title, streak, lastCompleted, history, createdAt } = habit;
    db.prepare(`
      INSERT INTO habits (id, userId, title, streak, lastCompleted, history, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        streak = excluded.streak,
        lastCompleted = excluded.lastCompleted,
        history = excluded.history
    `).run(
      id,
      userId,
      title,
      streak,
      lastCompleted || null,
      JSON.stringify(history || []),
      createdAt
    );
    res.status(200).json({ message: "Habit saved successfully" });
  } catch (err: any) {
    console.error("Save habit error:", err);
    res.status(500).json({ error: "SAVE_FAILED", message: err.message });
  }
});

// Delete Habit
app.delete("/api/habits/:habitId", (req, res) => {
  try {
    const { habitId } = req.params;
    db.prepare("DELETE FROM habits WHERE id = ?").run(habitId);
    res.json({ message: "Habit deleted successfully" });
  } catch (err: any) {
    console.error("Delete habit error:", err);
    res.status(500).json({ error: "DELETE_FAILED", message: err.message });
  }
});

// Setup dev server with Vite in dev, or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static files in production.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 NeverLate AI backend running at http://localhost:${PORT}`);
  });
}

startServer();
