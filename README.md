# BenOS

**BenOS** is a local-first collection of tiny, disposable micro-apps that run entirely in the browser.

Think: personal instruments, not products.  
Closer to Post-its than platforms.

No accounts. No sync. No cloud. No guilt.

---

## What BenOS is
- A **local HTML launcher** + a set of **micro-apps**
- Each app solves **one small, recurring problem**
- Everything runs in your browser, from local files
- If it breaks, you delete it and move on

---

## Core rules (non-negotiable)

### Architecture
- Each micro-app = **its own folder**
- Each micro-app has **one `index.html`**
- Apps must work **standalone** (open the file directly)
- Optional launcher just links to them

### Tech
- Browser only
- **Vanilla JS**
- **Inline CSS**
- **No frameworks**
- **No build step**

### Data
- Data is **local and temporary**
- Stored per-app in `localStorage`
- No auth
- No sync
- Later: optional JSON export/import *only if it hurts*

### Philosophy
- One file per app
- No settings pages
- No abstraction “for later”
- Build in < 90 minutes
- If it becomes precious, it’s wrong

---

## Repo structure
```
benos/
├── README.md
├── index.html              # optional launcher / dashboard
├── apps/
│   ├── temp-notes/
│   │   └── index.html
│   ├── screenshot-drop/
│   │   └── index.html
│   └── focus-board/
│       └── index.html
└── shared/
    ├── benos.css           # tiny shared styles (optional)
    └── benos.js            # tiny shared utils (optional)
```
Notes:
- Apps **must not depend** on the launcher
- Shared files are conveniences, not a framework

---

## App contract (guidelines)

Every app should:
- Load instantly
- Save automatically
- Be usable with keyboard only
- Explain itself in < 10 seconds
- Avoid permanence by default

Red flags:
- User accounts
- Long-term storage by default
- Configuration screens
- Feature creep

---

## Example apps
- Temp Notes (scratchpad, auto-expiring)
- Screenshot Drop (paste images, export walkthroughs)
- Focus Board (weekly objective + top 3)
- Decision Log (decision + assumptions + revisit date)

---

## How to use
1. Clone the repo
2. Open `index.html` (or any app’s `index.html`) in a browser
3. Build a new app by copying an existing folder
4. Ship it or delete it — both are wins

---


## Local Engine (OpenAI proxy)

Keep browser apps static and local-first, but route OpenAI calls through a local Engine so keys stay server-side.

1. Set your API key in your shell:
   - `export OPENAI_API_KEY=your_key_here`
2. Install dependencies:
   - `npm install`
   - `npm --prefix engine install`
3. Start the Engine:
   - `npm run engine` (http://localhost:8787)
4. Start static app serving in another terminal:
   - `npm run serve` (default http://localhost:8080)
5. Open BenOS and launch **Voice Transform**:
   - `http://localhost:8080/apps/voice-transform/index.html`

Security note: never paste your OpenAI API key into browser code or app inputs.

Optional: set `OPENAI_TTS_MODEL` to override the Engine TTS model (defaults to `tts-1`).

---

## Guiding principle

> If it survives more than a few weeks, it must earn its keep.

BenOS is allowed to be ugly.  
It is not allowed to be heavy.
