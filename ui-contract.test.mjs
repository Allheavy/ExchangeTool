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
  assert.match(html, /<link\s+rel="stylesheet"\s+href="\.\/tokens\.css\?v=64"/);
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
  assert.match(html, /data-sensitive-toggle="table"/);
  assert.match(html, /id="saveSettingsForm"/);
  assert.match(html, /id="quickSavePresetBtn"/);
  assert.match(html, /id="presetManage"/);
  assert.match(html, /const PRESETS_KEY = "exchangeTool\.presets\.v5"/);
});

test("offline shell caches the visual token stylesheet", () => {
  const serviceWorker = readFileSync(serviceWorkerUrl, "utf8");

  assert.match(serviceWorker, /["']\.\/tokens\.css\?v=64["']/);
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
