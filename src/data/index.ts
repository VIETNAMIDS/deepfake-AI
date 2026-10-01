import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface UserProfile {
  id: string;
  platform: "tele" | "mess" | "zalo" | "message";
  name?: string;
  createdAt: string;
  lastActive: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: "video" | "question";
  input: string;
  verdict?: string;
  timestamp: string;
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: any) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export class UserDataManager {
  saveUser(userId: string, platform: "tele" | "mess" | "zalo" | "message", name = ""): UserProfile {
    const users = readJson<Record<string, UserProfile>>(USERS_FILE, {});
    const now = new Date().toISOString();
    if (!users[userId]) {
      users[userId] = { id: userId, platform, name, createdAt: now, lastActive: now };
    } else {
      users[userId].lastActive = now;
      if (name) users[userId].name = name;
    }
    writeJson(USERS_FILE, users);
    return users[userId];
  }

  logActivity(userId: string, type: "video" | "question", input: string, verdict = "") {
    const logs = readJson<ActivityLog[]>(LOGS_FILE, []);
    logs.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      type,
      input,
      verdict,
      timestamp: new Date().toISOString()
    });
    if (logs.length > 5000) logs.shift();
    writeJson(LOGS_FILE, logs);
  }

  getUser(userId: string): UserProfile | null {
    const users = readJson<Record<string, UserProfile>>(USERS_FILE, {});
    return users[userId] || null;
  }
}

export const userDataManager = new UserDataManager();
