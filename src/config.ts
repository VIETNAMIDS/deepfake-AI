import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const primaryKey = process.env.XKIRO_API_KEY || "";
const backupKey = process.env.XKIRO_API_KEY_BACKUP || "";
const apiKeys = [primaryKey, backupKey].filter(Boolean);

export const CONFIG = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  ROUTER9_BASE_URL: process.env.ROUTER9_BASE_URL || "http://127.0.0.1:20128/v1",
  ROUTER9_API_KEY: process.env.ROUTER9_API_KEY || "sk-863b3c9f2084d6fa-0rj8p6-f15ccd8b",
  ROUTER9_MODEL: process.env.ROUTER9_MODEL || "ag/gemini-3.8-flash",
  XKIRO_API_KEY: primaryKey || backupKey,
  XKIRO_API_KEYS: apiKeys,
  MODEL: process.env.DELIBERATION_MODEL || "mistralai/mistral-large-2512",
  BASE_URL: process.env.XKIRO_BASE_URL || process.env.OPENROUTER_BASE_URL || "https://api.xkiro.com/v1",
  PYTHON_ENGINE_URL: process.env.PYTHON_ENGINE_URL || "http://127.0.0.1:8000",
  TEMP_DIR: path.resolve(__dirname, "../temp_media"),
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN || "",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "deepcheck_verify_token",
  MESSENGER_PORT: parseInt(process.env.MESSENGER_PORT || "5000", 10)
};

export const AVAILABLE_MODELS = [
  "mistralai/mistral-large-2512",
  "minimax/minimax-m3:free",
  "sensenova/sensenova-6.8-flash-lite",
  "qwen/qwen3.8-max:free",
  "cohere/command-a-plus",
  "inclusionai/ling-3.0-flash-sante:free",
  "dots-studio/dots-3-note-preview:free",
  "ag/gemini-3.8-flash",
  "ag/claude-sonnet-4-6"
];
