import assert from "node:assert/strict";
import {
  DEFAULT_PRIZES,
  activePresetStatusText,
  calculateExchange,
  exchangeCalloutText,
  rateUnitHintText,
} from "./app-core.mjs";
import { readFileSync } from "node:fs";

assert.deepEqual(DEFAULT_PRIZES, [500, 1000, 5000]);

const indexHtml = readFileSync(new URL("./index.html", import.meta.url), "utf8");
assert.match(indexHtml, /id="medals"[^>]*value="0"/);

const yenText = exchangeCalloutText({
  result: calculateExchange({ medals: 77, rateType: "rate5152", prizes: [200, 500] }),
  unit: "枚",
});

assert.ok(!yenText.includes("+100円"), "callout should not show confusing +100円 delta");
assert.match(yenText, /1,500円/, "callout should show the next reachable exchange amount");

const exactText = exchangeCalloutText({
  result: calculateExchange({ medals: 104, rateType: "rate5152", prizes: [200] }),
  unit: "枚",
});

assert.equal(exactText, "余りは0枚です。");

assert.equal(activePresetStatusText("駅前店"), "駅前店を適用中");
assert.equal(activePresetStatusText(""), "未保存の設定");
assert.equal(rateUnitHintText("枚"), "100円あたりの枚数");
