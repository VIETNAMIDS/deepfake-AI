"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuaxbonzZalo = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const zca_js_1 = require("zca-js");
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
class RuaxbonzZalo {
    brand = "ruaxbonz.com";
    zalo;
    sessionFile;
    qrPath;
    constructor(sessionPath, qrPath) {
        this.sessionFile = sessionPath || path_1.default.resolve(__dirname, "../../../data/zalo_session.json");
        this.qrPath = qrPath || path_1.default.resolve(__dirname, "../../../data/zalo_qr.png");
        this.zalo = new zca_js_1.Zalo({
            selfListen: false,
            logging: false,
            checkUpdate: false
        });
    }
    async init() {
        console.log(`[${this.brand}] Khoi dong Zalo Engine...`);
        if (fs_1.default.existsSync(this.sessionFile)) {
            try {
                const creds = JSON.parse(fs_1.default.readFileSync(this.sessionFile, "utf-8"));
                console.log(`[${this.brand}] Dang dang nhap bang session cookie...`);
                return await this.zalo.login(creds);
            }
            catch {
                console.log(`[${this.brand}] Session het han, chuyen sang quet QR...`);
            }
        }
        console.log(`[${this.brand}] Vui long quet ma QR de ket noi...`);
        return await this.zalo.loginQR({ qrPath: this.qrPath }, async (ev) => {
            if (ev.type === zca_js_1.LoginQRCallbackEventType.QRCodeGenerated) {
                if (ev.data?.url)
                    qrcode_terminal_1.default.generate(ev.data.url, { small: true });
                if (ev.actions?.saveToFile)
                    await ev.actions.saveToFile();
                console.log(`[${this.brand}] Da xuat ma QR moi. Hay mo Zalo de quet!`);
            }
            if (ev.type === zca_js_1.LoginQRCallbackEventType.GotLoginInfo) {
                fs_1.default.writeFileSync(this.sessionFile, JSON.stringify(ev.data, null, 2), "utf-8");
                console.log(`[${this.brand}] Da luu session cookie vao ${this.sessionFile}`);
            }
        });
    }
}
exports.RuaxbonzZalo = RuaxbonzZalo;
