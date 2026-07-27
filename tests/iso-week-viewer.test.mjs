import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../apps/iso-week-viewer/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];

assert.ok(script, "ISO Week Viewer should include inline JavaScript");

const sandbox = {
  document: {
    getElementById: () => ({ addEventListener() {}, textContent: "", innerHTML: "", value: "" }),
    addEventListener() {},
    createElement: () => ({ className: "", innerHTML: "", appendChild() {} }),
  },
  window: {},
  Intl,
};

vm.createContext(sandbox);
vm.runInContext(script, sandbox);

assert.equal(typeof sandbox.generateIsoWeeks, "function", "generateIsoWeeks should be globally available");

const weeks2026 = sandbox.generateIsoWeeks(2026);
assert.equal(weeks2026.length, 53, "2026 should contain 53 ISO weeks");
assert.equal(weeks2026[0].week, 1);
assert.equal(weeks2026[0].monday, "2025-12-29");
assert.equal(weeks2026.at(-1).week, 53);
assert.equal(weeks2026.at(-1).monday, "2026-12-28");

const weeks2027 = sandbox.generateIsoWeeks(2027);
assert.equal(weeks2027.length, 52, "2027 should contain 52 ISO weeks");
assert.equal(weeks2027[0].week, 1);
assert.equal(weeks2027[0].monday, "2027-01-04");
assert.equal(weeks2027.at(-1).week, 52);
assert.equal(weeks2027.at(-1).monday, "2027-12-27");
