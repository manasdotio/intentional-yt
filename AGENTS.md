# Intentional YT — AI Agent Guidelines & Context Map

> Universal instruction file for AI agents (Antigravity, Cursor, Claude Code, Copilot, Windsurf).
> Keep this file under 120 lines (<800 tokens) to minimize prompt overhead.

---

## 1. Project Overview
This repository houses two distinct, decoupled products:
1. **Browser Extension**: Manifest V3 extension for Chrome & Firefox. Built with native Vanilla JS/CSS. Zero build step, zero dependencies.
2. **Landing Page Web App & Blog**: Interactive marketing site, simulator, and static markdown blog built with Next.js (App Router, SSG) and custom CSS variables.

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
├── app/                     # Next.js App Router (layout.jsx, page.jsx, blog/, privacy/, uninstall/)
├── src/                     # React components, theme, styles (index.css), posts/, utils/
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

### B. Landing Page & Blog (`app/`, `src/`)
- **Pure CSS Variable Design**: Uses CSS variables in `src/index.css`. Preserve `--bg`, `--surface`, `--accent-*` tokens and dark/light mode parity.
- **Always Test Build**: Always run `npm run build` after editing files in `app/` or `src/` to confirm zero Next.js build errors.
- **Mobile Responsiveness**: Test down to 320px viewport. Ensure `html, body { overflow-x: hidden; }` and prevent horizontal blowout.

### C. Version Synchronization Checklist
When updating versions, synchronize across all:
- `manifest.json` (`version`)
- `package.json` (`version`)
- `src/config/constants.js` (`version`, `versionShort`)
- `ui/popup.html` (`vX.X.X` in header & footer)
- `README.md` & `AI_CONTEXT.md`

---

## 4. Key Developer Commands
```bash
npm run build      # Build Next.js static site & pre-render SSG pages
npm run dev        # Run local Next.js development server
npm run package    # Cross-platform package extension (Chrome, Edge, Firefox)
./package.sh       # Package extension into intentional-yt.zip (bash)
```

---

## 5. Extended Reference (Read only when needed)
- **Marketing & Social Copy**: `AI_CONTEXT.md`
- **In-Depth Technical Specs & DOM Selectors**: `ARCHITECTURE_AND_FEATURES.md`
- **Firefox AMO Submission Guide**: `AMO_CHECKLIST.md`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
