import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const info = JSON.parse(await readFile(path.join(root, "info.json"), "utf8"));
const appcast = JSON.parse(await readFile(path.join(root, "appcast.json"), "utf8"));
const source = JSON.parse(await readFile(path.join(root, "source.json"), "utf8"));
const latest = appcast.versions[0];

assert.equal(info.identifier, "com.schweppessoda.bailian.ocr");
assert.equal(info.category, "ocr");
assert.equal(info.version, "2.3.2");
assert.equal(info.minBobVersion, "1.8.0");
assert.equal(info.homepage, "https://github.com/doctorllll/bob-bailian-ocr");
assert.equal(info.appcast, "https://raw.githubusercontent.com/doctorllll/bob-bailian-ocr/main/appcast.json");
assert.equal(appcast.identifier, info.identifier);
assert.equal(latest.version, info.version);
assert.equal(latest.minBobVersion, info.minBobVersion);
assert.match(latest.sha256, /^[a-f0-9]{64}$/);
assert.equal(latest.url, "https://github.com/doctorllll/bob-bailian-ocr/releases/download/v2.3.2/bob-bailian-ocr-2.3.2.bobplugin");
assert.equal(source.version, info.version);
assert.equal(source.commit, "1805ad3344ecd899ad603111a02b107e2cb44f7a");
const accessMode = info.options.find((item) => item.identifier === "accessMode");
assert.equal(accessMode.defaultValue, "pay_as_you_go");
assert.deepEqual(accessMode.menuValues.map((item) => item.value), ["pay_as_you_go", "coding_plan", "token_plan"]);

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await javascriptFiles(full));
    else if (entry.name.endsWith(".js")) result.push(full);
  }
  return result;
}

for (const file of await javascriptFiles(root)) {
  if (file.includes(`${path.sep}scripts${path.sep}`)) continue;
  const text = await readFile(file, "utf8");
  assert.doesNotMatch(text, /__BAILIAN_RUNTIME_PROFILE_(?:DEVELOPMENT|PERSONAL|PUBLIC)__/);
  for (const forbidden of [/^\s*(?:import|export)\s/m, /\bfetch\s*\(/, /\bnew\s+(?:URL|Response|TextDecoder)\b/, /\bprocess\./, /\bBuffer\./]) {
    assert.doesNotMatch(text, forbidden, `${path.relative(root, file)} must remain Bob JavaScriptCore-compatible`);
  }
}
console.log("Bob OCR publishing metadata and JavaScriptCore runtime verified.");
