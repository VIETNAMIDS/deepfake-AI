"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCapcut = searchCapcut;
const axios_1 = __importDefault(require("axios"));
const CONFIG = {
    baseUrl: "https://edit-api-sg.capcut.com",
    searchPath: "/lv/v1/cc_web/replicate/search_templates",
    headers: {
        "content-type": "application/json",
        "origin": "https://www.capcut.com",
        "referer": "https://www.capcut.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36",
        "sign": "8c69245fb9e23bbe2401518a277ef9d4",
        "sign-ver": "1"
    }
};
async function searchCapcut(keyword, limit = 10) {
    const payload = {
        cc_web_version: 0,
        count: limit,
        cursor: "0",
        enter_from: "workspace",
        query: keyword,
        scene: 1,
        sdk_version: "86.0.0",
        search_version: 2
    };
    const response = await axios_1.default.post(`${CONFIG.baseUrl}${CONFIG.searchPath}`, payload, {
        headers: CONFIG.headers,
        timeout: 12000
    });
    const templates = response?.data?.data?.video_templates || [];
    return templates.map((t) => ({
        id: t.id,
        title: t.title || "CapCut Template",
        author: t.author?.nickname || "CapCut Creator",
        videoUrl: t.video_url,
        templateUrl: t.template_url,
        duration: t.duration ? Math.floor(t.duration / 1000) : 0,
        views: t.play_amount || 0,
        likes: t.like_count || 0,
        usage: t.usage_amount || 0
    }));
}
