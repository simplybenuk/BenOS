import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../apps/backup/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];

assert.ok(script, "Backup should include inline JavaScript");
assert.match(html, /Merge/, "restore should offer a merge mode");
assert.match(html, /Replace/, "restore should offer a replace mode");
assert.match(html, /Close other BenOS tabs before restoring/, "restoring should warn about open apps overwriting data");

const stubElement = {
  addEventListener() {},
  appendChild() {},
  append() {},
  setAttribute() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  classList: { add() {}, remove() {} },
  click() {},
  textContent: "",
  innerHTML: "",
  className: "",
  value: "",
  hidden: false,
  disabled: false,
};

const store = new Map();
const sandbox = {
  document: {
    getElementById: () => Object.create(stubElement),
    createElement: () => Object.create(stubElement),
    querySelector: () => Object.create(stubElement),
  },
  localStorage: {
    get length() { return store.size; },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  indexedDB: { databases: async () => [] },
  location: { origin: "null", href: "file:///benos/apps/backup/index.html" },
  Blob,
  File,
  btoa,
  atob,
  URL,
  Date,
  Math,
  Set,
  JSON,
  console,
  confirm: () => false,
  setTimeout,
  clearTimeout,
};

vm.createContext(sandbox);
vm.runInContext(script, sandbox);

for (const name of ["encodeValue", "decodeValue", "summarise", "countItems", "parseBackup", "isBenosKey"]) {
  assert.equal(typeof sandbox[name], "function", `${name} should be available for testing`);
}

// Only BenOS-owned storage is picked up.
assert.ok(sandbox.isBenosKey("benos:todo-list:v1"));
assert.ok(sandbox.isBenosKey("benos_journey_board"));
assert.ok(!sandbox.isBenosKey("some-other-app"));

store.set("benos:todo-list:v1", JSON.stringify({ tasks: [1, 2], completed: [3] }));
store.set("unrelated", "keep me");
const localSnapshot = sandbox.readLocalStorage();
assert.deepEqual(Object.keys(localSnapshot), ["benos:todo-list:v1"], "only benos keys should be exported");

// Blobs survive a round trip through JSON.
const original = { caption: "shot", blob: new Blob([new Uint8Array([1, 2, 3, 250])], { type: "image/png" }), when: new Date("2026-01-02T03:04:05.000Z") };
const encoded = await sandbox.encodeValue(original);
const rehydrated = sandbox.decodeValue(JSON.parse(JSON.stringify(encoded)));
assert.equal(rehydrated.caption, "shot");
assert.ok(rehydrated.blob instanceof Blob, "blobs should decode back to blobs");
assert.equal(rehydrated.blob.type, "image/png");
assert.deepEqual([...new Uint8Array(await rehydrated.blob.arrayBuffer())], [1, 2, 3, 250], "blob bytes should be unchanged");
assert.equal(rehydrated.when.toISOString(), "2026-01-02T03:04:05.000Z", "dates should decode back to dates");

// Summaries describe both storage kinds.
const rows = sandbox.summarise({
  localStorage: { "benos:todo-list:v1": JSON.stringify({ tasks: [1, 2], completed: [3] }) },
  databases: { benos_screenshot_drop: { version: 1, stores: { shots: { keyPath: "id", records: [{ value: {} }, { value: {} }] } } } },
});
assert.equal(rows.length, 2);
assert.deepEqual([...rows].map((r) => r.label), ["Screenshot Drop", "To-do List"], "rows should be labelled by app and sorted");
assert.match(rows[0].detail, /2 records/);
assert.match(rows[1].detail, /3 items/);

assert.equal(sandbox.countItems("not json"), null, "unparseable values should not claim an item count");

// Only real backups are accepted.
assert.throws(() => sandbox.parseBackup("{"), /not valid JSON/);
assert.throws(() => sandbox.parseBackup(JSON.stringify({ hello: "world" })), /not a BenOS backup/);
assert.throws(() => sandbox.parseBackup(JSON.stringify({ format: "benos-backup", version: 99 })), /newer version/);

const parsed = sandbox.parseBackup(JSON.stringify({ format: "benos-backup", version: 1, exportedAt: "2026-08-08T00:00:00.000Z" }));
assert.deepEqual(Object.keys(parsed.localStorage), [], "a backup without localStorage should still parse");
assert.deepEqual(Object.keys(parsed.databases), [], "a backup without databases should still parse");
