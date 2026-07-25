import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../apps/todo-list/index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*)<\/script>/)?.[1];

assert.ok(script, "To-do List should include inline JavaScript");
assert.match(html, /const TOP_COUNT = 3;/, "the default view should be limited to three tasks");
assert.match(html, /touch-action:none/, "the drag handle should support deliberate touch dragging");
assert.match(html, /pointerdown/, "reordering should use pointer events for mouse and touch");
assert.match(html, /aria-expanded/, "the expandable task section should expose its state");
assert.match(html, /last 4 weeks/, "completed task history should explain its retention window");

const stubElement = {
  addEventListener() {},
  setAttribute() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  classList: { add() {}, remove() {} },
  focus() {},
  textContent: "",
  innerHTML: "",
  value: "",
  hidden: false,
};

const sandbox = {
  document: {
    getElementById: () => Object.create(stubElement),
    elementFromPoint: () => null,
  },
  localStorage: {
    getItem: () => null,
    setItem() {},
  },
  CSS: { escape: (value) => value },
  Date,
  Math,
  Set,
  clearTimeout() {},
  setTimeout() {},
};

vm.createContext(sandbox);
vm.runInContext(script, sandbox);

assert.equal(typeof sandbox.moveTask, "function", "moveTask should be available for testing");
assert.equal(typeof sandbox.pruneCompleted, "function", "pruneCompleted should be available for testing");
assert.equal(typeof sandbox.groupCompletedTasks, "function", "groupCompletedTasks should be available for testing");

const tasks = [
  { id:"a", text:"First" },
  { id:"b", text:"Second" },
  { id:"c", text:"Third" },
  { id:"d", text:"Fourth" },
];
assert.deepEqual(
  sandbox.moveTask(tasks, "d", 0).map((task) => task.id),
  ["d", "a", "b", "c"],
  "a task should move to the top"
);
assert.deepEqual(
  sandbox.moveTask(tasks, "a", 3).map((task) => task.id),
  ["b", "c", "d", "a"],
  "a task should move to the bottom"
);
assert.deepEqual(
  sandbox.moveTask(tasks, "missing", 1).map((task) => task.id),
  ["a", "b", "c", "d"],
  "an unknown task should leave the list alone"
);

const now = new Date("2026-07-22T12:00:00Z");
const completed = [
  { id:"current", text:"Current week", completedAt:"2026-07-21T09:00:00Z" },
  { id:"last", text:"Last week", completedAt:"2026-07-14T09:00:00Z" },
  { id:"oldest-kept", text:"Oldest retained week", completedAt:"2026-06-29T00:00:00Z" },
  { id:"expired", text:"Older than four weeks", completedAt:"2026-06-28T23:59:59Z" },
];

assert.deepEqual(
  sandbox.pruneCompleted(completed, now).map((task) => task.id),
  ["current", "last", "oldest-kept"],
  "completed tasks should retain the current week and previous three weeks"
);

const groups = sandbox.groupCompletedTasks(completed, now);
assert.deepEqual(
  JSON.parse(JSON.stringify(groups.map((group) => [group.key, group.tasks.map((task) => task.id)]))),
  [
    ["2026-07-20", ["current"]],
    ["2026-07-13", ["last"]],
    ["2026-06-29", ["oldest-kept"]],
  ],
  "completed tasks should be grouped by their Monday week"
);
