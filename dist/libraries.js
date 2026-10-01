"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIBS_DIR = exports.PYTHON_LIBRARIES = void 0;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const envPath = path_1.default.resolve(__dirname, "../.env");
dotenv_1.default.config({ path: envPath });
exports.PYTHON_LIBRARIES = [
    "fastapi",
    "uvicorn",
    "python-multipart",
    "python-dotenv",
    "pydantic",
    "requests",
    "google-genai",
    "yt-dlp",
    "imageio-ffmpeg",
    "c2pa-python"
];
exports.LIBS_DIR = process.env.PYTHON_LIBS_DIR
    ? path_1.default.resolve(process.env.PYTHON_LIBS_DIR)
    : path_1.default.resolve(__dirname, "../python_libs");
