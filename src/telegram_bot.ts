import { startTeleBot } from "./bots/tele/teleBot";

export const runBot = startTeleBot;

if (require.main === module) {
  startTeleBot();
}
