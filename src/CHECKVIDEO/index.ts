import axios from "axios";
import FormData from "form-data";
import { CONFIG } from "../config";
import { deliberateWithJudge, ForensicResult } from "./judge";

export async function checkVideoFile(videoStream: any, filename = "input.mp4"): Promise<string> {
  const formData = new FormData();
  formData.append("file", videoStream, { filename });
  const pyRes = await axios.post(`${CONFIG.PYTHON_ENGINE_URL}/analyze`, formData, {
    headers: formData.getHeaders(),
    timeout: 60000
  });
  return deliberateWithJudge(pyRes.data?.data || {});
}

export async function checkVideoUrl(targetUrl: string, fallbackUrl?: string): Promise<string> {
  let pyRes: any;
  try {
    pyRes = await axios.post(`${CONFIG.PYTHON_ENGINE_URL}/analyze-url`, { url: targetUrl }, { timeout: 60000 });
  } catch (firstErr) {
    if (fallbackUrl && fallbackUrl !== targetUrl) {
      pyRes = await axios.post(`${CONFIG.PYTHON_ENGINE_URL}/analyze-url`, { url: fallbackUrl }, { timeout: 60000 });
    } else {
      throw firstErr;
    }
  }
  return deliberateWithJudge(pyRes.data?.data || {});
}

export { deliberateWithJudge, ForensicResult };
