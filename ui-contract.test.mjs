import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const indexUrl = new URL("./index.html", import.meta.url);
const tokensUrl = new URL("./tokens.css", import.meta.url);
const serviceWorkerUrl = new URL("./sw.js", import.meta.url);
const localServerUrl = new URL("./serve-local.js", import.meta.url);

function indexHtml() {
  return readFileSync(indexUrl, "utf8");
}

test("mobile visual system exposes tokens, tab semantics, and numeric alignment", () => {
  const html = indexHtml();

  assert.equal(existsSync(tokensUrl), true, "tokens.css must exist");
  assert.match(html, /<link\s+rel="stylesheet"\s+href="\.\/tokens\.css\?v=65"/);
  assert.match(html, /<nav class="tabs" role="tablist"/);
  assert.match(
    html,
    /class="tab active"[^>]*data-tab="exchange"[^>]*role="tab"[^>]*aria-selected="true"/
  );
  assert.match(
    html,
    /class="tab"[^>]*data-tab="group"[^>]*role="tab"[^>]*aria-selected="false"/
  );
  assert.match(html, /font-variant-numeric:\s*tabular-nums/);
});

test("privacy toggles and saved-condition controls remain connected", () => {
  const html = indexHtml();

  assert.match(html, /data-sensitive-group="summary"/);
  assert.match(html, /data-sensitive-toggle="summary"/);
  assert.match(html, /data-sensitive-group="table"/);
  assert.doesNotMatch(html, /data-sensitive-toggle="table"/);
  assert.match(html, /id="conditionPresetFields"/);
  assert.match(html, /id="saveConditionPresetBtn"/);
  assert.match(html, /id="presetManage"/);
  assert.match(html, /const PRESETS_KEY = "exchangeTool\.presets\.v5"/);
});

test("offline shell caches the visual token stylesheet", () => {
  const serviceWorker = readFileSync(serviceWorkerUrl, "utf8");

  assert.match(serviceWorker, /["']\.\/tokens\.css\?v=65["']/);
});

test("local preview serves stylesheets with a CSS MIME type", () => {
  const localServer = readFileSync(localServerUrl, "utf8");

  assert.match(localServer, /"\.css":\s*"text\/css;\s*charset=utf-8"/);
});

test("layout spacing stays on the four-pixel scale", () => {
  const html = indexHtml();
  const declarations = html.matchAll(
    /(?:^|[;{\s])(?:padding(?:-(?:top|right|bottom|left))?|margin(?:-(?:top|right|bottom|left))?|gap|row-gap|column-gap)\s*:\s*([^;}]*)/gm
  );
  const offScale = [];

  for (const declaration of declarations) {
    for (const value of declaration[1].matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const pixels = Number(value[1]);
      if (pixels % 4 !== 0) offScale.push(declaration[0].trim());
    }
  }

  assert.deepEqual(offScale, []);
});

test("interactive controls expose hover, focus, active, and disabled states", () => {
  const html = indexHtml();

  assert.match(html, /button:not\(:disabled\):hover/);
  assert.match(html, /button:focus-visible/);
  assert.match(html, /button:active/);
  assert.match(html, /button:disabled/);
  assert.match(html, /input:disabled/);
  assert.match(html, /select:disabled/);
});

test("approved mock structure is preserved across exchange, group, and management screens", () => {
  const html = indexHtml();

  assert.match(html, /class="goal-scale"[\s\S]*id="leftMedals"[\s\S]*class="scale-track"[\s\S]*id="leftTargetMedals"[\s\S]*id="nextTargetMedals"/);
  assert.doesNotMatch(html, /ひとつ前|さらに次|id="prevAuxTargetBtn"|id="nextAuxTargetBtn"/);
  assert.match(html, /class="candidate-head"[\s\S]*上1 · 達成 · 下2/);
  assert.match(html, /id="exchangeDetails"[\s\S]*>現在の交換結果<\/h2>/);

  assert.ok(
    html.indexOf('id="paymentRows"') < html.indexOf('id="memberRows"'),
    "group transfers should appear before member inputs"
  );
  assert.match(html, /class="member-columns"/);
  assert.match(html, /class="group-totals"[\s\S]*id="groupInvestment"[\s\S]*id="groupRecovery"[\s\S]*id="groupProfit"[\s\S]*class="group-table"/);
  assert.match(html, /\.member\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+repeat\(2,\s*minmax\(0,\s*1fr\)\)\s+auto/s);
  assert.match(html, /\.member input\s*\{[^}]*padding:\s*var\(--space-xs\)[^}]*border:\s*var\(--rule-thin\)\s+solid\s+var\(--color-rule\)/s);

  assert.match(html, /<label[^>]*for="presetManage"[^>]*>編集するPreset<\/label>/);
  assert.match(html, /id="movePresetUpBtn"[\s\S]*?<svg[\s\S]*?上へ移動/);
  assert.match(html, /id="movePresetDownBtn"[\s\S]*?<svg[\s\S]*?下へ移動/);
  assert.match(html, /class="setting-block update-setting"/);
  assert.match(html, /<header class="work-head">\s*<h2>管理<\/h2>\s*<p>景品額と保存した条件を整理します。<\/p>/);
  assert.match(html, /class="admin-actions"[\s\S]*id="editPresetBtn"[\s\S]*id="deletePresetBtn"/);
  assert.match(html, /\.setting-block \.row-3\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(html, /\.update-setting #checkUpdateBtn\s*\{[^}]*width:\s*auto/s);
});

test("production tokens use the approved warm paper and pencil slate palette", () => {
  const tokens = readFileSync(tokensUrl, "utf8");

  assert.match(tokens, /--color-paper:\s*oklch\(97%\s+0\.008\s+90\)/);
  assert.match(tokens, /--color-ink:\s*oklch\(24%\s+0\.018\s+245\)/);
  assert.match(tokens, /--color-accent:\s*oklch\(38%\s+0\.038\s+245\)/);
});

test("production uses the approved mock DOM instead of legacy visual wrappers", () => {
  const html = indexHtml();

  assert.match(html, /<section class="preset-region"[\s\S]*id="presetStrip"[\s\S]*id="addPresetBtn"/);
  assert.match(html, /<section class="condition-strip"[\s\S]*id="conditionRateSummary"[\s\S]*id="openConditionSheetBtn"/);
  assert.ok(
    html.indexOf('class="preset-region"') < html.indexOf('class="condition-strip"'),
    "preset strip should be separate from the current condition"
  );
  assert.match(html, /id="exchangeDetails"[^>]*class="[^"]*result-section/);
  assert.match(html, /id="candidateResults"[^>]*class="[^"]*candidate-section/);
  assert.match(html, /class="primary-input"[\s\S]*>持ち玉と交換目標<\/h2>/);
  assert.match(html, /\.goal-scale\s*\{[^}]*margin-bottom:\s*var\(--space-xl\)/s);
  assert.equal((html.match(/data-sensitive-toggle=/g) || []).length, 1, "one privacy action should control both result regions");
  assert.match(
    html,
    /\.exchange-choices\.open\s*\{[^}]*inset:\s*0[^}]*max-height:\s*none/s,
    "condition editing should replace the full mobile viewport"
  );
});

