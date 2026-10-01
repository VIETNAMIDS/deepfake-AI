import { spawn } from "child_process";
import http from "http";
import path from "path";
import { startTeleBot } from "./bots/tele/teleBot";
import { startMessBot } from "./bots/mess/messBot";
import { startZaloBot } from "./bots/zalo/zaloBot";
import { startMessageBot } from "./bots/message/messageBot";
import { LIBS_DIR } from "./libraries";

function checkEngineHealth(url: string, maxAttempts = 20): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on("error", () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          reject(new Error("Python engine failed to start in time."));
        }
      });
    }, 1000);
  });
}

export function startAllServices() {
  const rootDir = path.resolve(__dirname, "..");

  const pyProcess = spawn("python", ["py/server.py"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      PYTHONPATH: LIBS_DIR + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : ""),
      PYTHONIOENCODING: "utf-8"
    }
  });

  process.on("exit", () => pyProcess.kill());
  process.on("SIGINT", () => {
    pyProcess.kill();
    process.exit();
  });

  checkEngineHealth("http://127.0.0.1:8000/health")
    .then(() => {
      console.log("Python Forensic Engine is ready on port 8000.");
      startTeleBot();
      startMessBot();
      startZaloBot();
      startMessageBot();
    })
    .catch((err) => {
      console.error(err.message);
      pyProcess.kill();
      process.exit(1);
    });
}

if (require.main === module) {
  startAllServices();
}
