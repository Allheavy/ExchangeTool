import assert from "node:assert/strict";
import {
  DEFAULT_PRIZES,
  activePresetStatusText,
  buildRateConfigFromOption,
  calculateExchange,
  exchangeCalloutText,
  formatExchangeRateValue,
  nextExchangeMedalsTarget,
  payoutYenPerUnit,
  rateCategoryOptions,
  rateUnitHintText,
  selectedPresetIndex,
  movePreset,
  updatePresetAtIndex,
} from "./app-core.mjs";
import { existsSync, readFileSync } from "node:fs";

assert.deepEqual(DEFAULT_PRIZES, [500, 1000, 5000]);

const indexHtml = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
const localServer = readFileSync(new URL("./serve-local.js", import.meta.url), "utf8");
const faviconSvgUrl = new URL("./icons/favicon.svg", import.meta.url);
assert.match(indexHtml, /id="medals"[^>]*value="0"/);
assert.match(indexHtml, /<link rel="icon" type="image\/svg\+xml" href="\.\/icons\/favicon\.svg\?v=27" \/>/);
assert.match(indexHtml, /<link rel="apple-touch-icon" href="\.\/icons\/icon-192\.png\?v=27" \/>/);
assert.doesNotMatch(indexHtml, /<link rel="icon" href="\.\/icons\/icon-192\.png" \/>/);
assert.ok(existsSync(faviconSvgUrl), "generic SVG favicon should exist");
const faviconSvg = readFileSync(faviconSvgUrl, "utf8");
assert.doesNotMatch(faviconSvg, /51\.52/);
assert.doesNotMatch(faviconSvg, /#111827/);
assert.doesNotMatch(faviconSvg, /#f4efe5/);
assert.match(faviconSvg, /<rect width="192" height="192" fill="#f59e0b"\/>/);
assert.doesNotMatch(faviconSvg, /<circle/);
assert.match(faviconSvg, /stroke-width="14"/);
assert.match(localServer, /"\.svg": "image\/svg\+xml; charset=utf-8"/);
assert.match(indexHtml, /function selectInitialZeroOnFocus/);
assert.match(indexHtml, /medalsInput\.addEventListener\("focus", selectInitialZeroOnFocus\)/);
assert.match(indexHtml, /id="mainRateCategory"/);
assert.match(indexHtml, /id="mainRateOption"/);
assert.match(indexHtml, /id="exchangeRateHeading"[^>]*>交換率<\/h3>[\s\S]*id="mainRateCategory"[\s\S]*id="mainRateOption"/);
assert.match(indexHtml, /id="exchangeRateHeading"[^>]*>交換率<\/h3>[\s\S]*id="prizeChoiceHeading"[^>]*>使う景品<\/h3>/);
assert.match(indexHtml, /class="chip-mark" aria-hidden="true"/);
assert.match(indexHtml, /\.chip\.selected[\s\S]*background: var\(--accent\)/);
assert.match(indexHtml, /\.chip\.selected\s*\{[^}]*box-shadow: none/);
assert.match(indexHtml, /\.chip:not\(\.selected\)[\s\S]*border-color: rgba\(40, 84, 103/);
assert.match(indexHtml, /id="quickSavePresetBtn"/);
assert.match(indexHtml, /id="presetEditForm"/);
assert.match(indexHtml, /id="editPresetName"/);
assert.match(indexHtml, /id="editPresetRateCategory"/);
assert.match(indexHtml, /id="editPresetRateOption"/);
assert.match(indexHtml, /id="editPresetPrizes"/);
assert.match(indexHtml, /id="savePresetEditBtn"/);
assert.match(indexHtml, /id="movePresetUpBtn"/);
assert.match(indexHtml, /id="movePresetDownBtn"/);
assert.match(indexHtml, /選択中の設定を上へ・下へ移動/);
assert.match(indexHtml, /selectedPresetIndex\(presetManage\.value, presets\)/);
assert.match(indexHtml, /movePreset\(\{ presets, index, direction \}\)/);
assert.match(indexHtml, /id="leftTargetMedals"/);
assert.match(indexHtml, /id="nextTargetMedals"/);
assert.match(indexHtml, /id="jumpExchangeTargetBtn"/);
assert.match(indexHtml, /nextExchangeMedalsTarget\(result\)/);
assert.match(indexHtml, /jumpExchangeTargetBtn\.addEventListener\("click"/);
assert.match(indexHtml, /class="target-medals-number"/);
assert.match(indexHtml, /id="exchangeDetails"[\s\S]*必要枚数[\s\S]*id="bestRequired"[\s\S]*交換額[\s\S]*id="bestYen"[\s\S]*景品[\s\S]*id="bestCombo"/);
assert.match(indexHtml, /<th>必要枚数<\/th>[\s\S]*<th>交換額<\/th>[\s\S]*<th>景品<\/th>/);
assert.match(indexHtml, /id="updateBanner"/);
assert.match(indexHtml, /id="reloadUpdateBtn"/);
assert.match(indexHtml, /id="checkUpdateBtn"/);
assert.match(indexHtml, /手入力/);
assert.match(indexHtml, /data-rate-mode="preset"/);
assert.match(indexHtml, /data-rate-mode="custom"/);
assert.doesNotMatch(indexHtml, /id="manualRateUnit"/);
assert.match(indexHtml, /id="saveManualRateMeta"/);
assert.match(indexHtml, /id="manualSaveKind"/);
assert.doesNotMatch(indexHtml, /<select id="manualSaveKind"/);
assert.match(indexHtml, /data-manual-save-kind="slot"[^>]*>パチスロ<\/button>/);
assert.match(indexHtml, /data-manual-save-kind="pachi"[^>]*>パチンコ<\/button>/);
assert.match(indexHtml, /id="manualSaveLendingRate"/);
assert.match(indexHtml, /貸し出しレート/);
assert.match(indexHtml, /manualSaveKindInput\.value === "pachi" \? `\$\{rateText\}円パチンコ` : `\$\{rateText\}円スロット`/);
assert.doesNotMatch(indexHtml, /表示用の種類/);
assert.match(indexHtml, /id="customExchangeRate"[^>]*step="0\.001"/);
assert.match(indexHtml, /class="secondary save-toggle-btn"/);
assert.match(indexHtml, /button\.save-toggle-btn[\s\S]*width: auto/);
assert.match(indexHtml, /＋ この設定を保存/);
assert.match(indexHtml, /景品・金額を見る/);
assert.match(indexHtml, /景品・金額を隠す/);
assert.doesNotMatch(indexHtml, /結果を見る/);
assert.doesNotMatch(indexHtml, /結果を隠す/);
assert.match(indexHtml, /id="showSaveSettingsBtn"[^>]*aria-expanded="false"/);
assert.match(indexHtml, /data-save-toggle-label="open"/);
assert.match(indexHtml, /data-save-toggle-label="close"/);
assert.match(indexHtml, /設定名/);
assert.match(indexHtml, /placeholder="例: 駅前店"/);
assert.match(indexHtml, /任意です。空欄の場合は交換率から自動で表示名を作ります。/);
assert.doesNotMatch(indexHtml, /例: 交換設定A/);
assert.doesNotMatch(indexHtml, /<select id="editPresetRateCategory"/);
assert.match(indexHtml, /id="editPresetLendingRate"/);
assert.match(indexHtml, /data-edit-preset-kind="slot"[^>]*>パチスロ<\/button>/);
assert.match(indexHtml, /data-edit-preset-kind="pachi"[^>]*>パチンコ<\/button>/);
assert.match(indexHtml, /function categoryFromLendingRate/);
assert.match(indexHtml, /syncEditPresetCategoryFromInputs\(\);/);
assert.match(indexHtml, />管理<\/button>/);
assert.doesNotMatch(indexHtml, /<h3>交換率を追加<\/h3>/);
assert.doesNotMatch(indexHtml, /id="addRateBtn"/);
assert.match(indexHtml, /id="applyCalcBtn"[^>]*>反映して閉じる<\/button>[\s\S]*id="closeCalcBtn"/);
assert.match(indexHtml, /manualPresetCategory\(preset\)/);
assert.match(indexHtml, /mainRateCategoryInput\.value = category/);
assert.match(serviceWorker, /exchange-tool-pwa-v27/);
assert.match(serviceWorker, /\.\/icons\/icon-192\.png\?v=27/);
assert.match(serviceWorker, /\.\/icons\/icon-512\.png\?v=27/);

const yenText = exchangeCalloutText({
  result: calculateExchange({ medals: 77, rateType: "rate5152", prizes: [200, 500] }),
  unit: "枚",
});

assert.ok(!yenText.includes("+100円"), "callout should not show confusing +100円 delta");
assert.equal(yenText, "あと1枚");

const exactText = exchangeCalloutText({
  result: calculateExchange({ medals: 104, rateType: "rate5152", prizes: [200] }),
  unit: "枚",
});

assert.equal(exactText, "余りは0枚です。");

assert.equal(calculateExchange({ medals: 0, rateType: "pachi4_28", prizes: [500] }).best.requiredMedals, 0);

const fiveHundredYenUnitRates = {
  twentySixForFiveHundred: { label: "26 per 500", medalsPerYen: 26 / 500, unitLabel: "枚" },
};

const withLeftoverTarget = nextExchangeMedalsTarget(
  calculateExchange({
    medals: 80,
    rateType: "twentySixForFiveHundred",
    prizes: [500],
    rates: fiveHundredYenUnitRates,
  })
);

assert.equal(withLeftoverTarget, 78);

const exactThresholdTarget = nextExchangeMedalsTarget(
  calculateExchange({
    medals: 78,
    rateType: "twentySixForFiveHundred",
    prizes: [500],
    rates: fiveHundredYenUnitRates,
  })
);

assert.equal(exactThresholdTarget, 52);

const noLowerExchangeTarget = nextExchangeMedalsTarget(
  calculateExchange({
    medals: 20,
    rateType: "twentySixForFiveHundred",
    prizes: [500],
    rates: fiveHundredYenUnitRates,
  })
);

assert.equal(noLowerExchangeTarget, null);

assert.equal(activePresetStatusText("駅前店"), "駅前店を適用中");
assert.equal(activePresetStatusText(""), "");
assert.equal(rateUnitHintText("枚"), "100円あたりの枚数");
assert.equal(payoutYenPerUnit(5.152), 100 / 5.152);
assert.equal(formatExchangeRateValue(5.1524), "5.152");

const pachi4Options = rateCategoryOptions("pachi4");
assert.equal(pachi4Options[0].label, "25玉（4円等価）");
assert.ok(pachi4Options.some((option) => option.label === "26玉（3.84円）"));

const slot20Rate = buildRateConfigFromOption("slot20", "5.2");
assert.deepEqual(slot20Rate, {
  label: "20円スロット 5.2枚交換",
  medalsPerYen: 5.2 / 100,
  unitLabel: "枚",
  category: "slot20",
  exchangeRate: 5.2,
  yenBase: 100,
});

const presetUpdate = updatePresetAtIndex({
  presets: [
    { displayName: "A店｜20スロ｜5.2枚交換", storeName: "A店", exchangeRate: 5.2, prizes: [500] },
    { displayName: "B店｜20スロ｜5.6枚交換", storeName: "B店", exchangeRate: 5.6, prizes: [500, 1000] },
  ],
  index: 1,
  updates: {
    displayName: "B店新｜20スロ｜5.3枚交換",
    storeName: "B店新",
    rateType: "custom-slot20-5.3",
    rateCategory: "slot20",
    exchangeRate: 5.3,
    isCustomExchangeRate: false,
    manualRateKind: "",
    manualLendingRate: null,
    prizes: [1000, 500, 1000],
    prizeValues: [1000, 500, 1000],
    unitLabel: "枚",
    rateLabel: "20円スロット 5.3枚交換",
  },
});

assert.equal(presetUpdate.updated.displayName, "B店新｜20スロ｜5.3枚交換");
assert.deepEqual(presetUpdate.updated.prizes, [500, 1000]);
assert.deepEqual(presetUpdate.presets[0], {
  displayName: "A店｜20スロ｜5.2枚交換",
  storeName: "A店",
  exchangeRate: 5.2,
  prizes: [500],
});
assert.equal(presetUpdate.presets[1].exchangeRate, 5.3);

assert.equal(selectedPresetIndex(""), null);
assert.equal(selectedPresetIndex("0", [{ name: "A" }]), 0);
assert.equal(selectedPresetIndex("1", [{ name: "A" }]), null);
assert.equal(selectedPresetIndex("abc", [{ name: "A" }]), null);

const movedDown = movePreset({
  presets: [{ name: "A" }, { name: "B" }, { name: "C" }],
  index: 0,
  direction: 1,
});
assert.deepEqual(movedDown.presets.map((preset) => preset.name), ["B", "A", "C"]);
assert.equal(movedDown.index, 1);

const movedUp = movePreset({
  presets: [{ name: "A" }, { name: "B" }, { name: "C" }],
  index: 2,
  direction: -1,
});
assert.deepEqual(movedUp.presets.map((preset) => preset.name), ["A", "C", "B"]);
assert.equal(movedUp.index, 1);

const notMoved = movePreset({
  presets: [{ name: "A" }, { name: "B" }],
  index: 0,
  direction: -1,
});
assert.deepEqual(notMoved.presets.map((preset) => preset.name), ["A", "B"]);
assert.equal(notMoved.index, 0);
