import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface YouTubeMedia {
  type: "video" | "audio";
  url: string;
  quality?: string;
  thumbnail?: string;
  duration?: number;
  width?: number;
  height?: number;
}

export class YouTubeDownloader {
  isYouTubeUrl(url: string): boolean {
    return /youtube\.com|youtu\.be/i.test(String(url || ""));
  }

  async getInfo(url: string) {
    const cmd = `python -m yt_dlp --dump-single-json --no-warnings --no-playlist "${url.trim()}"`;
    const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 20000 });
    const info = JSON.parse(stdout);
    if (!info) throw new Error("Không thể lấy thông tin video YouTube");

    const rawFormats = Array.isArray(info.formats) ? info.formats : [];
    const formats = rawFormats.filter((f: any) => f.url && f.ext !== "mhtml" && !f.url.includes("/sb/"));

    const videoFormats = formats
      .filter((f: any) => f.vcodec && f.vcodec !== "none")
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0));
    const bestVideo = videoFormats[0] || formats.find((f: any) => f.ext === "mp4") || formats[0];

    const audioFormats = formats
      .filter((f: any) => f.acodec && f.acodec !== "none")
      .sort((a: any, b: any) => (b.tbr || b.abr || 0) - (a.tbr || a.abr || 0));
    const bestAudio = audioFormats[0] || bestVideo;

    const medias: YouTubeMedia[] = [];
    if (bestVideo?.url) {
      medias.push({
        type: "video",
        url: bestVideo.url,
        quality: bestVideo.height ? `${bestVideo.height}p` : "720p",
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

  async download(url: string, options: any = {}) {
    const res = await this.getInfo(url);
    if (options?.audioOnly) {
      res.medias = res.medias.filter(m => m.type === "audio");
    }
    return res;
  }
}

export const youtubeDownloader = new YouTubeDownloader();
