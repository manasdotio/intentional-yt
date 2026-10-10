/**
 * blocker.js — Intentional YT v3
 * Applies CSS classes to <html> based on settings. No dynamic JS blocking.
 * Event-driven blocking with batched DOM maintenance.
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

function isEffectiveActive(settings) { return IYT_Policy.active(settings); }

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
  applyAllSettings().catch(error => {
    if (!/Extension context invalidated/i.test(error?.message || '')) console.warn('[IYT] Snooze update failed', error);
  });
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
  setTimeout(() => {
    _domPurgeScheduled = false;
    purgeShortsFromDOM();
  }, 150);
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

  // Keep the count identical to document-start CSS in every grid layout.
  const targetLimit = 15;

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

/* ═══════════════════════════════════════════════════════════
   CHANNEL & KEYWORD BLOCKLISTS
   Strict text-matching only: zero category/topic inference
═══════════════════════════════════════════════════════════ */

const CARD_CONTAINER_SELECTORS = [
  'ytd-rich-item-renderer',       // Home feed & modern channel videos
  'ytd-video-renderer',           // Search results video card
  'ytd-compact-video-renderer',   // Watch next / related videos sidebar
  'ytd-grid-video-renderer',      // Legacy grid video card
  'ytd-channel-renderer',         // Search results channel card
  'ytd-playlist-renderer',        // Search results playlist card
  'ytd-radio-renderer',           // Search results mix/radio
  'ytm-video-with-context-renderer',
  'ytm-compact-video-renderer',
  'ytm-channel-renderer',
  'yt-lockup-view-model'          // Modern custom element lockup
].join(', ');

function getCardContainer(el) {
  if (!el || el.nodeType !== 1) return null;
  // If element is inside a rich item (home feed grid cell), prefer that top-level container
  const richItem = el.closest ? el.closest('ytd-rich-item-renderer') : null;
  if (richItem) return richItem;

  if (el.matches && el.matches(CARD_CONTAINER_SELECTORS)) {
    const parentCard = el.parentElement ? el.parentElement.closest(CARD_CONTAINER_SELECTORS) : null;
    return parentCard || el;
  }
  return el.closest ? el.closest(CARD_CONTAINER_SELECTORS) : null;
}

function cleanChannelText(raw) {
  if (!raw) return '';
  return raw.replace(/[\s\n\r]+/g, ' ').trim();
}

function getCardTitle(card) {
  if (!card) return '';
  const titleEl = card.querySelector(
    '.media-item-headline, .compact-media-item-headline, #video-title, #video-title-link, .yt-lockup-metadata-view-model__title, ' +
    'h3.ytd-compact-video-renderer, h3 a, a[id="video-title"], ' +
    'yt-formatted-string#video-title, yt-lockup-metadata-view-model h3, ' +
    '.yt-lockup-metadata-view-model-wiz__title, a.yt-lockup-metadata-view-model__title'
  );
  if (!titleEl) return '';
  const attrTitle = titleEl.getAttribute('title') || titleEl.getAttribute('aria-label');
  if (attrTitle && attrTitle.trim()) {
    return attrTitle.trim();
  }
  return (titleEl.textContent || '').trim();
}

