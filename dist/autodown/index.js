"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCapcut = exports.twitterDownloader = exports.tiktokDownloader = exports.youtubeDownloader = exports.universalDownloader = exports.UniversalDownloader = void 0;
const youtube_1 = require("./youtube");
Object.defineProperty(exports, "youtubeDownloader", { enumerable: true, get: function () { return youtube_1.youtubeDownloader; } });
const tiktok_1 = require("./tiktok");
Object.defineProperty(exports, "tiktokDownloader", { enumerable: true, get: function () { return tiktok_1.tiktokDownloader; } });
const twitter_1 = require("./twitter");
Object.defineProperty(exports, "twitterDownloader", { enumerable: true, get: function () { return twitter_1.twitterDownloader; } });
const capcut_1 = require("./capcut");
Object.defineProperty(exports, "searchCapcut", { enumerable: true, get: function () { return capcut_1.searchCapcut; } });
class UniversalDownloader {
    downloaders = {
        youtube: youtube_1.youtubeDownloader,
        tiktok: tiktok_1.tiktokDownloader,
        twitter: twitter_1.twitterDownloader
    };
    patterns = [
        { regex: /youtube\.com|youtu\.be/i, key: "youtube", name: "YouTube" },
        { regex: /tiktok\.com|douyin\.com/i, key: "tiktok", name: "TikTok" },
        { regex: /twitter\.com|x\.com|t\.co/i, key: "twitter", name: "Twitter/X" }
    ];
    detectPlatform(url) {
        for (const p of this.patterns) {
            if (p.regex.test(url))
                return { downloader: this.downloaders[p.key], name: p.name, key: p.key };
        }
        return null;
    }
    async download(url, options = {}) {
        const platform = this.detectPlatform(url);
        if (!platform)
            throw new Error("Nền tảng không được hỗ trợ.");
        const result = await platform.downloader.download(url, options);
        if (!result || !result.medias?.length)
            throw new Error("Không tìm thấy media hợp lệ từ đường link.");
        return result;
    }
}
exports.UniversalDownloader = UniversalDownloader;
exports.universalDownloader = new UniversalDownloader();
