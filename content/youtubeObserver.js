/**
 * youtubeObserver.js — Intentional YT v3
 */

'use strict';

(function () {
  let _lastPath = '';
  let _routeTimer = null;

  function isVideoPage() {
    const p = location.pathname;
    return p === '/watch' || p.startsWith('/shorts') || p.startsWith('/live') || p.startsWith('/embed');
  }

  function waitFor(getter, cb, tries, ms) {
    if (getter()) { cb(getter()); return; }
    if (tries <= 0) return;
    setTimeout(() => waitFor(getter, cb, tries - 1, ms), ms);
  }

  async function handleRouteChange(force = false) {
    const path = location.pathname + location.search;
    if (path === _lastPath && !force) return;
    _lastPath = path;

    if (window.__iytBlocker) {
      await window.__iytBlocker.applyAllSettings();
    } else {
      waitFor(() => window.__iytBlocker, b => b.applyAllSettings(), 20, 100);
    }

    if (isVideoPage()) {
      if (window.__iytTimer) {
        window.__iytTimer.attach();
      } else {
        waitFor(() => window.__iytTimer, t => t.attach(), 30, 100);
      }
    } else {
      if (window.__iytTimer) {
        window.__iytTimer.detach();
      }
    }
  }

  function schedule(force = false) {
    clearTimeout(_routeTimer);
    _routeTimer = setTimeout(() => handleRouteChange(force), 100);
  }

  document.addEventListener('yt-navigate-finish', () => schedule(true));
  document.addEventListener('yt-page-data-updated', () => schedule(true));
  document.addEventListener('yt-player-updated', () => schedule(true));
  window.addEventListener('popstate', () => schedule(true));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => handleRouteChange(true), { once: true });
  } else {
    handleRouteChange(true);
  }
})();
