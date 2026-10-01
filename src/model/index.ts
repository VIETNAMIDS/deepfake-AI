import { geminiModel } from "./gemini";
import { miniMaxModel } from "./minimax";
import { qwenModel } from "./qwen";
import { senseNovaModel } from "./sensenova";
import { cohereModel } from "./cohere";
import { lingModel } from "./ling";
import { dotsModel } from "./dots";
import { mistralModel } from "./mistral";
import { router9Model } from "./router9";

export interface AIModelAdapter {
  name: string;
  generate(prompt: string, systemPrompt?: string): Promise<string>;
}

export class ModelRouter {
  private models: Record<string, AIModelAdapter> = {
    router9: router9Model,
    gemini: geminiModel,
    minimax: miniMaxModel,
    qwen: qwenModel,
    sensenova: senseNovaModel,
    cohere: cohereModel,
    ling: lingModel,
    dots: dotsModel,
    mistral: mistralModel
  };

  async ask(prompt: string, systemPrompt = "", preferred = "mistral"): Promise<string> {
    const order = [preferred, "mistral", "minimax", "qwen", "dots", "ling", "cohere", "sensenova", "gemini", "router9"].filter(
      (v, i, a) => a.indexOf(v) === i && this.models[v]
    );

    for (const name of order) {
      try {
        const res = await this.models[name].generate(prompt, systemPrompt);
        if (res && res.trim()) return res.trim();
      } catch {}
    }
    throw new Error("Tất cả các model bao gồm 9Router đều không thể phản hồi.");
  }

  getModel(name: string): AIModelAdapter | undefined {
    return this.models[name.toLowerCase()];
  }
}

export const modelRouter = new ModelRouter();
export { router9Model, geminiModel, miniMaxModel, qwenModel, senseNovaModel, cohereModel, lingModel, dotsModel, mistralModel };
