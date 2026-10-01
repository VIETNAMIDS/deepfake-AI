"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeScraper = exports.YouTubeScraper = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class YouTubeScraper {
    isYouTubeUrl(url) {
        return /youtube\.com|youtu\.be/i.test(String(url || ""));
    }
    async getInfo(url) {
        const cmd = `python -m yt_dlp --dump-single-json --no-warnings --no-playlist "${url.trim()}"`;
        const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 20000 });
        const info = JSON.parse(stdout);
        if (!info)
            throw new Error("Không thể lấy thông tin video YouTube");
        const rawFormats = Array.isArray(info.formats) ? info.formats : [];
        const formats = rawFormats.filter((f) => f.url && f.ext !== "mhtml" && !f.url.includes("/sb/"));
        const videoFormats = formats
            .filter((f) => f.vcodec && f.vcodec !== "none")
            .sort((a, b) => (b.height || 0) - (a.height || 0));
        const bestVideo = videoFormats[0] || formats.find((f) => f.ext === "mp4") || formats[0];
        const audioFormats = formats
            .filter((f) => f.acodec && f.acodec !== "none")
            .sort((a, b) => (b.tbr || b.abr || 0) - (a.tbr || a.abr || 0));
        const bestAudio = audioFormats[0] || bestVideo;
        const medias = [];
        if (bestVideo?.url) {
            medias.push({
                type: "video",
                url: bestVideo.url,
                quality: bestVideo.height ? `${bestVideo.height}p` : "hd",
                thumbnail: info.thumbnail || "",
                duration: info.duration || 0,
                width: bestVideo.width || 1280,
                height: bestVideo.height || 720
            });
        }
        if (bestAudio?.url) {
            medias.push({
                type: "audio",
                url: bestAudio.url,
                quality: "best",
                duration: info.duration || 0
            });
        }
        return {
            id: info.id,
            author: info.uploader || info.channel || "YouTube Creator",
            title: info.title || "YouTube Video",
            thumbnail: info.thumbnail || "",
            duration: info.duration || 0,
            platform: "YouTube",
            medias
        };
    }
    async download(url, options = {}) {
        const res = await this.getInfo(url);
        if (options?.audioOnly) {
            res.medias = res.medias.filter(m => m.type === "audio");
        }
        return res;
    }
}
exports.YouTubeScraper = YouTubeScraper;
exports.youtubeScraper = new YouTubeScraper();
