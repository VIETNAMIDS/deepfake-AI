import os, sys, shutil, uuid
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
libs_target = ROOT_DIR / "python_libs"
if libs_target.exists() and str(libs_target) not in sys.path:
    sys.path.insert(0, str(libs_target))

if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"): sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException

load_dotenv(ROOT_DIR / ".env")

from gemini_engine import analyze_video
from downloader import download_video_link, trim_to_ten_seconds
from c2pa_checker import check_c2pa
from dashboard import dashboard_router

app = FastAPI(title="DeepCheck Forensic Engine")
app.include_router(dashboard_router)
TEMP_DIR = ROOT_DIR / "temp_media"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

class UrlRequest(BaseModel):
    url: str

@app.get("/health")
def health():
    return {"status": "ok", "service": "python_forensic_engine"}

@app.post("/analyze")
async def analyze_video_endpoint(file: UploadFile = File(...)):
    temp_path = TEMP_DIR / f"{uuid.uuid4()}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer: shutil.copyfileobj(file.file, buffer)
        c2pa_res = check_c2pa(str(temp_path))
        if not any(str(temp_path).lower().endswith(x) for x in [".jpg", ".jpeg", ".png", ".webp"]):
            trim_to_ten_seconds(str(temp_path))
        result = analyze_video(str(temp_path))
        if isinstance(result, dict): result["c2pa"] = c2pa_res
        return {"success": True, "data": result}
    except Exception as e:
        print(f"[Analyze Error] {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists(): temp_path.unlink(missing_ok=True)

@app.post("/analyze-url")
async def analyze_by_url(req: UrlRequest):
    ext = ".jpg" if any(x in req.url.lower() for x in [".jpg", ".jpeg", ".png", ".webp", "zdn.vn", "photo"]) else ".mp4"
    temp_path = TEMP_DIR / f"{uuid.uuid4()}_dl{ext}"
    try:
        download_video_link(req.url, str(temp_path))
        if not temp_path.exists() or temp_path.stat().st_size == 0:
            raise RuntimeError("Download that bai.")
        c2pa_res = check_c2pa(str(temp_path))
        result = analyze_video(str(temp_path))
        if isinstance(result, dict): result["c2pa"] = c2pa_res
        return {"success": True, "data": result}
    except Exception as e:
        print(f"[Analyze URL Error] {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_path.exists(): temp_path.unlink(missing_ok=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
