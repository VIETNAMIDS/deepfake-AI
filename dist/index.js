"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAllServices = startAllServices;
const child_process_1 = require("child_process");
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const teleBot_1 = require("./bots/tele/teleBot");
const messBot_1 = require("./bots/mess/messBot");
const zaloBot_1 = require("./bots/zalo/zaloBot");
const messageBot_1 = require("./bots/message/messageBot");
const libraries_1 = require("./libraries");
function checkEngineHealth(url, maxAttempts = 20) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            http_1.default.get(url, (res) => {
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
function startAllServices() {
    const rootDir = path_1.default.resolve(__dirname, "..");
    const pyProcess = (0, child_process_1.spawn)("python", ["py/server.py"], {
        cwd: rootDir,
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            PYTHONPATH: libraries_1.LIBS_DIR + (process.env.PYTHONPATH ? path_1.default.delimiter + process.env.PYTHONPATH : ""),
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
        (0, teleBot_1.startTeleBot)();
        (0, messBot_1.startMessBot)();
        (0, zaloBot_1.startZaloBot)();
        (0, messageBot_1.startMessageBot)();
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
