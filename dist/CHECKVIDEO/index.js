"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliberateWithJudge = void 0;
exports.checkVideoFile = checkVideoFile;
exports.checkVideoUrl = checkVideoUrl;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const config_1 = require("../config");
const judge_1 = require("./judge");
Object.defineProperty(exports, "deliberateWithJudge", { enumerable: true, get: function () { return judge_1.deliberateWithJudge; } });
async function checkVideoFile(videoStream, filename = "input.mp4") {
    const formData = new form_data_1.default();
    formData.append("file", videoStream, { filename });
    const pyRes = await axios_1.default.post(`${config_1.CONFIG.PYTHON_ENGINE_URL}/analyze`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000
    });
    return (0, judge_1.deliberateWithJudge)(pyRes.data?.data || {});
}
async function checkVideoUrl(targetUrl, fallbackUrl) {
    let pyRes;
    try {
        pyRes = await axios_1.default.post(`${config_1.CONFIG.PYTHON_ENGINE_URL}/analyze-url`, { url: targetUrl }, { timeout: 60000 });
    }
    catch (firstErr) {
        if (fallbackUrl && fallbackUrl !== targetUrl) {
            pyRes = await axios_1.default.post(`${config_1.CONFIG.PYTHON_ENGINE_URL}/analyze-url`, { url: fallbackUrl }, { timeout: 60000 });
        }
        else {
            throw firstErr;
        }
    }
    return (0, judge_1.deliberateWithJudge)(pyRes.data?.data || {});
}
