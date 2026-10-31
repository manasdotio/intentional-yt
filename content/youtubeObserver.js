/**
 * youtubeObserver.js — Intentional YT v3
 */

'use strict';

(function () {
  let _lastPath = '';
  let _routeTimer = null;
  let _generation = 0;
  let _stopped = false;

  function reportError(error) {
    if (/Extension context invalidated/i.test(error?.message || '')) {
      _stopped = true;
      ++_generation;
      clearTimeout(_routeTimer);
      window.__iytTimer?.detach();
      return;
    }
    console.warn('[IYT] Navigation update failed', error);
  }

  function runRouteChange(force) {
    if (!_stopped) handleRouteChange(force).catch(reportError);
  }

  function hasActiveMiniplayer() {
    return Boolean(document.querySelector?.('ytd-miniplayer[active] video, ytm-miniplayer[active] video, ytm-miniplayer video'));
  }

  function isVideoPage() {
    const p = location.pathname;
    return p === '/watch' || p.startsWith('/shorts') || p.startsWith('/live') || p.startsWith('/embed') || hasActiveMiniplayer();
  }

  const HOME_REDIRECTS = {
    subscriptions: '/feed/subscriptions',
    watchLater: '/playlist?list=WL',
    history: '/feed/history'
  };

  async function checkHomeRedirect() {
    const p = location.pathname;
    if (p !== '/' && p !== '') return false;
    try {
      const settings = window.__iytBlocker?.getSettings
        ? window.__iytBlocker.getSettings()
        : (typeof StorageManager !== 'undefined' ? await StorageManager.getSettings() : null);
      if (!settings || !settings.blockHomeFeed) return false;
      if (typeof IYT_Policy !== 'undefined' && !IYT_Policy.active(settings)) return false;
      const target = HOME_REDIRECTS[settings.homeRedirect];
      if (target && (location.pathname + location.search) !== target) {
        location.replace(target);
        return true;
      }
    } catch {}
    return false;
  }

  function waitFor(getter, cb, tries, ms) {
    if (_stopped) return;
    const value = getter();
    if (value) { Promise.resolve().then(() => cb(value)).catch(reportError); return; }
    if (tries <= 0) return;
    setTimeout(() => waitFor(getter, cb, tries - 1, ms), ms);
  }

  async function handleRouteChange(force = false) {
    const path = location.pathname + location.search;
    if (path === _lastPath && !force) return;
    _lastPath = path;
    const generation = ++_generation;
    if (await checkHomeRedirect()) return;
    if (!isVideoPage()) window.__iytTimer?.detach();

    if (window.__iytBlocker) {
      await window.__iytBlocker.applyAllSettings();
    } else {
      waitFor(() => window.__iytBlocker, b => b.applyAllSettings(), 20, 100);
    }

    if (generation !== _generation || path !== location.pathname + location.search) return;
    if (isVideoPage()) {
      if (window.__iytTimer) {
        await window.__iytTimer.attach();
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
    if (_stopped) return;
    clearTimeout(_routeTimer);
    _routeTimer = setTimeout(() => runRouteChange(force), 100);
  }

  document.addEventListener('yt-navigate-start', (e) => {
    const url = e && e.detail && e.detail.url;
    if (typeof url === 'string' && (url === '/' || url === '' || url.startsWith('/?'))) {
      checkHomeRedirect();
    }
  });
  document.addEventListener('yt-navigate-finish', () => schedule(true));
  document.addEventListener('yt-page-data-updated', () => schedule(true));
  document.addEventListener('yt-player-updated', () => schedule(true));
  document.addEventListener('yt-miniplayer-state-changed', () => schedule(true));
  window.addEventListener('popstate', () => schedule(true));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => runRouteChange(true), { once: true });
  } else {
    runRouteChange(true);
  }
})();
