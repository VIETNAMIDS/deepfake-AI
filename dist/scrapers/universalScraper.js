"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.universalScraper = exports.UniversalScraper = void 0;
const youtubeScraper_1 = require("./youtubeScraper");
const tiktokScraper_1 = require("./tiktokScraper");
const twitterScraper_1 = require("./twitterScraper");
class UniversalScraper {
    scrapers = {
        youtube: youtubeScraper_1.youtubeScraper,
        tiktok: tiktokScraper_1.tiktokScraper,
        twitter: twitterScraper_1.twitterScraper
    };
    patterns = [
        { regex: /youtube\.com|youtu\.be/i, key: "youtube", name: "YouTube" },
        { regex: /tiktok\.com|douyin\.com/i, key: "tiktok", name: "TikTok" },
        { regex: /twitter\.com|x\.com|t\.co/i, key: "twitter", name: "Twitter/X" }
    ];
    detectPlatform(url) {
        for (const p of this.patterns) {
            if (p.regex.test(url)) {
                return { scraper: this.scrapers[p.key], name: p.name, key: p.key };
            }
        }
        return null;
    }
    async download(url, options = {}) {
        const platform = this.detectPlatform(url);
        if (!platform) {
            throw new Error("Nền tảng không được hỗ trợ.");
        }
        const result = await platform.scraper.download(url, options);
        if (!result || !result.medias?.length) {
            throw new Error("Không tìm thấy media hợp lệ từ đường link.");
        }
        return result;
    }
}
exports.UniversalScraper = UniversalScraper;
exports.universalScraper = new UniversalScraper();
