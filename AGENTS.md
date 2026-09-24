# Intentional YT — AI Agent Guidelines & Context Map

> Universal instruction file for AI agents (Antigravity, Cursor, Claude Code, Copilot, Windsurf).
> Keep this file under 120 lines (<800 tokens) to minimize prompt overhead.

---

## 1. Project Overview
This repository houses two distinct, decoupled products:
1. **Browser Extension**: Manifest V3 extension for Chrome & Firefox. Built with native Vanilla JS/CSS. Zero build step, zero dependencies.
2. **Landing Page Web App**: Interactive marketing site and simulator built with React 19, Vite, and custom CSS variables.

---

## 2. Directory & Subsystem Map
```
intentional-yt/
├── manifest.json            # MV3 manifest for Chrome & Firefox
├── content/                 # YouTube content scripts (blocker.js)
├── background/              # MV3 background worker & alarms (service-worker.js)
├── styles/                  # Extension CSS (blocker.css, popup.css)
├── ui/                      # Extension popup UI (popup.html)
├── utils/                   # Shared extension utilities (storage.js, etc.)
├── src/                     # React 19 web app (App.jsx, index.css, components/)
├── index.html               # Web app root HTML
├── package.sh               # Packaging script producing intentional-yt.zip
└── AI_CONTEXT.md            # Detailed feature & marketing reference (read on-demand)
```

---

## 3. Critical Invariants & Rules

### A. Browser Extension (`content/`, `styles/`, `ui/`, `background/`)
- **Zero npm Dependencies**: Never import external libraries or node packages into extension scripts. Must run natively in browser runtimes.
- **Zero-Flash Blocking**: All visual blockers in `styles/blocker.css` MUST be high-specificity CSS injected at `document_start`. Never hide core feeds via delayed JS DOM mutations that cause content to flicker.
- **Cross-Browser Compatibility**: Support both Chrome MV3 and Firefox AMO. Do not use Chrome-only or Firefox-only proprietary APIs in `manifest.json`.
- **Dual Background Invariant & Packaging**: In source `manifest.json`, keep BOTH `"service_worker"` and `"scripts"`. `./package.sh` automatically compiles two compliant distributions: `intentional-yt.zip` (for Chrome Web Store & Microsoft Edge Add-ons with `service_worker` only) and `intentional-yt-firefox.zip` (for Firefox AMO with `scripts` fallback).
- **100% Local Privacy**: 0% telemetry, no analytics, no external tracking network calls. Everything stays in `chrome.storage.local` / `browser.storage.local`.

### B. Landing Page Website (`src/`, `index.html`)
- **Pure CSS Variable Design**: Uses CSS variables in `src/index.css`. Preserve `--bg`, `--surface`, `--accent-*` tokens and dark/light mode parity.
- **Always Test Build**: Always run `npm run build` after editing files in `src/` to confirm zero Vite build errors.
- **Mobile Responsiveness**: Test down to 320px viewport. Ensure `html, body { overflow-x: hidden; }` and prevent horizontal blowout.

### C. Version Synchronization Checklist
When updating versions, synchronize across all:
- `manifest.json` (`version`)
- `package.json` (`version`)
- `src/config/constants.js` (`version`, `versionShort`)
- `ui/popup.html` (`vX.X.X` in header & footer)
- `index.html` (meta title & description)
- `README.md` & `AI_CONTEXT.md`

---

## 4. Key Developer Commands
```bash
npm run build      # Build React web app into dist/
npm run dev        # Run local Vite development server
./package.sh       # Package extension into intentional-yt.zip
```

---

## 5. Extended Reference (Read only when needed)
- **Marketing & Social Copy**: `AI_CONTEXT.md`
- **In-Depth Technical Specs & DOM Selectors**: `ARCHITECTURE_AND_FEATURES.md`
- **Firefox AMO Submission Guide**: `AMO_CHECKLIST.md`
