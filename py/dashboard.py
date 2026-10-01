import json
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

dashboard_router = APIRouter()
ROOT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT_DIR / "data"
HTML_FILE = Path(__file__).resolve().parent / "dashboard.html"

def read_json_data(file_name: str, fallback):
    p = DATA_DIR / file_name
    if not p.exists():
        return fallback
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback

@dashboard_router.get("/dashboard", response_class=HTMLResponse)
def get_dashboard_page():
    if not HTML_FILE.exists():
        return HTMLResponse("<h3>Dashboard HTML not found</h3>", status_code=404)
    with open(HTML_FILE, "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())

@dashboard_router.get("/dashboard/stats")
def get_dashboard_stats():
    users = read_json_data("users.json", {})
    logs = read_json_data("logs.json", [])
    total_users = len(users) if isinstance(users, dict) else 0
    total_checks = len(logs) if isinstance(logs, list) else 0

    ai_count = 0
    real_count = 0
    for l in logs:
        v = str(l.get("verdict", "")).lower()
        if "deepfake" in v or "ai / deepfake" in v or "can thiệp" in v:
            ai_count += 1
        elif "real" in v or "thật" in v:
            real_count += 1

    return {
        "totalUsers": total_users,
        "totalChecks": total_checks,
        "aiCount": ai_count,
        "realCount": real_count,
        "recentLogs": logs[-15:][::-1] if isinstance(logs, list) else []
    }