function getCardChannelInfo(card) {
  if (!card) return { names: [], handles: [] };

  const names = new Set();
  const handles = new Set();
  const ids = new Set();

  // 1. Explicit Channel Name Containers (Classic & Modern Lit View-Models)
  const nameElements = card.querySelectorAll(
    '.media-item-byline, .compact-media-item-byline, ytd-channel-name yt-formatted-string, ytd-channel-name #text, ytd-channel-name a, ' +
    '#channel-name yt-formatted-string, #channel-name #text, #channel-name a, ' +
    '#byline a, #byline, #byline-container #text, #byline-container a, ' +
    'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-row:first-child a, ' +
    'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-row:first-child span, ' +
    'yt-content-metadata-view-model a[href*="/@"], yt-content-metadata-view-model a[href*="/channel/"], ' +
    'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-text, ' +
    'yt-lockup-metadata-view-model a[href*="/@"], yt-lockup-metadata-view-model a[href*="/channel/"], ' +
    'yt-lockup-metadata-view-model .yt-lockup-metadata-view-model__byline, ' +
    '.yt-lockup-metadata-view-model-wiz__byline a, .yt-lockup-metadata-view-model-wiz__byline, ' +
    'a.yt-core-attributed-string__link[href*="/@"], a.yt-core-attributed-string__link[href*="/channel/"], ' +
    '#channel-title, yt-formatted-string.ytd-channel-name'
  );

  nameElements.forEach(el => {
    // Avoid reading badges or icons as channel names
    if (el.closest && el.closest('ytd-badge-supported-renderer, .badge-style-type-verified')) return;

    const text = cleanChannelText(el.textContent);
    if (text) names.add(text);

    const titleAttr = el.getAttribute('title') || el.getAttribute('aria-label');
    if (titleAttr) {
      const cleanAttr = cleanChannelText(titleAttr);
      if (cleanAttr) names.add(cleanAttr);
    }
  });

  // 2. Scan all channel-related links in the card for handles and titles (including avatars!)
  const links = card.querySelectorAll('a[href*="/@"], a[href*="/channel/"], a[href*="/c/"], a[href*="/user/"]');
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const channelId = href.match(/\/channel\/([^/?#]+)/);
    if (channelId) ids.add(channelId[1].toLowerCase());
    const handleMatch = href.match(/\/(@[^/?#]+)/u);
    if (handleMatch) {
      try { handles.add(decodeURIComponent(handleMatch[1]).toLowerCase()); } catch {}
    }

    // Often avatars or links have title="Channel Name" or aria-label="Channel Name"
    const titleAttr = a.getAttribute('title') || a.getAttribute('aria-label');
    if (titleAttr) {
      const cleanAttr = cleanChannelText(titleAttr);
      if (cleanAttr && !cleanAttr.toLowerCase().startsWith('go to ')) {
        names.add(cleanAttr);
      }
    }

    const text = cleanChannelText(a.textContent);
    if (text) names.add(text);
  });

  return {
    names: Array.from(names),
    handles: Array.from(handles),
    ids: Array.from(ids)
  };
}

function getCurrentPageChannelInfo() {
  const path = window.location.pathname || '';
  let handle = '';
  const handleMatch = path.match(/^\/(@[^/?#]+)/u);
  if (handleMatch) {
    try { handle = decodeURIComponent(handleMatch[1]).toLowerCase(); } catch {}
  }
  let name = '';
  const headerNameEl = document.querySelector(
    'ytd-c4-tabbed-header-renderer #channel-name, ' +
    'yt-page-header-view-model .page-header-view-model-wiz__page-header-title, ' +
    '#channel-header-container #text, #channel-header yt-formatted-string'
  );
  if (headerNameEl) {
    name = cleanChannelText(headerNameEl.textContent).toLowerCase();
  }
  return { name, handle };
}

function matchesChannel(channelInfo, channelBlocklist, pageChannelInfo) {
  if (!channelBlocklist || channelBlocklist.length === 0) return false;

  const candidateNames = new Set();
  const candidateHandles = new Set();

  if (channelInfo?.names) {
    channelInfo.names.forEach(n => {
      const cleaned = cleanChannelText(n);
      if (cleaned) candidateNames.add(cleaned.toLowerCase());
    });
  }
  if (channelInfo?.handles) {
    channelInfo.handles.forEach(h => {
      if (h) candidateHandles.add(h.toLowerCase());
    });
  }

  if (pageChannelInfo && candidateNames.size === 0 && candidateHandles.size === 0) {
    if (pageChannelInfo.name) {
      const cl = cleanChannelText(pageChannelInfo.name);
      if (cl) candidateNames.add(cl.toLowerCase());
    }
    if (pageChannelInfo.handle) {
      candidateHandles.add(pageChannelInfo.handle.toLowerCase());
    }
  }

  if (candidateNames.size === 0 && candidateHandles.size === 0 && !channelInfo?.ids?.length) return false;

  for (const blocked of channelBlocklist) {
    if (!blocked) continue;
    const bLower = blocked.toLowerCase().trim();
    if (!bLower) continue;

    if (channelInfo?.ids?.includes(bLower.replace(/^\/channel\//, ""))) return true;
    const bHandle = bLower.startsWith('@') ? bLower : '@' + bLower;
    const bNoAt = bLower.startsWith('@') ? bLower.slice(1) : bLower;

    // 1. Direct handle match
    for (const h of candidateHandles) {
      const hNoAt = h.startsWith('@') ? h.slice(1) : h;
      if (h === bHandle || h === bLower || hNoAt === bNoAt) return true;
    }

    // 2. Direct name match
    for (const name of candidateNames) {
      if (name === bLower || name === bNoAt) return true;
    }
  }

  return false;
}

function matchesKeyword(title, keywordBlocklist) {
  if (!keywordBlocklist || keywordBlocklist.length === 0 || !title) return false;
  const titleLower = title.toLowerCase();

  for (const kw of keywordBlocklist) {
    if (!kw) continue;
    const kwLower = kw.toLowerCase().trim();
    if (!kwLower) continue;

    // For short keywords (<= 3 chars), use word boundaries to avoid false positives (e.g. "car" vs "Oscar")
    if (kwLower.length <= 3) {
      const escaped = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[\\s.,!?:;"'()[\\]{}<>/\\\\#@\\-_])(${escaped})(?:$|[\\s.,!?:;"'()[\\]{}<>/\\\\#@\\-_])`, 'i');
      if (regex.test(titleLower)) return true;
    } else {
      if (titleLower.includes(kwLower)) return true;
    }
  }
  return false;
}

function hideCard(card) {
  if (!card || card.nodeType !== 1) return;
  card.setAttribute('data-iyt-filtered', 'true');
  card.style.setProperty('display', 'none', 'important');

  // If card is inside a ytd-rich-item-renderer, hide it too so the grid cell collapses cleanly
  const richItem = card.closest ? card.closest('ytd-rich-item-renderer') : null;
  if (richItem && richItem !== card) {
    richItem.setAttribute('data-iyt-filtered', 'true');
    richItem.style.setProperty('display', 'none', 'important');
  }
}

function unhideCard(card) {
  if (!card || card.nodeType !== 1) return;
  if (card.getAttribute('data-iyt-filtered') === 'true') {
    card.removeAttribute('data-iyt-filtered');
    card.style.removeProperty('display');
  }
  const richItem = card.closest ? card.closest('ytd-rich-item-renderer') : null;
  if (richItem && richItem !== card && richItem.getAttribute('data-iyt-filtered') === 'true') {
    richItem.removeAttribute('data-iyt-filtered');
    richItem.style.removeProperty('display');
  }
}

function findBylineAnchor(card) {
  if (!card) return null;
  const modernRow = card.querySelector(
    '.yt-content-metadata-view-model__metadata-row, ' +
    'yt-content-metadata-view-model, ' +
    '.yt-lockup-metadata-view-model__byline, ' +
    '.yt-lockup-metadata-view-model-wiz__byline'
  );
  if (modernRow) return modernRow;

  const classicByline = card.querySelector(
    'ytd-channel-name #text-container, ' +
    'ytd-channel-name #container, ' +
    'ytd-channel-name, ' +
    '#channel-name, ' +
    '#byline-container, ' +
    '#byline'
  );
  if (classicByline) return classicByline;

  return card.querySelector('a[href*="/@"], a[href*="/channel/"]');
}

let _quickBlockToastTimer = null;

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function showQuickBlockToast(displayName, identifier, card) {
  document.getElementById('iyt-quick-block-toast')?.remove();
  if (_quickBlockToastTimer) {
    clearTimeout(_quickBlockToastTimer);
    _quickBlockToastTimer = null;
  }

  const toast = document.createElement('div');
  toast.id = 'iyt-quick-block-toast';
  toast.setAttribute('role', 'status');
  toast.className = 'iyt-quick-block-toast';
  const dir = (typeof I18N !== 'undefined' && I18N.getDirection) ? I18N.getDirection() : 'ltr';
  toast.setAttribute('dir', dir);

  toast.innerHTML = `
    <div class="iyt-qb-toast-content">
      <span class="iyt-qb-toast-icon">🚫</span>
      <span class="iyt-qb-toast-text"></span>
      <button type="button" class="iyt-qb-toast-undo"></button>
    </div>
    <button type="button" class="iyt-qb-toast-close" >×</button>
  `;

  toast.querySelector('.iyt-qb-toast-text').textContent = I18N.getMessage('channel_blocked', [displayName], 'Blocked ' + displayName);
  toast.querySelector('.iyt-qb-toast-close').setAttribute('aria-label', I18N.getMessage('toast_dismiss_aria', null, 'Dismiss'));
  const undoBtn = toast.querySelector('.iyt-qb-toast-undo');
  undoBtn.textContent = I18N.getMessage('action_undo', null, 'Undo');
  undoBtn.hidden = !!_settings?.focusLock?.enabled;
  undoBtn.addEventListener('click', async (e) => {
    try {
    e.stopPropagation();
    if (_quickBlockToastTimer) {
      clearTimeout(_quickBlockToastTimer);
      _quickBlockToastTimer = null;
    }
    toast.remove();
    if (_settings?.focusLock?.enabled) return;
    if (_settings?.channelBlocklist) {
      _settings.channelBlocklist = _settings.channelBlocklist.filter(x => x !== identifier);
      _settings = IYT_Policy.effective(await StorageManager.changeList('channelBlocklist', identifier, true));
      unhideCard(card);
      scanAllCards(document);
    }
    } catch (error) {
      if (!/Extension context invalidated/i.test(error?.message || '')) console.warn('[IYT] Undo failed', error);
    }
  });

  const closeBtn = toast.querySelector('.iyt-qb-toast-close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_quickBlockToastTimer) {
      clearTimeout(_quickBlockToastTimer);
      _quickBlockToastTimer = null;
    }
    toast.remove();
  });

  document.body.appendChild(toast);

  _quickBlockToastTimer = setTimeout(() => {
    toast.classList.add('iyt-qb-toast-fadeout');
    setTimeout(() => toast.remove(), 250);
  }, 5000);
}

async function handleQuickBlockChannel(card, displayName, channelInfo) {
  const identifier = (channelInfo?.ids?.[0] || channelInfo?.handles?.[0] || displayName || channelInfo?.names?.[0] || '').trim().toLowerCase();
  if (!identifier) return;

  if (!_settings.channelBlocklist) _settings.channelBlocklist = [];
  if (!_settings.channelBlocklist.includes(identifier)) {
    _settings = IYT_Policy.effective(await StorageManager.changeList('channelBlocklist', identifier));
  }

  hideCard(card);
  scanAllCards(document);
  showQuickBlockToast(displayName, identifier, card);
}

function removeAllQuickBlockButtons() {
  document.querySelectorAll('.iyt-quick-block-btn').forEach(btn => btn.remove());
}

function injectQuickBlockButton(card, channelInfo) {
  if (!_settings || _settings.enableQuickBlock === false || !isEffectiveActive(_settings)) return;
  if (!card || card.nodeType !== 1) return;

  const info = channelInfo || getCardChannelInfo(card);
  const displayName = info.names[0] || info.handles[0];
  if (!displayName) { card.querySelector('.iyt-quick-block-btn')?.remove(); return; }

  const identity = info.ids?.[0] || info.handles[0] || displayName;
  const existingButton = card.querySelector('.iyt-quick-block-btn');
  if (existingButton?.dataset.channel === identity) return;
  existingButton?.remove();
  const targetContainer = findBylineAnchor(card);
  if (!targetContainer) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'iyt-quick-block-btn';
  btn.dataset.channel = identity;
  btn.title = `${I18N.getMessage('action_block', null, 'Block')} ${displayName}`;
  btn.setAttribute('aria-label', btn.title);

  const blockLabel = (typeof I18N !== 'undefined' && I18N.getMessage)
    ? (I18N.getMessage('action_block') || 'Block')
    : ((browser?.i18n?.getMessage && browser.i18n.getMessage('action_block')) || 'Block');

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
    <span class="iyt-qb-label"></span>
  `;

  btn.querySelector('.iyt-qb-label').textContent = blockLabel;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handleQuickBlockChannel(card, displayName, info).catch(console.warn);
  });

  targetContainer.appendChild(btn);
}

function evaluateCard(card, channelBlocklist, keywordBlocklist, pageChannelInfo) {
  if (!card || card.nodeType !== 1) return;

  const channelInfo = getCardChannelInfo(card);
  const isBlockedChannel = matchesChannel(channelInfo, channelBlocklist, null);
  const title = getCardTitle(card);
  const isBlockedKeyword = !isBlockedChannel && matchesKeyword(title, keywordBlocklist);

  if (isBlockedChannel || isBlockedKeyword) {
    hideCard(card);
  } else {
    unhideCard(card);
    if (_settings?.enableQuickBlock !== false && isEffectiveActive(_settings)) {
      injectQuickBlockButton(card, channelInfo);
    }
  }
}

function scanAllCards(root = document) {
  if (!isEffectiveActive(_settings)) {
    document.querySelectorAll('[data-iyt-filtered="true"]').forEach(el => {
      unhideCard(el);
    });
    removeAllQuickBlockButtons();
    return;
  }

  const channelList = _settings?.channelBlocklist || [];
  const keywordList = _settings?.keywordBlocklist || [];
  const enableQuickBlock = _settings?.enableQuickBlock !== false;

  if (channelList.length === 0 && keywordList.length === 0) {
    document.querySelectorAll('[data-iyt-filtered="true"]').forEach(el => {
      unhideCard(el);
    });
    if (!enableQuickBlock) {
      removeAllQuickBlockButtons();
      return;
    }
  }

  if (!enableQuickBlock) {
    removeAllQuickBlockButtons();
  }

  const pageChannelInfo = getCurrentPageChannelInfo();
  const cards = root.querySelectorAll(CARD_CONTAINER_SELECTORS);
  for (let i = 0; i < cards.length; i++) {
    evaluateCard(cards[i], channelList, keywordList, pageChannelInfo);
  }
}

let _filterDebounceTimer = null;
const _pendingFilterNodes = new Set();
let _pendingFullFilterScan = false;
const MAX_PENDING_FILTER_NODES = 256;

function scheduleFilterScanForNodes(nodes) {
  if (!isEffectiveActive(_settings)) return;
  const channelList = _settings?.channelBlocklist || [];
  const keywordList = _settings?.keywordBlocklist || [];
  const enableQuickBlock = _settings?.enableQuickBlock !== false;
  if (channelList.length === 0 && keywordList.length === 0 && !enableQuickBlock) return;

  for (const node of nodes) {
    if (_pendingFullFilterScan) break;
    if (node.nodeType === 1 && node.isConnected) {
      _pendingFilterNodes.add(node);
      if (_pendingFilterNodes.size >= MAX_PENDING_FILTER_NODES) {
        // Throttled background tabs can accumulate entire detached page trees.
        // Retain no nodes once a single full scan is cheaper than the queue.
        _pendingFilterNodes.clear();
        _pendingFullFilterScan = true;
      }
    }
  }

  // Keep a bounded batch window even while YouTube continuously updates.
  if (_filterDebounceTimer) return;
  _filterDebounceTimer = setTimeout(() => {
    flushPendingFilterNodes();
  }, 300);
}

function flushPendingFilterNodes() {
  _filterDebounceTimer = null;
  if (!isEffectiveActive(_settings)) {
    _pendingFilterNodes.clear();
    _pendingFullFilterScan = false;
    return;
  }
  if (_pendingFullFilterScan) {
    _pendingFullFilterScan = false;
    _pendingFilterNodes.clear();
    scanAllCards(document);
    return;
  }
  if (_pendingFilterNodes.size === 0) return;

  const channelList = _settings?.channelBlocklist || [];
  const keywordList = _settings?.keywordBlocklist || [];
  const pageChannelInfo = getCurrentPageChannelInfo();

  const cardsToEvaluate = new Set();

  for (const node of _pendingFilterNodes) {
    if (!node.isConnected) continue;

    // 1. Is this node itself or an ancestor a card? (Catches lazy-loaded details, titles, channels)
    const parentCard = getCardContainer(node);
    if (parentCard) {
      cardsToEvaluate.add(parentCard);
    }

    // 2. Does this node contain any cards? (Catches rows, sections, grids)
    if (node.querySelectorAll) {
      const nestedCards = node.querySelectorAll(CARD_CONTAINER_SELECTORS);
      for (let i = 0; i < nestedCards.length; i++) {
        const card = getCardContainer(nestedCards[i]);
        if (card) cardsToEvaluate.add(card);
      }
    }
  }

  _pendingFilterNodes.clear();

  for (const card of cardsToEvaluate) {
    evaluateCard(card, channelList, keywordList, pageChannelInfo);
  }
}

const _routeFilterTimers = new Map();
function scheduleFullFilterScan(delayMs = 80) {
  clearTimeout(_routeFilterTimers.get(delayMs));
  _routeFilterTimers.set(delayMs, setTimeout(() => {
    _routeFilterTimers.delete(delayMs);
    scanAllCards(document);
  }, delayMs));
}

let _isApplyingClasses = false;

function applyAllClasses(settings) {
  settings = IYT_Policy.effective(settings);
  _isApplyingClasses = true;
  try {
    const active = isEffectiveActive(settings);
    html.classList.toggle('iyt-scheduled-full-block', IYT_Policy.schedules(settings).some(s => s.mode === 'full'));
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

    // Re-evaluate content blocklists whenever settings classes change
    scanAllCards(document);
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
  settings = IYT_Policy.effective(settings);
  if (!isEffectiveActive(settings) || !settings.disableAutoplay) return;
  document.querySelectorAll('video[autoplay]').forEach(v => v.removeAttribute('autoplay'));
  const btn = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (btn) btn.click();
}

let _autoplayScheduled = false;
function scheduleAutoplay() {
  if (_autoplayScheduled || !_settings?.disableAutoplay) return;
  _autoplayScheduled = true;
  setTimeout(() => {
    _autoplayScheduled = false;
    applyAutoplay(_settings);
  }, 150);
}

let _settingsGeneration = 0;
async function applyAllSettings() {
  const generation = ++_settingsGeneration;
  const saved = await StorageManager.getSettings();
  if (generation !== _settingsGeneration) return;
  _settings = IYT_Policy.effective(saved);
  scheduleSnoozeWakeup(_settings);
  checkShortsRedirect(_settings);
  applyAllClasses(_settings);
  applyAutoplay(_settings);
  html.setAttribute("data-iyt-ready", "true");
}

// React instantly when user toggles settings via storage event
browser.storage.onChanged.addListener((changes) => {
  if (!changes.settings?.newValue) return;
  ++_settingsGeneration;
  _settings = IYT_Policy.effective(changes.settings.newValue);
  scheduleSnoozeWakeup(_settings);
  checkShortsRedirect(_settings);
  applyAllClasses(_settings);
  applyAutoplay(_settings);
  html.setAttribute("data-iyt-ready", "true");
});

// Also react immediately to direct runtime messages from popup
if (browser && browser.runtime && browser.runtime.onMessage) {
  browser.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'IYT_APPLY_SETTINGS' && msg.settings) {
      ++_settingsGeneration;
      _settings = IYT_Policy.effective(msg.settings);
      scheduleSnoozeWakeup(_settings);
      checkShortsRedirect(_settings);
      applyAllClasses(_settings);
      applyAutoplay(_settings);
      html.setAttribute("data-iyt-ready", "true");
    }
  });
}

// Initial injection at document_start
applyAllSettings().catch(() => html.setAttribute("data-iyt-ready", "true"));

function initDomObserver() {
  const target = document.body || document.documentElement;
  if (!target) {
    document.addEventListener('DOMContentLoaded', initDomObserver, { once: true });
    return;
  }
  const observer = new MutationObserver((mutations) => {
    if (!isEffectiveActive(_settings)) return;
    const addedElements = [];
    let structureChanged = false;
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      const target = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
      if (target?.closest('.iyt-quick-block-btn')) continue;
      // Player clocks, captions and live chat update continuously. Only card
      // metadata changes can affect channel/keyword filtering.
      if (mutation.type !== 'childList') {
        if (target && getCardContainer(target)) addedElements.push(target);
        if (mutation.type === 'attributes' && mutation.attributeName === 'href' && target?.matches('a[href*="/shorts/"]')) {
          addedElements.push(target);
          structureChanged = true;
        }
        continue;
      }
      if (mutation.type !== 'childList' || mutation.addedNodes.length === 0 || [...mutation.addedNodes].some(node => node.nodeType === 3)) {
        const changed = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
        if (changed && getCardContainer(changed)) addedElements.push(changed);
      }
      const added = mutation.addedNodes;
      for (let j = 0; j < added.length; j++) {
        if (added[j].nodeType === 1) {
          if (added[j].matches('.iyt-quick-block-btn')) continue;
          addedElements.push(added[j]);
          structureChanged = true;
        }
      }
    }
    if (addedElements.length > 0) {
      if (structureChanged && _settings.blockShorts) scheduleShortsPurge();
      if (structureChanged && _settings.limitHomeFeed) scheduleHomeFeedLimit();
      scheduleFilterScanForNodes(addedElements);
      if (structureChanged) scheduleAutoplay();
    }
  });
  observer.observe(target, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href','title','aria-label'] });

  // Immediately scan any elements already parsed in the DOM
  scanAllCards(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDomObserver();
  }, { once: true });
} else {
  initDomObserver();
}

window.addEventListener('load', () => {
  scanAllCards(document);
});

document.addEventListener('yt-navigate-finish', () => {
  updateHomePageState();
  checkSnoozeExpiry();
  scheduleShortsPurge();
  scheduleHomeFeedLimit();
  scheduleFullFilterScan(50);
  scheduleFullFilterScan(300);
  scheduleFullFilterScan(1000);
});
document.addEventListener('yt-page-data-updated', () => {
  updateHomePageState();
  checkSnoozeExpiry();
  scheduleShortsPurge();
  scheduleHomeFeedLimit();
  scheduleFullFilterScan(80);
  scheduleFullFilterScan(500);
});
window.addEventListener('popstate', () => {
  updateHomePageState();
  scheduleHomeFeedLimit();
  scheduleFullFilterScan(50);
});
window.addEventListener('resize', () => {
  scheduleHomeFeedLimit();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkSnoozeExpiry();
    scheduleFullFilterScan(50);
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
  scanContentFilters: () => scanAllCards(document),
  checkShortsRedirect: () => checkShortsRedirect(_settings)
};
