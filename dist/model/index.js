"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mistralModel = exports.dotsModel = exports.lingModel = exports.cohereModel = exports.senseNovaModel = exports.qwenModel = exports.miniMaxModel = exports.geminiModel = exports.router9Model = exports.modelRouter = exports.ModelRouter = void 0;
const gemini_1 = require("./gemini");
Object.defineProperty(exports, "geminiModel", { enumerable: true, get: function () { return gemini_1.geminiModel; } });
const minimax_1 = require("./minimax");
Object.defineProperty(exports, "miniMaxModel", { enumerable: true, get: function () { return minimax_1.miniMaxModel; } });
const qwen_1 = require("./qwen");
Object.defineProperty(exports, "qwenModel", { enumerable: true, get: function () { return qwen_1.qwenModel; } });
const sensenova_1 = require("./sensenova");
Object.defineProperty(exports, "senseNovaModel", { enumerable: true, get: function () { return sensenova_1.senseNovaModel; } });
const cohere_1 = require("./cohere");
Object.defineProperty(exports, "cohereModel", { enumerable: true, get: function () { return cohere_1.cohereModel; } });
const ling_1 = require("./ling");
Object.defineProperty(exports, "lingModel", { enumerable: true, get: function () { return ling_1.lingModel; } });
const dots_1 = require("./dots");
Object.defineProperty(exports, "dotsModel", { enumerable: true, get: function () { return dots_1.dotsModel; } });
const mistral_1 = require("./mistral");
Object.defineProperty(exports, "mistralModel", { enumerable: true, get: function () { return mistral_1.mistralModel; } });
const router9_1 = require("./router9");
Object.defineProperty(exports, "router9Model", { enumerable: true, get: function () { return router9_1.router9Model; } });
class ModelRouter {
    models = {
        router9: router9_1.router9Model,
        gemini: gemini_1.geminiModel,
        minimax: minimax_1.miniMaxModel,
        qwen: qwen_1.qwenModel,
        sensenova: sensenova_1.senseNovaModel,
        cohere: cohere_1.cohereModel,
        ling: ling_1.lingModel,
        dots: dots_1.dotsModel,
        mistral: mistral_1.mistralModel
    };
    async ask(prompt, systemPrompt = "", preferred = "router9") {
        const order = [preferred, "router9", "minimax", "sensenova", "mistral", "qwen", "ling", "dots", "cohere", "gemini"].filter((v, i, a) => a.indexOf(v) === i && this.models[v]);
        for (const name of order) {
            try {
                const res = await this.models[name].generate(prompt, systemPrompt);
                if (res && res.trim())
                    return res.trim();
            }
            catch { }
        }
        throw new Error("Tất cả các model bao gồm 9Router đều không thể phản hồi.");
    }
    getModel(name) {
        return this.models[name.toLowerCase()];
    }
}
exports.ModelRouter = ModelRouter;
exports.modelRouter = new ModelRouter();
