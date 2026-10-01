import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

export const PYTHON_LIBRARIES = [
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

export const LIBS_DIR = process.env.PYTHON_LIBS_DIR
  ? path.resolve(process.env.PYTHON_LIBS_DIR)
  : path.resolve(__dirname, "../python_libs");