test("exchange targets, connector, candidate units, and preset add alignment follow the approved interaction", () => {
  const html = indexHtml();

  assert.match(html, /class="held-to-current-line"[^>]*aria-hidden="true"/);
  assert.match(html, /<button id="leftTargetMedals"[^>]*class="[^"]*target-medals[^"]*"[^>]*disabled/);
  assert.match(html, /<button id="nextTargetMedals"[^>]*class="[^"]*target-medals[^"]*"[^>]*disabled/);
  assert.match(html, /leftTargetMedals\.addEventListener\("click",\s*\(\) => applyTargetMedals\(leftTargetMedals\)\)/);
  assert.match(html, /nextTargetMedals\.addEventListener\("click",\s*\(\) => applyTargetMedals\(nextTargetMedals\)\)/);
  assert.match(html, /medalsInput\.dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\)/);
  assert.match(html, /class="candidate-required-unit"/);
  assert.match(html, /\.preset-row\s*\{[^}]*align-items:\s*center/s);
  assert.match(html, /\.preset-add\s*\{[^}]*align-self:\s*center/s);
});

test("condition editor uses the approved fullscreen mock structure", () => {
  const html = indexHtml();

  assert.match(html, /class="condition-editor-header"[\s\S]*id="closeConditionSheetBtn"[\s\S]*>条件を変更<\/h2>/);
  assert.match(html, /class="condition-editor-body"[\s\S]*>種別<\/h3>/);
  assert.match(html, /class="condition-kind-row"[\s\S]*id="conditionLendingRate"[\s\S]*data-condition-kind="pachi"[\s\S]*data-condition-kind="slot"/);
  assert.match(html, /id="conditionExchangeRate"[^>]*step="0\.001"/);
  assert.match(html, /id="conditionExchangeRateUnit"/);
  assert.match(html, /id="conditionPrizeChoices"/);
  assert.match(html, /id="applyConditionBtn"[^>]*>この条件を反映<\/button>/);
  assert.match(html, /id="conditionPresetFields"[^>]*class="[^"]*hidden/);
  assert.match(html, /id="saveConditionPresetBtn"[^>]*>Presetとして保存<\/button>/);

  assert.doesNotMatch(html, />入力方法</);
  assert.doesNotMatch(html, />よく使う</);
  assert.doesNotMatch(html, /id="showSaveSettingsBtn"/);
  assert.doesNotMatch(html, /id="guidedRateFieldsGroup"/);
});

test("candidate emphasis and group breakdown styling match the approved mock", () => {
  const html = indexHtml();

  assert.match(html, /result\.candidates\.slice\(0,\s*4\)/);
  assert.match(html, /candidate\.requiredMedals === result\.best\.requiredMedals/);
  assert.match(html, /\.group-totals\s*\{[^}]*margin-bottom:\s*var\(--space-md\)/s);
  assert.match(html, /\.group-totals\s*>\s*\*\s*\{[^}]*background:\s*transparent/s);
  assert.match(html, /\.group-table\s*\{[^}]*margin-bottom:\s*var\(--space-lg\)/s);
  assert.match(html, /\.breakdown-section\s*\{[^}]*display:\s*block[^}]*padding:\s*var\(--space-lg\)\s+var\(--space-md\)/s);
});
