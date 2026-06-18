import assert from "node:assert/strict";
import { calculateExchange, exchangeCalloutText } from "./app-core.mjs";

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
