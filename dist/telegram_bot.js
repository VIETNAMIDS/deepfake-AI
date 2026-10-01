"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBot = void 0;
const teleBot_1 = require("./bots/tele/teleBot");
exports.runBot = teleBot_1.startTeleBot;
if (require.main === module) {
    (0, teleBot_1.startTeleBot)();
}
