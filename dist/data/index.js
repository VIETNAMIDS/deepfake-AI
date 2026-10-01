"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDataManager = exports.UserDataManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.resolve(__dirname, "../../data");
const USERS_FILE = path_1.default.join(DATA_DIR, "users.json");
const LOGS_FILE = path_1.default.join(DATA_DIR, "logs.json");
if (!fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
function readJson(file, fallback) {
    try {
        if (!fs_1.default.existsSync(file))
            return fallback;
        return JSON.parse(fs_1.default.readFileSync(file, "utf-8"));
    }
    catch {
        return fallback;
    }
}
function writeJson(file, data) {
    try {
        fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
    }
    catch { }
}
class UserDataManager {
    saveUser(userId, platform, name = "") {
        const users = readJson(USERS_FILE, {});
        const now = new Date().toISOString();
        if (!users[userId]) {
            users[userId] = { id: userId, platform, name, createdAt: now, lastActive: now };
        }
        else {
            users[userId].lastActive = now;
            if (name)
                users[userId].name = name;
        }
        writeJson(USERS_FILE, users);
        return users[userId];
    }
    logActivity(userId, type, input, verdict = "") {
        const logs = readJson(LOGS_FILE, []);
        logs.push({
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId,
            type,
            input,
            verdict,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 5000)
            logs.shift();
        writeJson(LOGS_FILE, logs);
    }
    getUser(userId) {
        const users = readJson(USERS_FILE, {});
        return users[userId] || null;
    }
}
exports.UserDataManager = UserDataManager;
exports.userDataManager = new UserDataManager();
