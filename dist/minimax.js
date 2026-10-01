"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliberateWithJudge = exports.formatFallbackVerdict = exports.deliberateWithMiniMax = void 0;
const judge_1 = require("./CHECKVIDEO/judge");
Object.defineProperty(exports, "deliberateWithJudge", { enumerable: true, get: function () { return judge_1.deliberateWithJudge; } });
Object.defineProperty(exports, "formatFallbackVerdict", { enumerable: true, get: function () { return judge_1.formatFallbackVerdict; } });
exports.deliberateWithMiniMax = judge_1.deliberateWithJudge;
