import fs from "fs";
import path from "path";
import { Zalo, LoginQRCallbackEventType } from "zca-js";
import qrcode from "qrcode-terminal";

export class DeepCheckZalo {
  readonly brand = "DeepCheck AI";
  private zalo: Zalo;
  private sessionFile: string;
  private qrPath: string;

  constructor(sessionPath?: string, qrPath?: string) {
    this.sessionFile = sessionPath || path.resolve(__dirname, "../../../data/zalo_session.json");
    this.qrPath = qrPath || path.resolve(__dirname, "../../../data/zalo_qr.png");
    this.zalo = new Zalo({ selfListen: false, logging: false, checkUpdate: false });
  }

  async init(): Promise<any> {
    console.log(`[${this.brand}] Khoi dong Zalo Engine...`);
    if (fs.existsSync(this.sessionFile)) {
      try {
        const creds = JSON.parse(fs.readFileSync(this.sessionFile, "utf-8"));
        console.log(`[${this.brand}] Dang dang nhap bang session cookie...`);
        return await this.zalo.login(creds);
      } catch {
        console.log(`[${this.brand}] Session het han, chuyen sang quet QR...`);
      }
    }

    console.log(`[${this.brand}] Vui long quet ma QR de ket noi...`);
    return await this.zalo.loginQR({ qrPath: this.qrPath }, async (ev: any) => {
      if (ev.type === LoginQRCallbackEventType.QRCodeGenerated) {
        if (ev.data?.url) qrcode.generate(ev.data.url, { small: true });
        if (ev.actions?.saveToFile) await ev.actions.saveToFile();
        console.log(`[${this.brand}] Da xuat ma QR moi. Hay mo Zalo de quet!`);
      }
      if (ev.type === LoginQRCallbackEventType.GotLoginInfo) {
        fs.writeFileSync(this.sessionFile, JSON.stringify(ev.data, null, 2), "utf-8");
        console.log(`[${this.brand}] Da luu session cookie vao ${this.sessionFile}`);
      }
    });
  }
}

export { DeepCheckZalo as RuaxbonzZalo };
