import glob, json, os, re, subprocess, requests, urllib3, yt_dlp, imageio_ffmpeg
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def trim_to_ten_seconds(file_path: str):
    if not os.path.exists(file_path): return
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        tmp_out = file_path + ".trimmed.mp4"
        cmd = [ffmpeg_exe, "-y", "-i", file_path, "-t", "14", "-c", "copy", tmp_out]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=8)
        if not os.path.exists(tmp_out) or os.path.getsize(tmp_out) == 0:
            cmd = [ffmpeg_exe, "-y", "-i", file_path, "-t", "14", "-vf", "scale=-2:480", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "30", "-c:a", "aac", tmp_out]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=12)
        if os.path.exists(tmp_out) and os.path.getsize(tmp_out) > 0: os.replace(tmp_out, file_path)
    except Exception: pass

def download_direct(url: str, output_path: str) -> bool:
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Referer": "https://www.tiktok.com/"}
        with requests.get(url, headers=headers, stream=True, verify=False, timeout=12) as r:
            ct = r.headers.get("content-type", "").lower()
            is_valid = r.status_code == 200 and "html" not in ct and (
                "video" in ct or "image" in ct or "octet-stream" in ct or
                any(x in url.lower() for x in [".mp4", ".mov", ".webm", ".mkv", ".jpg", ".jpeg", ".png", ".webp", "tiktokcdn", "tikwm", "twimg", "googlevideo", "fbcdn", "cdninstagram", "zdn.vn", "photo-stal"])
            )
            if is_valid:
                with open(output_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=65536):
                        if chunk: f.write(chunk)
                if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
                    with open(output_path, "rb") as f: header = f.read(64)
                    if header.startswith((b"<!", b"<html", b"<?xml", b"{\"error")):
                        os.unlink(output_path)
                        return False
                    is_img = any(output_path.lower().endswith(x) for x in [".jpg", ".jpeg", ".png", ".webp"]) or "image" in ct
                    if not is_img: trim_to_ten_seconds(output_path)
                    return True
    except Exception: pass
    if os.path.exists(output_path):
        try: os.unlink(output_path)
        except Exception: pass
    return False

def download_capcut(url: str, output_path: str) -> bool:
    try:
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=8)
        match = re.search(r'video_url["\']?\s*:\s*["\'](https?://[^"\']+)["\']', res.text) or re.search(r'<video[^>]+src=["\'](https?://[^"\']+)["\']', res.text)
        if match: return download_direct(match.group(1).replace("\\u0026", "&"), output_path)
    except Exception: pass
    return False

def download_twitter(url: str, output_path: str) -> bool:
    m = re.search(r'status/(\d+)', url)
    if not m: return False
    tid = m.group(1)
    for ep in [f"https://api.fxtwitter.com/status/{tid}", f"https://api.fxtwitter.com/i/status/{tid}"]:
        try:
            r = requests.get(ep, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=6).json()
            videos = r.get("tweet", {}).get("media", {}).get("videos", [])
            if videos and videos[0].get("url"): return download_direct(videos[0]["url"], output_path)
        except Exception: pass
    return False

def download_video_link(url: str, output_path: str) -> str:
    clean_url = url.strip()
    if download_direct(clean_url, output_path): return output_path
    if "capcut.com" in clean_url and download_capcut(clean_url, output_path): return output_path
    if any(k in clean_url.lower() for k in ["twitter.com", "x.com", "t.co"]) and download_twitter(clean_url, output_path): return output_path
    try: ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception: ffmpeg_exe = None
    ydl_opts = {
        "outtmpl": output_path,
        "format": "best[height<=480]/best[height<=720]/bestvideo+bestaudio/best",
        "quiet": True, "no_warnings": True, "noplaylist": True, "nocheckcertificate": True,
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
        "match_filter": yt_dlp.utils.match_filter_func("duration <= 300")
    }
    if ffmpeg_exe: ydl_opts["ffmpeg_location"] = ffmpeg_exe
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl: ydl.download([clean_url])
    except Exception: pass
    if not os.path.exists(output_path):
        candidates = glob.glob(output_path + "*")
        if candidates and os.path.exists(candidates[0]):
            try: os.replace(candidates[0], output_path)
            except Exception: pass
    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        if not any(output_path.lower().endswith(x) for x in [".jpg", ".jpeg", ".png", ".webp"]):
            trim_to_ten_seconds(output_path)
        return output_path
    raise RuntimeError("Khong the tai video hoac anh tu duong dan nay.")
