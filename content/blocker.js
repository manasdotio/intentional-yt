/**
 * blocker.js — Intentional YT v3
 * Applies CSS classes to <html> based on settings. No dynamic JS blocking.
 * Purely event-driven and zero-overhead.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

const CLASS_MAP = {
  blockHomeFeed:               'iyt-no-home-feed',
  limitHomeFeed:               'iyt-limit-home-feed',
  blockSidebar:                'iyt-no-sidebar',
  blockRecommended:            'iyt-no-recommended',
  blockLiveChat:               'iyt-no-live-chat',
  blockPlaylist:               'iyt-no-playlist',
  blockEndScreenVideowall:     'iyt-no-endscreen-wall',
  blockEndScreenCards:         'iyt-no-endscreen-cards',
  blockComments:               'iyt-no-comments',
  blockProfilePhotos:          'iyt-no-profile-photos',
  blockMixPlaylists:           'iyt-no-mix-playlists',
  blockMerch:                  'iyt-no-merch',
  blockVideoInfo:              'iyt-no-video-info',
  blockVideoButtons:           'iyt-no-video-buttons',
  blockChannelInfo:            'iyt-no-channel-info',
  blockVideoDescription:       'iyt-no-video-desc',
  blockTopHeader:              'iyt-no-top-header',
  blockNotificationBell:       'iyt-no-notif-bell',
  blockIrrelevantSearchResults:'iyt-no-irrelevant-search',
  blockExploreAndTrending:     'iyt-no-explore',
  blockMoreFromYouTube:        'iyt-no-more-yt',
  blockShorts:                 'iyt-no-shorts',
  blockSubscriptionsFeed:      'iyt-no-subscriptions',
  disableAnnotations:          'iyt-no-annotations',
  hideThumbnails:              'iyt-no-thumbnails',
  grayscaleMode:               'iyt-grayscale',
};

const html = document.documentElement;
let _settings = null;
let _snoozeTimer = null;
let _snoozeInterval = null;

function isHomePage() {
  const p = window.location.pathname;
  return p === '/' || p === '';
}

function updateHomePageState() {
  if (isHomePage()) {
    html.setAttribute('data-iyt-is-home', 'true');
  } else {
    html.removeAttribute('data-iyt-is-home');
  }
}

// Initial home page state detection
updateHomePageState();

function isEffectiveActive(settings) {
  if (!settings) return false;
  if (settings.extensionEnabled === false) return false;
  if (settings.snoozeUntil && Date.now() < settings.snoozeUntil) return false;
  return true;
}

function clearSnoozeTimers() {
  if (_snoozeTimer) {
    clearTimeout(_snoozeTimer);
    _snoozeTimer = null;
  }
  if (_snoozeInterval) {
    clearInterval(_snoozeInterval);
    _snoozeInterval = null;
  }
}

function onSnoozeExpired() {
  clearSnoozeTimers();
  if (_settings) {
    _settings.snoozeUntil = null;
    applyAllClasses(_settings);
    checkShortsRedirect(_settings);
    applyAutoplay(_settings);
  }
  StorageManager.updateSetting('snoozeUntil', null).catch(() => {});
  applyAllSettings();
}

function scheduleSnoozeWakeup(settings) {
  clearSnoozeTimers();
  if (!settings?.snoozeUntil) return;

  const now = Date.now();
  if (now >= settings.snoozeUntil) {
    onSnoozeExpired();
    return;
  }

  const ms = Math.max(50, settings.snoozeUntil - now);
  _snoozeTimer = setTimeout(() => {
    onSnoozeExpired();
  }, ms);

  // Fallback interval ensures throttled background tabs or slept devices catch expiration immediately
  _snoozeInterval = setInterval(() => {
    if (!_settings?.snoozeUntil || Date.now() >= _settings.snoozeUntil) {
      onSnoozeExpired();
    }
  }, 1000);
}

function checkSnoozeExpiry() {
  if (_settings?.snoozeUntil && Date.now() >= _settings.snoozeUntil) {
    onSnoozeExpired();
  }
}

function checkShortsRedirect(settings) {
  if (!isEffectiveActive(settings) || !settings.redirectShorts) return;
  const path = window.location.pathname;
  if (path === '/shorts' || path === '/shorts/') {
    window.location.replace('/');
    return;
  }
  const match = path.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const videoId = match[1];
    const searchParams = new URLSearchParams(window.location.search);
    const qs = searchParams.toString() ? '&' + searchParams.toString() : '';
    window.location.replace('/watch?v=' + encodeURIComponent(videoId) + qs);
  }
}

// Intercept in-page SPA navigation to shorts
document.addEventListener('yt-navigate-start', (e) => {
  updateHomePageState();
  checkSnoozeExpiry();
  if (!isEffectiveActive(_settings) || !_settings.redirectShorts) return;
  const url = e && e.detail && e.detail.url;
  if (typeof url === 'string') {
    if (url === '/shorts' || url === '/shorts/' || url.startsWith('/shorts?')) {
      window.location.replace('/');
      return;
    }
    const match = url.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      window.location.replace('/watch?v=' + encodeURIComponent(match[1]));
    }
  }
});

function purgeShortsFromDOM() {
  if (!isEffectiveActive(_settings) || !_settings.blockShorts) return;

  // 1. All anchors pointing to shorts
  const shortsAnchors = document.querySelectorAll('a[href*="/shorts/"], a[href^="/shorts/"]');
  for (const a of shortsAnchors) {
    const container = a.closest(
      'grid-shelf-view-model, ytd-reel-shelf-renderer, yt-reel-shelf-view-model, ' +
      'reel-shelf-view-model, ytm-reel-shelf-renderer, ytd-rich-section-renderer, ' +
      'ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model, ytd-shorts-lockup-view-model, ' +
      'yt-shorts-lockup-view-model, ytd-reel-item-renderer, reel-item-view-model, ' +
      'yt-reel-item-view-model, ytd-video-renderer, yt-lockup-view-model, ' +
      'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ' +
      'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, yt-guide-entry-view-model'
    );
    if (container && container.tagName.toLowerCase() !== 'ytd-item-section-renderer' && container.getAttribute('data-iyt-shorts-hidden') !== 'true') {
      container.setAttribute('data-iyt-shorts-hidden', 'true');
      container.style.setProperty('display', 'none', 'important');
    }
  }

  // 2. All shorts shelves & lockups by tag or attribute
  const shortsElements = document.querySelectorAll(
    'grid-shelf-view-model, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model, ' +
    'ytd-shorts-lockup-view-model, ytd-shorts-lockup-view-model-renderer, yt-shorts-lockup-view-model, ' +
    'ytd-reel-shelf-renderer, yt-reel-shelf-view-model, reel-shelf-view-model, ytm-reel-shelf-renderer, ' +
    'ytd-reel-item-renderer, reel-item-view-model, yt-reel-item-view-model, ' +
    'ytd-rich-shelf-renderer[is-shorts], [overlay-style="SHORTS"]'
  );
  for (const el of shortsElements) {
    const target = el.closest(
      'grid-shelf-view-model, ytd-rich-section-renderer, ytd-reel-shelf-renderer, ' +
      'ytd-video-renderer, ytd-rich-item-renderer, yt-lockup-view-model'
    ) || el;
    if (target && target.tagName.toLowerCase() !== 'ytd-item-section-renderer' && target.getAttribute('data-iyt-shorts-hidden') !== 'true') {
      target.setAttribute('data-iyt-shorts-hidden', 'true');
      target.style.setProperty('display', 'none', 'important');
    }
  }
}

function unpurgeShortsFromDOM() {
  document.querySelectorAll('[data-iyt-shorts-hidden="true"]').forEach(el => {
    el.removeAttribute('data-iyt-shorts-hidden');
    el.style.removeProperty('display');
  });
}

let _domPurgeScheduled = false;
function scheduleShortsPurge() {
  if (_domPurgeScheduled || !isEffectiveActive(_settings) || !_settings.blockShorts) return;
  _domPurgeScheduled = true;
  requestAnimationFrame(() => {
    _domPurgeScheduled = false;
    purgeShortsFromDOM();
  });
}

let _nudgeTimer = null;
function triggerScrollerNudge() {
  if (_nudgeTimer) return;
  _nudgeTimer = setTimeout(() => {
    _nudgeTimer = null;
    try {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      const scroller = document.querySelector('ytd-app') || document.querySelector('ytd-rich-grid-renderer');
      if (scroller) {
        scroller.dispatchEvent(new CustomEvent('iron-resize', { bubbles: true, composed: true }));
      }
      if (window.scrollY === 0 && document.documentElement.scrollHeight > window.innerHeight) {
        window.scrollBy(0, 1);
        setTimeout(() => window.scrollBy(0, -1), 50);
      }
    } catch (e) {}
  }, 80);
}

function limitHomeFeedEnforce() {
  if (!isEffectiveActive(_settings) || !_settings.limitHomeFeed || !isHomePage()) return;

  const grid = document.querySelector('ytd-rich-grid-renderer #contents');
  if (!grid) return;

  let items = grid.querySelectorAll(':scope > ytd-rich-item-renderer');
  if (!items || items.length === 0) {
    items = grid.querySelectorAll('ytd-rich-grid-row ytd-rich-item-renderer');
  }

  // Determine items per row (default 3 or from attribute)
  let perRow = 3;
  if (items && items.length > 0) {
    const firstAttr = items[0].getAttribute('items-per-row');
    if (firstAttr) {
      const parsed = parseInt(firstAttr, 10);
      if (!isNaN(parsed) && parsed > 0) perRow = parsed;
    }
  }

  // Calculate target limit: at least 15 items, multiple of perRow
  // 3 per row -> 15 items (5 rows)
  // 5 per row -> 15 items (3 rows)
  // 4 per row -> 16 items (4 rows)
  // 6 per row -> 15-18 items
  // 2 per row -> 15-16 items
  let targetLimit = 15;
  if (perRow === 4) {
    targetLimit = 16;
  } else if (perRow > 0) {
    targetLimit = Math.ceil(15 / perRow) * perRow;
  }

  const count = items ? items.length : 0;

  // If we haven't reached the target limit yet, let YouTube load more
  if (count < targetLimit) {
    grid.removeAttribute('data-iyt-limit-reached');
    grid.querySelectorAll('ytd-continuation-item-renderer, #continuation').forEach(c => {
      c.style.removeProperty('display');
    });
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].hasAttribute('data-iyt-feed-hidden')) {
          items[i].removeAttribute('data-iyt-feed-hidden');
        }
      }
    }
    triggerScrollerNudge();
    return;
  }

  grid.setAttribute('data-iyt-limit-reached', 'true');
  for (let i = 0; i < items.length; i++) {
    if (i < targetLimit) {
      if (items[i].hasAttribute('data-iyt-feed-hidden')) {
        items[i].removeAttribute('data-iyt-feed-hidden');
      }
    } else {
      if (!items[i].hasAttribute('data-iyt-feed-hidden')) {
        items[i].setAttribute('data-iyt-feed-hidden', 'true');
      }
    }
  }

  // Ensure continuations and spinners remain hidden once limit is reached
  grid.querySelectorAll('ytd-continuation-item-renderer, #continuation').forEach(c => {
    c.style.setProperty('display', 'none', 'important');
  });
}

function unlimitHomeFeed() {
  const grid = document.querySelector('ytd-rich-grid-renderer #contents');
  if (grid) {
    grid.removeAttribute('data-iyt-limit-reached');
  }
  document.querySelectorAll('[data-iyt-feed-hidden]').forEach(el => {
    el.removeAttribute('data-iyt-feed-hidden');
  });
  document.querySelectorAll('ytd-continuation-item-renderer, #continuation').forEach(c => {
    c.style.removeProperty('display');
  });
}

let _feedLimitScheduled = false;
function scheduleHomeFeedLimit() {
  if (_feedLimitScheduled || !isEffectiveActive(_settings) || !_settings.limitHomeFeed) return;
  _feedLimitScheduled = true;
  requestAnimationFrame(() => {
    _feedLimitScheduled = false;
    limitHomeFeedEnforce();
  });
}

let _isApplyingClasses = false;

function applyAllClasses(settings) {
  _isApplyingClasses = true;
  try {
    const active = isEffectiveActive(settings);
    updateHomePageState();
    for (const [key, cls] of Object.entries(CLASS_MAP)) {
      if (key === 'blockHomeFeed' && settings.limitHomeFeed) {
        html.classList.remove(cls);
        continue;
      }
      if (active && settings[key]) {
        html.classList.add(cls);
      } else {
        html.classList.remove(cls);
      }
    }
    // Conflict resolution: limitHomeFeed vs blockHomeFeed
    // If limitHomeFeed is active, prioritize limiting over completely hiding the feed
    if (active && settings.limitHomeFeed) {
      html.classList.remove('iyt-no-home-feed');
      html.classList.add('iyt-limit-home-feed');
      unlimitHomeFeed();
      scheduleHomeFeedLimit();
      triggerScrollerNudge();
    } else {
      unlimitHomeFeed();
    }
    if (active && settings.blockShorts) {
      purgeShortsFromDOM();
    } else {
      unpurgeShortsFromDOM();
    }
    // Ensure search results container is never hidden
    document.querySelectorAll('ytd-item-section-renderer[data-iyt-shorts-hidden]').forEach(el => {
      el.removeAttribute('data-iyt-shorts-hidden');
      el.style.removeProperty('display');
    });
    // Ensure any leftover intentional home element is removed
    const existing = document.getElementById('iyt-intentional-home');
    if (existing) existing.remove();
  } finally {
    _isApplyingClasses = false;
  }
}

// Ensure YouTube's internal SPA router doesn't strip our classes from <html>
const _classObserver = new MutationObserver(() => {
  if (_isApplyingClasses || !_settings || !isEffectiveActive(_settings)) return;
  for (const [key, cls] of Object.entries(CLASS_MAP)) {
    if (key === 'blockHomeFeed' && _settings.limitHomeFeed) continue;
    if (_settings[key] && !html.classList.contains(cls)) {
      applyAllClasses(_settings);
      break;
    }
  }
});
_classObserver.observe(html, { attributes: true, attributeFilter: ['class'] });

function applyAutoplay(settings) {
  if (!isEffectiveActive(settings) || !settings.disableAutoplay) return;
  document.querySelectorAll('video[autoplay]').forEach(v => v.removeAttribute('autoplay'));
  const btn = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (btn) btn.click();
}

async function applyAllSettings() {
  _settings = await StorageManager.getSettings();
  scheduleSnoozeWakeup(_settings);
  checkShortsRedirect(_settings);
  applyAllClasses(_settings);
  applyAutoplay(_settings);
}

// React instantly when user toggles settings via storage event
browser.storage.onChanged.addListener((changes) => {
  if (!changes.settings?.newValue) return;
  _settings = changes.settings.newValue;
  scheduleSnoozeWakeup(_settings);
  checkShortsRedirect(_settings);
  applyAllClasses(_settings);
  applyAutoplay(_settings);
});

// Also react immediately to direct runtime messages from popup
if (browser && browser.runtime && browser.runtime.onMessage) {
  browser.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'IYT_APPLY_SETTINGS' && msg.settings) {
      _settings = msg.settings;
      scheduleSnoozeWakeup(_settings);
      checkShortsRedirect(_settings);
      applyAllClasses(_settings);
      applyAutoplay(_settings);
    }
  });
}

// Initial injection at document_start
applyAllSettings();

function initDomObserver() {
  const target = document.body || document.documentElement;
  if (!target) {
    document.addEventListener('DOMContentLoaded', initDomObserver, { once: true });
    return;
  }
  const observer = new MutationObserver((mutations) => {
    if (!isEffectiveActive(_settings)) return;
    for (let i = 0; i < mutations.length; i++) {
      if (mutations[i].addedNodes.length > 0) {
        if (_settings.blockShorts) scheduleShortsPurge();
        if (_settings.limitHomeFeed) scheduleHomeFeedLimit();
        break;
      }
    }
  });
  observer.observe(target, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDomObserver, { once: true });
} else {
  initDomObserver();
}

document.addEventListener('yt-navigate-finish', () => {
  updateHomePageState();
  checkSnoozeExpiry();
  scheduleShortsPurge();
  scheduleHomeFeedLimit();
});
document.addEventListener('yt-page-data-updated', () => {
  updateHomePageState();
  checkSnoozeExpiry();
  scheduleShortsPurge();
  scheduleHomeFeedLimit();
});
window.addEventListener('popstate', () => {
  updateHomePageState();
  scheduleHomeFeedLimit();
});
window.addEventListener('resize', () => {
  scheduleHomeFeedLimit();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkSnoozeExpiry();
  }
});
window.addEventListener('focus', () => {
  checkSnoozeExpiry();
});

window.__iytBlocker = {
  applyAllSettings,
  applyAutoplay,
  purgeShortsFromDOM,
  limitHomeFeedEnforce,
  checkShortsRedirect: () => checkShortsRedirect(_settings)
};
