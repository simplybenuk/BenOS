# BenOS

**BenOS** is a local-first collection of tiny personal micro-apps.

Think: instruments, not products. Closer to Post-its than platforms.

No accounts. No sync. No cloud.

---

## Current apps

- **Journey Board** — arrange journey screenshots, add text and connectors, save reusable journeys, and export high-resolution PNGs for review
- **Scratchpad** — timestamped local notes with search
- **Screenshot Drop** — paste or drag screenshots into a simple local visual feed

Retired experiments are left in `apps/` for reference, but are not shown in the launcher:

- `okr-tracker`
- `voice-transform`

---

## Rules

### Architecture

- Each active micro-app has its own folder under `apps/`
- Each app is a single `index.html`
- Apps work standalone by opening their HTML file directly
- The launcher only links to active apps

### Tech

- Browser only
- Vanilla JavaScript
- Inline CSS
- No frameworks
- No build step for active apps

### Data

- Data stays on the local device
- Simple text data uses `localStorage`
- Screenshot-heavy tools may use `IndexedDB`
- No auth or sync
- Data remains until cleared by the user or browser

### Philosophy

- One small recurring problem per app
- No settings screens unless unavoidable
- No abstractions “for later”
- If it becomes precious, it is probably becoming the wrong thing

---

## Structure

```text
BenOS/
├── README.md
├── index.html
└── apps/
    ├── journey-board/
    │   └── index.html
    ├── temp-notes/
    │   └── index.html
    ├── screenshot-drop/
    │   └── index.html
    ├── okr-tracker/           # retired experiment
    │   └── index.html
    └── voice-transform/       # retired experiment
        └── index.html
```

---

## Journey Board

Use it for reviewing journeys and workflows where the detail inside screenshots matters.

- Paste or upload screenshots
- Drag cards into a flow
- Hold right click anywhere on the board and drag to pan around
- Add text notes
- Shift-click two items, then connect them with an optional label
- Resize screenshots with `−` / `+`
- Name, switch, duplicate and delete locally saved journeys
- Zoom in/out or fit the journey to the canvas for overview and detail work
- Export the laid-out journey as a cropped, high-resolution PNG unaffected by canvas zoom
- Journeys autosave locally in IndexedDB

---

## How to use

1. Clone the repo.
2. Open `index.html` in a browser.
3. Open an app.
4. Delete it when it stops earning its place.

---

## Archived Engine experiment

`engine/`, `shared/benos-api.js`, and `apps/voice-transform/` remain in the repository as an unused experiment. They are not part of the current launcher or active BenOS app set.

---

## Guiding principle

> If it survives more than a few weeks, it must earn its keep.

BenOS is allowed to be ugly. It is not allowed to be heavy.
