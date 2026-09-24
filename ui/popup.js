/**
 * popup.js — Intentional YT v3
 * Restructured tabbed navigation, Focus Lock, Scheduled Blocking,
 * relocated language selector, and reset to defaults.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

function getMsg(key, subs, fallback) {
  if (typeof I18N !== 'undefined' && I18N.getMessage) {
    return I18N.getMessage(key, subs, fallback);
  }
  try {
    if (browser && browser.i18n && typeof browser.i18n.getMessage === 'function') {
      const msg = browser.i18n.getMessage(key, subs);
      if (msg) return msg;
    }
  } catch (e) {}
  return fallback !== undefined ? fallback : null;
}

const t = getMsg;

function applyTheme(themeMode) {
  const mode = themeMode || 'auto';
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function localizeDOM() {
  const dir = (typeof I18N !== 'undefined' && I18N.getDirection)
    ? I18N.getDirection()
    : (getMsg('@@bidi_dir') || 'ltr');
  document.documentElement.setAttribute('dir', dir);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const arg = el.getAttribute('data-i18n-arg');
    const msg = arg ? getMsg(key, [arg]) : getMsg(key);
    if (msg) el.textContent = msg;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const msg = getMsg(key);
    if (msg) el.setAttribute('placeholder', msg);
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    const msg = getMsg(key);
    if (msg) el.setAttribute('aria-label', msg);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const msg = getMsg(key);
    if (msg) el.setAttribute('title', msg);
  });
}

const TOGGLES = [
  'extensionEnabled',
  'blockHomeFeed', 'limitHomeFeed', 'blockSidebar', 'blockRecommended',
  'blockLiveChat', 'blockPlaylist', 'blockEndScreenVideowall',
  'blockEndScreenCards', 'blockComments', 'blockProfilePhotos',
  'blockMixPlaylists', 'blockMerch', 'blockVideoInfo',
  'blockVideoButtons', 'blockChannelInfo', 'blockVideoDescription',
  'blockTopHeader', 'blockNotificationBell', 'blockIrrelevantSearchResults',
  'blockExploreAndTrending', 'blockMoreFromYouTube', 'blockShorts',
  'redirectShorts',
  'blockSubscriptionsFeed', 'disableAutoplay', 'disableAnnotations',
  'hideThumbnails', 'grayscaleMode',
];

const TOGGLE_LABELS = {
  extensionEnabled: 'toggle_extension_enabled',
  blockHomeFeed: 'toggle_block_home_feed',
  limitHomeFeed: 'toggle_limit_home_feed',
  blockSidebar: 'toggle_block_sidebar',
  blockRecommended: 'toggle_block_recommended',
  blockLiveChat: 'toggle_block_live_chat',
  blockPlaylist: 'toggle_block_playlist',
  blockEndScreenVideowall: 'toggle_block_endscreen_videowall',
  blockEndScreenCards: 'toggle_block_endscreen_cards',
  blockComments: 'toggle_block_comments',
  blockProfilePhotos: 'toggle_block_profile_photos',
  blockMixPlaylists: 'toggle_block_mix_playlists',
  blockMerch: 'toggle_block_merch',
  blockVideoInfo: 'toggle_block_video_info',
  blockVideoButtons: 'toggle_block_video_buttons',
  blockChannelInfo: 'toggle_block_channel_info',
  blockVideoDescription: 'toggle_block_video_description',
  blockTopHeader: 'toggle_block_top_header',
  blockNotificationBell: 'toggle_block_notification_bell',
  blockIrrelevantSearchResults: 'toggle_block_irrelevant_search',
  blockExploreAndTrending: 'toggle_block_explore_trending',
  blockMoreFromYouTube: 'toggle_block_more_from_youtube',
  blockShorts: 'toggle_block_shorts',
  redirectShorts: 'toggle_redirect_shorts',
  blockSubscriptionsFeed: 'toggle_block_subscriptions',
  disableAutoplay: 'toggle_disable_autoplay',
  disableAnnotations: 'toggle_disable_annotations',
  hideThumbnails: 'toggle_hide_thumbnails',
  grayscaleMode: 'toggle_grayscale_mode',
  softReminder: 'toggle_soft_reminder',
  dailyLimit: 'toggle_daily_limit',
  focusLock: 'toggle_focus_lock',
  scheduledBlocking: 'toggle_scheduled_blocking'
};

const SECTION_TOGGLES = {
  feed: [
    'blockHomeFeed',
    'limitHomeFeed',
    'blockSubscriptionsFeed',
    'blockRecommended',
    'blockShorts',
    'redirectShorts',
    'blockExploreAndTrending',
    'blockMoreFromYouTube',
    'blockIrrelevantSearchResults'
  ],
  video: [
    'blockEndScreenVideowall',
    'blockEndScreenCards',
    'blockLiveChat',
    'blockPlaylist',
    'disableAutoplay',
    'disableAnnotations',
    'blockVideoInfo',
    'blockVideoButtons',
    'blockChannelInfo',
    'blockVideoDescription'
  ],
  social: [
    'blockComments',
    'blockProfilePhotos'
  ],
  interface: [
    'blockSidebar',
    'blockTopHeader',
    'blockNotificationBell',
    'blockMerch',
    'blockMixPlaylists'
  ],
  appearance: [
    'hideThumbnails',
    'grayscaleMode'
  ]
};

const PRESET_DEFINITIONS = {
  balanced: {
    blockHomeFeed: true,
    limitHomeFeed: false,
    blockSidebar: true,
    blockRecommended: true,
    blockLiveChat: true,
    blockPlaylist: false,
    blockEndScreenVideowall: true,
    blockEndScreenCards: true,
    blockComments: false,
    blockProfilePhotos: false,
    blockMixPlaylists: true,
    blockMerch: true,
    blockVideoInfo: false,
    blockVideoButtons: false,
    blockChannelInfo: false,
    blockVideoDescription: false,
    blockTopHeader: false,
    blockNotificationBell: true,
    blockIrrelevantSearchResults: true,
    blockExploreAndTrending: true,
    blockMoreFromYouTube: true,
    blockShorts: true,
    blockSubscriptionsFeed: false,
    disableAutoplay: true,
    disableAnnotations: true,
    hideThumbnails: false,
    grayscaleMode: false
  },
  zen: {
    blockHomeFeed: true,
    limitHomeFeed: false,
    blockSidebar: true,
    blockRecommended: true,
    blockLiveChat: true,
    blockPlaylist: true,
    blockEndScreenVideowall: true,
    blockEndScreenCards: true,
    blockComments: true,
    blockProfilePhotos: true,
    blockMixPlaylists: true,
    blockMerch: true,
    blockVideoInfo: false,
    blockVideoButtons: false,
    blockChannelInfo: false,
    blockVideoDescription: false,
    blockTopHeader: false,
    blockNotificationBell: true,
    blockIrrelevantSearchResults: true,
    blockExploreAndTrending: true,
    blockMoreFromYouTube: true,
    blockShorts: true,
    blockSubscriptionsFeed: true,
    disableAutoplay: true,
    disableAnnotations: true,
    hideThumbnails: true,
    grayscaleMode: false
  },
  player: {
    blockHomeFeed: true,
    limitHomeFeed: false,
    blockSidebar: true,
    blockRecommended: true,
    blockLiveChat: true,
    blockPlaylist: false,
    blockEndScreenVideowall: true,
    blockEndScreenCards: true,
    blockComments: true,
    blockProfilePhotos: true,
    blockMixPlaylists: true,
    blockMerch: true,
    blockVideoInfo: false,
    blockVideoButtons: false,
    blockChannelInfo: false,
    blockVideoDescription: false,
    blockTopHeader: false,
    blockNotificationBell: false,
    blockIrrelevantSearchResults: true,
    blockExploreAndTrending: true,
    blockMoreFromYouTube: true,
    blockShorts: true,
    blockSubscriptionsFeed: false,
    disableAutoplay: true,
    disableAnnotations: true,
    hideThumbnails: false,
    grayscaleMode: false
  }
};

let _s = null;
let _softCustomMode = false;
let _dailyCustomMode = false;
let _activeTab = 'block';
let _bannerInterval = null;
let _pendingVerificationCallback = null;

const $ = id => document.getElementById(id);

function getSettingFriendlyName(settingKey) {
  if (TOGGLE_LABELS[settingKey]) {
    return t(TOGGLE_LABELS[settingKey]) || settingKey;
  }
  if (settingKey.startsWith('preset:')) {
    const pName = settingKey.split(':')[1];
    const pLabel = t(`preset_${pName}`) || pName;
    return `${t('presets_title') || 'Preset'}: ${pLabel}`;
  }
  if (settingKey === 'dailyLimit.enabled' || settingKey === 'dailyLimit') {
    return t('toggle_daily_limit') || 'Daily Limit';
  }
  if (settingKey === 'softReminder.enabled' || settingKey === 'softReminder') {
    return t('toggle_soft_reminder') || 'Soft Reminder';
  }
  if (settingKey === 'focusLock.enabled' || settingKey === 'focusLock') {
    return t('toggle_focus_lock') || 'Focus Lock';
  }
  if (settingKey === 'scheduledBlocking.enabled' || settingKey === 'scheduledBlocking') {
    return t('toggle_scheduled_blocking') || 'Scheduled Blocking';
  }
  if (settingKey.startsWith('schedule.toggle:')) {
    const id = settingKey.split(':')[1];
    const sched = _s?.scheduledBlocking?.schedules?.find(x => x.id === id);
    return `${sched?.label || 'Schedule'} (${t('status_paused') || 'Pause'})`;
  }
  if (settingKey.startsWith('schedule.delete:')) {
    const id = settingKey.split(':')[1];
    const sched = _s?.scheduledBlocking?.schedules?.find(x => x.id === id);
    return `${t('schedule_card_delete') || 'Delete'} ${sched?.label || 'Schedule'}`;
  }
  if (settingKey === 'resetDefaults') {
    return t('btn_reset_defaults') || 'Reset Settings';
  }
  if (settingKey === 'importSettings') {
    return t('btn_import_settings') || 'Import Settings';
  }
  return settingKey;
}

function fmtTime(secs) {
  if (!secs || secs <= 0) return t('time_fmt_zero_min') || '0 min';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return t('time_fmt_hours_minutes', [String(h), String(m)]) || `${h}h ${m}m`;
  if (m > 0) return t('time_fmt_minutes', [String(m)]) || `${m} min`;
  return t('time_fmt_seconds', [String(s)]) || `${s}s`;
}

function fmtMmSs(totalSecs) {
  if (totalSecs <= 0) return '00:00';
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Block Tab Accordion Cards & Active Badges ─────────── */

const ACCORDION_SECTIONS = ['feed', 'video', 'social', 'interface', 'appearance'];

function getSectionActiveCount(secName, s) {
  const settings = s || _s;
  if (!settings) return 0;
  const toggleKeys = SECTION_TOGGLES[secName] || [];
  let count = 0;
  for (const key of toggleKeys) {
    if (['blockVideoButtons', 'blockChannelInfo', 'blockVideoDescription'].includes(key)) {
      if (!settings.blockVideoInfo && settings[key]) {
        count++;
      }
    } else if (settings[key]) {
      count++;
    }
  }
  return count;
}

function updateAccordionBadges(s) {
  const settings = s || _s;
  if (!settings) return;

  for (const sec of ACCORDION_SECTIONS) {
    const secEl = $(`sec-${sec}`);
    const badgeEl = $(`count-${sec}`);
    if (!secEl || !badgeEl) continue;

    const count = getSectionActiveCount(sec, settings);
    const total = (SECTION_TOGGLES[sec] || []).length;
    const isCollapsed = secEl.classList.contains('collapsed');

    if (isCollapsed) {
      badgeEl.textContent = `${count}/${total}`;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

async function toggleAccordion(secName) {
  const secEl = $(`sec-${secName}`);
  const btn = secEl?.querySelector('.sh-btn');
  if (!secEl || !btn) return;

  const isCollapsed = secEl.classList.toggle('collapsed');
  btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');

  updateAccordionBadges(_s);
  updateToggleAllAccordionsBtn();
  await saveAccordionState();
}

async function saveAccordionState() {
  const collapsedMap = {};
  for (const sec of ACCORDION_SECTIONS) {
    const el = $(`sec-${sec}`);
    if (el) {
      collapsedMap[sec] = el.classList.contains('collapsed');
    }
  }
  try {
    await browser.storage.local.set({ accordionCollapsed: collapsedMap });
  } catch (err) {
    console.warn('[IYT] Failed to save accordionCollapsed state:', err);
  }
}

function restoreAccordionState(state) {
  const collapsedMap = state || {};
  for (const sec of ACCORDION_SECTIONS) {
    const secEl = $(`sec-${sec}`);
    const btn = secEl?.querySelector('.sh-btn');
    if (!secEl || !btn) continue;

    const shouldCollapse = !!collapsedMap[sec];
    secEl.classList.toggle('collapsed', shouldCollapse);
    btn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
  }
  updateAccordionBadges(_s);
  updateToggleAllAccordionsBtn();
}

function updateToggleAllAccordionsBtn() {
  const btn = $('btn-toggle-all-accordions');
  const label = $('label-toggle-all-accordions');
  if (!btn || !label) return;
  const anyOpen = ACCORDION_SECTIONS.some(sec => {
    const el = $(`sec-${sec}`);
    return el && !el.classList.contains('collapsed');
  });
  const key = anyOpen ? 'action_collapse_all' : 'action_expand_all';
  const text = getMsg(key) || (anyOpen ? 'Collapse All' : 'Expand All');
  label.textContent = text;
  btn.setAttribute('data-action', anyOpen ? 'collapse' : 'expand');
}

async function toggleAllAccordions() {
  const btn = $('btn-toggle-all-accordions');
  if (!btn) return;
  const shouldCollapse = btn.getAttribute('data-action') === 'collapse';
  for (const sec of ACCORDION_SECTIONS) {
    const secEl = $(`sec-${sec}`);
    const shBtn = secEl?.querySelector('.sh-btn');
    if (secEl && shBtn) {
      secEl.classList.toggle('collapsed', shouldCollapse);
      shBtn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
    }
  }
  updateAccordionBadges(_s);
  updateToggleAllAccordionsBtn();
  await saveAccordionState();
}

/* ── Focus Tab Modular Feature Cards ───────────────────── */

const FOCUS_CARD_NAMES = ['time', 'lock', 'schedule'];

function updateFocusCardBadges(s) {
  const settings = s || _s;
  if (!settings) return;

  // 1. Time & Limits Card
  const timeBadge = $('badge-focus-time');
  const timeCard = $('card-focus-time');
  if (timeBadge) {
    const softOn = !!settings.softReminder?.enabled;
    const dailyOn = !!settings.dailyLimit?.enabled;
    const softMin = settings.softReminder?.intervalMinutes || 30;
    const dailyMin = settings.dailyLimit?.limitMinutes || 60;

    if (softOn && dailyOn) {
      timeBadge.textContent = '2 Active';
      timeBadge.className = 'focus-card-badge badge-active';
      timeCard?.classList.add('is-active');
    } else if (softOn) {
      timeBadge.textContent = `Every ${softMin}m`;
      timeBadge.className = 'focus-card-badge badge-active';
      timeCard?.classList.add('is-active');
    } else if (dailyOn) {
      timeBadge.textContent = `Limit ${dailyMin}m`;
      timeBadge.className = 'focus-card-badge badge-active';
      timeCard?.classList.add('is-active');
    } else {
      timeBadge.textContent = t('status_off') || 'Off';
      timeBadge.className = 'focus-card-badge';
      timeCard?.classList.remove('is-active');
    }
  }

  // 2. Focus Lock Card
  const lockBadge = $('badge-focus-lock');
  const lockCard = $('card-focus-lock');
  if (lockBadge) {
    const lockOn = !!settings.focusLock?.enabled;
    const cooldown = settings.focusLock?.cooldownMinutes || 10;
    if (lockOn) {
      lockBadge.textContent = `${cooldown}m Delay`;
      lockBadge.className = 'focus-card-badge badge-warning';
      lockCard?.classList.add('is-active');
    } else {
      lockBadge.textContent = t('status_off') || 'Off';
      lockBadge.className = 'focus-card-badge';
      lockCard?.classList.remove('is-active');
    }
  }

  // 3. Scheduled Blocking Card
  const schedBadge = $('badge-focus-schedule');
  const schedCard = $('card-focus-schedule');
  if (schedBadge) {
    const schedOn = !!settings.scheduledBlocking?.enabled;
    const schedules = settings.scheduledBlocking?.schedules || [];
    const activeScheds = schedules.filter(x => !x.disabled);

    if (schedOn) {
      schedBadge.textContent = activeScheds.length > 0 ? `${activeScheds.length} Active` : 'Enabled';
      schedBadge.className = 'focus-card-badge badge-active';
      schedCard?.classList.add('is-active');
    } else {
      schedBadge.textContent = schedules.length > 0 ? `${schedules.length} Saved` : (t('status_off') || 'Off');
      schedBadge.className = 'focus-card-badge';
      schedCard?.classList.remove('is-active');
    }
  }
}

async function toggleFocusCard(cardName) {
  const cardEl = $(`card-focus-${cardName}`);
  if (!cardEl) return;
  const isCollapsed = cardEl.classList.toggle('collapsed');
  const header = cardEl.querySelector('.focus-card-header');
  if (header) {
    header.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
  }
  await saveFocusCardState();
}

async function saveFocusCardState() {
  const state = {};
  for (const name of FOCUS_CARD_NAMES) {
    const cardEl = $(`card-focus-${name}`);
    if (cardEl) {
      state[name] = cardEl.classList.contains('collapsed');
    }
  }
  try {
    await browser.storage.local.set({ focusCardsCollapsed: state });
  } catch (err) {
    console.warn('[IYT] Failed to save focusCardsCollapsed state:', err);
  }
}

function restoreFocusCardState(storedState) {
  const state = storedState || {};
  for (const name of FOCUS_CARD_NAMES) {
    const cardEl = $(`card-focus-${name}`);
    if (cardEl && state[name]) {
      cardEl.classList.add('collapsed');
      const header = cardEl.querySelector('.focus-card-header');
      if (header) header.setAttribute('aria-expanded', 'false');
    }
  }
}

/* ── Quick Modes / Presets & Quick Strip ───────────────── */

function detectActivePreset(s) {
  const settings = s || _s;
  if (!settings) return 'custom';
  for (const [name, def] of Object.entries(PRESET_DEFINITIONS)) {
    let match = true;
    for (const [k, v] of Object.entries(def)) {
      if (Boolean(settings[k]) !== Boolean(v)) {
        match = false;
        break;
      }
    }
    if (match) return name;
  }
  return 'custom';
}

function updatePresetUI(s) {
  const active = detectActivePreset(s);

  // Update preset dropdown
  const selectPreset = $('select-preset');
  if (selectPreset) {
    selectPreset.value = active;
  }

  // Update dropdown icon
  const icon = document.querySelector('.preset-dropdown-icon');
  if (icon) {
    const icons = {
      balanced: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      zen: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20"/>',
      player: '<polygon points="5 3 19 12 5 21 5 3"/>',
      custom: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
    };
    if (icons[active]) {
      icon.innerHTML = icons[active];
    }
  }

  // Backward compatibility with chips if present
  ['balanced', 'zen', 'player', 'custom'].forEach(p => {
    const chip = $(`chip-preset-${p}`);
    if (chip) {
      const isActive = (p === active);
      chip.classList.toggle('active', isActive);
      chip.setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  });

  const descEl = $('preset-active-desc');
  if (descEl) {
    const descKey = `preset_desc_${active}`;
    descEl.textContent = t(descKey) || '';
  }
}

function getPresetRelaxedKeys(targetPreset) {
  if (!_s) return [];
  const relaxed = [];
  for (const [key, val] of Object.entries(targetPreset)) {
    if (_s[key] === true && val === false) {
      relaxed.push(key);
    }
  }
  return relaxed;
}

async function doApplyPreset(preset, presetName) {
  dismissWelcomeCard();
  const updated = await StorageManager.updateSettings(preset);
  _s = updated;
  broadcastSettingsToTabs(updated);
  renderAll(updated);
  const pLabel = t(`preset_${presetName}`) || presetName;
  showToast(t('preset_applied', [pLabel]) || `Switched to ${pLabel} mode`);
}

async function applyPreset(presetName) {
  if (presetName === 'custom') {
    const detailedHeader = document.querySelector('.detailed-header');
    if (detailedHeader) {
      detailedHeader.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  const targetPreset = PRESET_DEFINITIONS[presetName];
  if (!targetPreset) return;

  if (detectActivePreset(_s) === presetName) return;

  const relaxedKeys = getPresetRelaxedKeys(targetPreset);
  if (isFocusLockActive() && relaxedKeys.length > 0) {
    await interceptSettingChange(
      `preset:${presetName}`,
      presetName,
      () => { updatePresetUI(_s); },
      async () => {
        await doApplyPreset(targetPreset, presetName);
      }
    );
  } else {
    await doApplyPreset(targetPreset, presetName);
  }
}

/* ── 1st-Run Welcome Card ──────────────────────────────── */

async function dismissWelcomeCard() {
  const card = $('welcome-card');
  if (card && card.style.display !== 'none') {
    card.style.transition = 'opacity 0.2s ease, max-height 0.25s ease, margin 0.25s ease, padding 0.25s ease';
    card.style.opacity = '0';
    card.style.maxHeight = '0';
    card.style.padding = '0 12px';
    card.style.margin = '0 12px';
    setTimeout(() => { card.style.display = 'none'; }, 260);
    try {
      await browser.storage.local.set({ welcomeDismissed: true });
    } catch (e) {}
  }
}

/* ── In-Popup Toggle Quick Search ──────────────────────── */

const SEARCH_ALIASES = {
  blockVideoInfo: 'metadata details title header author panel video info',
  blockVideoButtons: 'like dislike share clip download save action buttons video buttons',
  blockChannelInfo: 'channel info owner creator author avatar subscribe subscriber count',
  blockVideoDescription: 'description text summary details expandable video description hide description sub toggle',
  limitHomeFeed: 'limit home feed doomscroll anti-doomscroll scroll infinite',
  blockHomeFeed: 'home feed recommendations homepage algorithmic feed',
  blockShorts: 'shorts reel reels tiktok vertical videos',
  redirectShorts: 'redirect shorts normal player standard view',
  blockEndScreenVideowall: 'end screen videowall next watch grid recommendations',
  blockEndScreenCards: 'end screen cards creator cards annotations',
  blockLiveChat: 'live chat stream chat replay',
  blockPlaylist: 'playlist panel playlist queue',
  disableAutoplay: 'disable autoplay next video auto play',
  disableAnnotations: 'annotations cards popups notes',
  blockComments: 'comments replies discussion community',
  blockProfilePhotos: 'profile photos avatars pictures',
  blockSidebar: 'sidebar guide drawer navigation menu left panel',
  blockRecommended: 'recommended sidebar up next related suggestions related videos',
  blockExploreAndTrending: 'explore trending popular destination fire',
  blockMoreFromYouTube: 'more from youtube premium movies music gaming',
  blockIrrelevantSearchResults: 'search shelves for you people also watched searches related',
  blockTopHeader: 'top header masthead search bar top bar',
  blockNotificationBell: 'notification bell bell alerts',
  blockMerch: 'merch offers shopping products merchandise',
  blockMixPlaylists: 'mix playlists mixes radio endless mix',
  hideThumbnails: 'thumbnails preview images blur picture',
  grayscaleMode: 'grayscale black and white monochrome bw gray colour'
};

let _searchPrevCollapsed = null;

function filterToggles(query) {
  const q = (query || '').trim().toLowerCase();
  const clearBtn = $('btn-clear-search');
  const noResultsEl = $('search-no-results');
  const detailedHeader = document.querySelector('.detailed-header');

  if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';

  if (!q) {
    if (noResultsEl) noResultsEl.style.display = 'none';
    if (detailedHeader) detailedHeader.style.display = 'flex';

    for (const sec of ACCORDION_SECTIONS) {
      const secEl = $(`sec-${sec}`);
      if (secEl) {
        secEl.style.display = '';
        if (_searchPrevCollapsed && _searchPrevCollapsed[sec] !== undefined) {
          const btn = secEl.querySelector('.sh-btn');
          secEl.classList.toggle('collapsed', _searchPrevCollapsed[sec]);
          btn?.setAttribute('aria-expanded', _searchPrevCollapsed[sec] ? 'false' : 'true');
        }
      }
      const body = $(`sec-${sec}-body`);
      if (body) {
        body.querySelectorAll('.row').forEach(row => {
          row.style.display = '';
        });
      }
    }

    // Restore subordinate container to stored toggle state
    const videoInfoChildren = $('video-info-children');
    if (videoInfoChildren) {
      videoInfoChildren.style.display = _s?.blockVideoInfo ? 'block' : 'none';
    }

    _searchPrevCollapsed = null;
    updateAccordionBadges(_s);
    return;
  }

  // Save previous collapsed state on first keystroke
  if (!_searchPrevCollapsed) {
    _searchPrevCollapsed = {};
    for (const sec of ACCORDION_SECTIONS) {
      const secEl = $(`sec-${sec}`);
      if (secEl) {
        _searchPrevCollapsed[sec] = secEl.classList.contains('collapsed');
      }
    }
  }

  const queryTerms = q.split(/\s+/).filter(Boolean);
  let totalMatches = 0;

  for (const sec of ACCORDION_SECTIONS) {
    const secEl = $(`sec-${sec}`);
    const body = $(`sec-${sec}-body`);
    if (!secEl || !body) continue;

    let secMatches = 0;
    const regularRows = body.querySelectorAll('.row:not(.sub)');
    const subRows = body.querySelectorAll('.row.sub');
    const videoInfoChildren = $('video-info-children');
    const videoInfoRow = $('toggle-blockVideoInfo')?.closest('.row');

    // Helper to evaluate row match against all query tokens
    const checkRowMatch = (row) => {
      const chk = row.querySelector('input.chk');
      const key = chk?.id?.replace(/^toggle-/, '') || '';
      const text = row.querySelector('.row-text')?.textContent || '';
      const desc = row.querySelector('.row-desc')?.textContent || '';
      const aliases = (key && SEARCH_ALIASES[key]) ? SEARCH_ALIASES[key] : '';
      const isSub = row.classList.contains('sub');
      const parentContext = isSub ? 'video info panel metadata ' : '';
      const combined = (text + ' ' + desc + ' ' + aliases + ' ' + parentContext).toLowerCase();

      return queryTerms.every(term => combined.includes(term));
    };

    // Evaluate regular rows
    regularRows.forEach(row => {
      if (row === videoInfoRow) return;

      if (checkRowMatch(row)) {
        row.style.display = 'flex';
        secMatches++;
        totalMatches++;
      } else {
        row.style.display = 'none';
      }
    });

    // Handle video info parent + sub-rows coordination in sec-video
    if (sec === 'video') {
      let anySubMatches = false;
      subRows.forEach(subRow => {
        if (checkRowMatch(subRow)) {
          subRow.style.display = 'flex';
          anySubMatches = true;
          secMatches++;
          totalMatches++;
        } else {
          subRow.style.display = 'none';
        }
      });

      const parentMatches = videoInfoRow ? checkRowMatch(videoInfoRow) : false;

      if (anySubMatches) {
        // A sub-toggle (e.g. "Description") matched!
        // Show video-info-children container AND show the parent row for context & tree rail
        if (videoInfoChildren) videoInfoChildren.style.display = 'block';
        if (videoInfoRow) videoInfoRow.style.display = 'flex';
        if (parentMatches) {
          secMatches++;
          totalMatches++;
        }
      } else if (parentMatches) {
        // Parent matched (e.g. "video info"), show parent AND open drawer with all sub-toggles
        if (videoInfoRow) videoInfoRow.style.display = 'flex';
        if (videoInfoChildren) videoInfoChildren.style.display = 'block';
        subRows.forEach(subRow => {
          subRow.style.display = 'flex';
        });
        secMatches++;
        totalMatches++;
      } else {
        // Neither parent nor sub-rows matched
        if (videoInfoRow) videoInfoRow.style.display = 'none';
        if (videoInfoChildren) videoInfoChildren.style.display = 'none';
      }
    }

    if (secMatches > 0) {
      secEl.style.display = '';
      secEl.classList.remove('collapsed');
      const btn = secEl.querySelector('.sh-btn');
      btn?.setAttribute('aria-expanded', 'true');
    } else {
      secEl.style.display = 'none';
    }
  }

  if (noResultsEl) noResultsEl.style.display = totalMatches === 0 ? 'flex' : 'none';
  if (detailedHeader) detailedHeader.style.display = totalMatches === 0 ? 'none' : 'flex';
}

/* ── Tab Management ──────────────────────────────────── */

async function switchTab(tabName) {
  _activeTab = tabName;
  document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-tab') === tabName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('#scroll .tab-panel').forEach(panel => {
    const isActive = panel.id === `panel-${tabName}`;
    panel.classList.toggle('active', isActive);
  });

  try {
    await browser.storage.local.set({ activeTab: tabName });
  } catch (err) {
    console.warn('[IYT] Failed to save activeTab:', err);
  }
}

let _toastTimeout = null;
function showToast(message, durationMs = 3200) {
  const toast = $('iyt-toast');
  const msgEl = $('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('toast-hide');
  toast.style.display = 'flex';

  // Force reflow for CSS transition
  void toast.offsetWidth;
  toast.classList.add('toast-show');

  if (_toastTimeout) clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => {
      toast.style.display = 'none';
      toast.classList.remove('toast-hide');
    }, 220);
  }, durationMs);
}

/* ── Focus Lock Mechanics ────────────────────────────── */

function isFocusLockActive() {
  return !!(_s && _s.focusLock && _s.focusLock.enabled && _s.focusLock.pin);
}

function showPinModal(type, settingLabel = '') {
  if (type === 'setup') {
    $('input-setup-pin').value = '';
    $('input-setup-pin-confirm').value = '';
    $('setup-pin-error').style.display = 'none';
    $('modal-pin-setup').style.display = 'flex';
    setTimeout(() => $('input-setup-pin').focus(), 50);
  } else if (type === 'verify') {
    $('input-verify-pin').value = '';
    $('verify-pin-error').style.display = 'none';
    const targetWrap = $('verify-target-wrap');
    const targetName = $('verify-target-name');
    if (targetWrap && targetName) {
      if (settingLabel) {
        targetName.textContent = settingLabel;
        targetWrap.style.display = 'inline-flex';
      } else {
        targetWrap.style.display = 'none';
      }
    }
    $('modal-pin-verify').style.display = 'flex';
    setTimeout(() => $('input-verify-pin').focus(), 50);
  }
}

function hidePinModals() {
  $('modal-pin-setup').style.display = 'none';
  $('modal-pin-verify').style.display = 'none';
  _pendingVerificationCallback = null;
}

function promptForPinVerification(onSuccess, settingLabel = '') {
  _pendingVerificationCallback = onSuccess;
  showPinModal('verify', settingLabel);
}

/**
 * Intercept a setting change if Focus Lock is active.
 * If Focus Lock is enabled:
 * - Prompts for PIN.
 * - On success, writes to focusLock.pendingUnlock and starts cooldown.
 * - If not enabled, executes directCallback immediately.
 */
async function interceptSettingChange(settingKey, targetValue, revertFn, directCallback) {
  if (!isFocusLockActive()) {
    return directCallback();
  }

  // Focus Lock is active: check if another unlock is currently pending
  if (_s.focusLock.pendingUnlock) {
    showToast(t('focus_lock_already_pending') || 'An unlock countdown is already active. Cancel it before unlocking another setting.');
    const banner = $('focus-lock-banner');
    if (banner) {
      banner.classList.add('banner-pulse');
      setTimeout(() => banner.classList.remove('banner-pulse'), 1200);
    }
    if (revertFn) revertFn();
    return;
  }

  // Revert the UI control temporarily until unlock completes
  if (revertFn) revertFn();

  const friendlyLabel = getSettingFriendlyName(settingKey);

  promptForPinVerification(async () => {
    const cooldownMin = _s.focusLock.cooldownMinutes || 10;
    const now = Date.now();
    const unlocksAt = now + cooldownMin * 60 * 1000;

    const pendingUnlock = {
      settingKey,
      targetValue,
      friendlyLabel,
      requestedAt: now,
      unlocksAt
    };

    await StorageManager.updateNestedSetting('focusLock', 'pendingUnlock', pendingUnlock);
    if (_s.focusLock) _s.focusLock.pendingUnlock = pendingUnlock;
    renderPendingUnlockBanner();
    showToast(`Cooldown started (${cooldownMin}m delay)`);
  }, friendlyLabel);
}

async function applyPendingUnlock(pendingUnlock) {
  const { settingKey, targetValue } = pendingUnlock;

  try {
    if (settingKey === 'focusLock.enabled') {
      await StorageManager.updateNestedSetting('focusLock', 'enabled', targetValue);
    } else if (settingKey === 'dailyLimit.enabled') {
      await StorageManager.updateNestedSetting('dailyLimit', 'enabled', targetValue);
    } else if (settingKey === 'softReminder.enabled') {
      await StorageManager.updateNestedSetting('softReminder', 'enabled', targetValue);
    } else if (settingKey === 'scheduledBlocking.enabled') {
      await StorageManager.updateNestedSetting('scheduledBlocking', 'enabled', targetValue);
    } else if (settingKey.startsWith('schedule.toggle:')) {
      const id = settingKey.split(':')[1];
      const schedules = [...(_s.scheduledBlocking?.schedules || [])];
      const target = schedules.find(x => x.id === id);
      if (target) {
        target.enabled = targetValue;
        await StorageManager.updateSetting('scheduledBlocking', {
          ..._s.scheduledBlocking,
          schedules
        });
      }
    } else if (settingKey.startsWith('schedule.delete:')) {
      const id = settingKey.split(':')[1];
      const schedules = (_s.scheduledBlocking?.schedules || []).filter(x => x.id !== id);
      await StorageManager.updateSetting('scheduledBlocking', {
        ..._s.scheduledBlocking,
        schedules
      });
    } else if (settingKey.startsWith('preset:')) {
      const pName = settingKey.split(':')[1];
      const preset = PRESET_DEFINITIONS[pName];
      if (preset) {
        await StorageManager.updateSettings(preset);
      }
    } else if (settingKey === 'resetDefaults') {
      await StorageManager.resetToDefaults();
    } else if (settingKey === 'importSettings') {
      const fileInput = $('input-import-file');
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      }
    } else {
      await StorageManager.updateSetting(settingKey, targetValue);
    }
  } catch (err) {
    console.error('[IYT] Error applying pending unlock:', err);
  } finally {
    await StorageManager.updateNestedSetting('focusLock', 'pendingUnlock', null);
    if (_s?.focusLock) _s.focusLock.pendingUnlock = null;
    const fresh = await StorageManager.getSettings();
    broadcastSettingsToTabs(fresh);
    renderAll(fresh);
  }
}

function renderPendingUnlockBanner() {
  const banner = $('focus-lock-banner');
  const pending = _s?.focusLock?.pendingUnlock;

  if (!pending) {
    banner.style.display = 'none';
    if (_bannerInterval) {
      clearInterval(_bannerInterval);
      _bannerInterval = null;
    }
    return;
  }

  banner.style.display = 'flex';
  const friendlyLabel = pending.friendlyLabel || getSettingFriendlyName(pending.settingKey);
  $('focus-banner-setting').textContent = t('focus_lock_banner_unlocking', [friendlyLabel]) || `Unlocking: ${friendlyLabel}`;

  function updateTimer() {
    const remMs = pending.unlocksAt - Date.now();
    const remSecs = Math.max(0, Math.ceil(remMs / 1000));
    $('focus-banner-timer').textContent = fmtMmSs(remSecs);

    if (remSecs <= 0) {
      if (_bannerInterval) {
        clearInterval(_bannerInterval);
        _bannerInterval = null;
      }
      applyPendingUnlock(pending);
    }
  }

  updateTimer();
  if (!_bannerInterval) {
    _bannerInterval = setInterval(updateTimer, 1000);
  }
}

/* ── Snooze / Temporary Pause Mechanics ───────────────── */

let _snoozeCountdownInterval = null;

function updateSnoozeBanner(s) {
  const banner = $('snooze-banner');
  if (!banner) return;
  const isSnoozed = s && s.extensionEnabled !== false && !!(s.snoozeUntil && Date.now() < s.snoozeUntil);
  if (!isSnoozed) {
    banner.style.display = 'none';
    if (_snoozeCountdownInterval) {
      clearInterval(_snoozeCountdownInterval);
      _snoozeCountdownInterval = null;
    }
    if (s && s.snoozeUntil && Date.now() >= s.snoozeUntil) {
      cancelSnooze(true);
    }
    return;
  }

  banner.style.display = 'flex';
  const renderRemaining = () => {
    const remainingMs = Math.max(0, (s.snoozeUntil || 0) - Date.now());
    if (remainingMs <= 0) {
      banner.style.display = 'none';
      if (_snoozeCountdownInterval) {
        clearInterval(_snoozeCountdownInterval);
        _snoozeCountdownInterval = null;
      }
      cancelSnooze();
      return;
    }
    const totalSec = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const timerEl = $('snooze-banner-timer');
    if (timerEl) {
      timerEl.textContent = t('snooze_banner_remaining', [formatted], `${formatted} remaining`);
    }
  };

  renderRemaining();
  if (!_snoozeCountdownInterval) {
    _snoozeCountdownInterval = setInterval(renderRemaining, 1000);
  }
}

function openSnoozeModal() {
  const modal = $('modal-snooze');
  if (modal) modal.style.display = 'flex';
}

function closeSnoozeModal() {
  const modal = $('modal-snooze');
  if (modal) modal.style.display = 'none';
}

async function handleSnoozeSelection(minutes) {
  closeSnoozeModal();
  if (isFocusLockActive()) {
    promptForPinVerification(async () => {
      await executeSnooze(minutes);
    }, t('action_snooze') || 'Snooze Protections');
  } else {
    await executeSnooze(minutes);
  }
}

async function executeSnooze(minutes) {
  const snoozeUntil = Date.now() + minutes * 60 * 1000;
  await StorageManager.updateSetting('snoozeUntil', snoozeUntil);
  if (_s) _s.snoozeUntil = snoozeUntil;
  broadcastSettingsToTabs(_s);
  renderAll(_s);
  showToast(t('snooze_activated', [String(minutes)]) || `Protections paused for ${minutes} minutes`);
}

async function cancelSnooze(silent = false) {
  await StorageManager.updateSetting('snoozeUntil', null);
  if (_s) _s.snoozeUntil = null;
  broadcastSettingsToTabs(_s);
  renderAll(_s);
  if (!silent) {
    showToast(t('snooze_resumed') || 'Protections resumed');
  }
}

/* ── Scheduled Blocking Form & Cards ─────────────────── */

function formatScheduleDays(days) {
  if (!days || days.length === 0) return '';
  if (days.length === 7) return t('schedule_days_all') || 'Every day';
  const isWeekdays = days.length === 5 && [1, 2, 3, 4, 5].every(d => days.includes(d));
  if (isWeekdays) return t('schedule_days_weekdays') || 'Mon-Fri';
  const isWeekends = days.length === 2 && days.includes(0) && days.includes(6);
  if (isWeekends) return t('schedule_days_weekends') || 'Sun, Sat';

  const dayNames = {
    0: t('day_sun') || 'Sun',
    1: t('day_mon') || 'Mon',
    2: t('day_tue') || 'Tue',
    3: t('day_wed') || 'Wed',
    4: t('day_thu') || 'Thu',
    5: t('day_fri') || 'Fri',
    6: t('day_sat') || 'Sat'
  };
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return sorted.map(d => dayNames[d]).join(', ');
}

function renderSchedulesList(s) {
  const container = $('schedules-list');
  if (!container) return;
  container.innerHTML = '';

  const schedules = s.scheduledBlocking?.schedules || [];
  if (schedules.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'schedules-empty-card';
    empty.innerHTML = `
      <div class="schedules-empty-bubble">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div class="empty-text-wrap">
        <span class="empty-title">${escapeHtml(t('scheduled_blocking_no_schedules') || 'No active schedules')}</span>
        <span class="empty-subtitle">${escapeHtml(t('scheduled_blocking_empty_sub') || 'Automate distraction-free study blocks or quiet hours.')}</span>
      </div>
    `;
    container.appendChild(empty);
    return;
  }

  schedules.forEach(item => {
    const card = document.createElement('div');
    card.className = `schedule-card${item.enabled ? '' : ' schedule-disabled'}`;

    const modeBadgeClass = item.mode === 'full' ? 'badge-full' : 'badge-strict';
    const modeBadgeText = item.mode === 'full'
      ? (t('tab_block') || 'Full Block')
      : (t('tab_focus') || 'Strict Focus');

    card.innerHTML = `
      <div class="schedule-card-top">
        <span class="schedule-card-label">${escapeHtml(item.label || 'Schedule')}</span>
        <input type="checkbox" class="chk schedule-card-toggle" ${item.enabled ? 'checked' : ''} data-id="${item.id}" />
      </div>
      <div class="schedule-card-middle">
        <span class="schedule-card-time-info">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>${escapeHtml(formatScheduleDays(item.days))} • ${escapeHtml(item.startTime)} – ${escapeHtml(item.endTime)}</span>
        </span>
        <span class="schedule-mode-badge ${modeBadgeClass}">${escapeHtml(modeBadgeText)}</span>
      </div>
      <div class="schedule-card-bottom">
        <button type="button" class="btn-card-action btn-edit" data-id="${item.id}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>${escapeHtml(t('schedule_card_edit') || 'Edit')}</span>
        </button>
        <button type="button" class="btn-card-action btn-delete" data-id="${item.id}">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>${escapeHtml(t('schedule_card_delete') || 'Delete')}</span>
        </button>
      </div>
    `;

    // Toggle individual schedule
    const toggle = card.querySelector('.schedule-card-toggle');
    toggle.addEventListener('change', async () => {
      const willEnable = toggle.checked;
      if (!willEnable && isFocusLockActive()) {
        interceptSettingChange(
          `schedule.toggle:${item.id}`,
          false,
          () => { toggle.checked = true; },
          async () => {
            await updateSingleScheduleEnabled(item.id, false);
          }
        );
      } else {
        await updateSingleScheduleEnabled(item.id, willEnable);
      }
    });

    // Edit schedule
    card.querySelector('.btn-edit').addEventListener('click', () => {
      openScheduleForm(item);
    });

    // Delete schedule
    card.querySelector('.btn-delete').addEventListener('click', () => {
      if (isFocusLockActive()) {
        interceptSettingChange(
          `schedule.delete:${item.id}`,
          null,
          null,
          async () => {
            await deleteSchedule(item.id);
          }
        );
      } else {
        deleteSchedule(item.id);
      }
    });

    container.appendChild(card);
  });
}

async function updateSingleScheduleEnabled(id, enabled) {
  const schedules = [...(_s?.scheduledBlocking?.schedules || [])];
  const sched = schedules.find(x => x.id === id);
  if (sched) {
    sched.enabled = enabled;
    await StorageManager.updateSetting('scheduledBlocking', {
      ..._s.scheduledBlocking,
      schedules
    });
    if (_s.scheduledBlocking) _s.scheduledBlocking.schedules = schedules;
    renderSchedulesList(_s);
  }
}

async function deleteSchedule(id) {
  const schedules = (_s?.scheduledBlocking?.schedules || []).filter(x => x.id !== id);
  await StorageManager.updateSetting('scheduledBlocking', {
    ..._s.scheduledBlocking,
    schedules
  });
  if (_s.scheduledBlocking) _s.scheduledBlocking.schedules = schedules;
  renderSchedulesList(_s);
}

function openScheduleForm(scheduleToEdit = null) {
  const formWrap = $('schedule-form-wrap');
  const title = $('schedule-form-title');
  const errorEl = $('schedule-form-error');
  errorEl.style.display = 'none';

  if (scheduleToEdit) {
    title.textContent = t('schedule_form_title_edit') || 'Edit Schedule';
    $('schedule-edit-id').value = scheduleToEdit.id;
    $('schedule-input-label').value = scheduleToEdit.label || '';
    $('schedule-input-start').value = scheduleToEdit.startTime || '09:00';
    $('schedule-input-end').value = scheduleToEdit.endTime || '17:00';

    const radios = document.getElementsByName('schedule-mode');
    radios.forEach(r => { r.checked = (r.value === scheduleToEdit.mode); });

    document.querySelectorAll('#schedule-day-chips .day-chip').forEach(chip => {
      const d = parseInt(chip.getAttribute('data-day'), 10);
      chip.classList.toggle('active', (scheduleToEdit.days || []).includes(d));
    });
  } else {
    title.textContent = t('schedule_form_title_add') || 'New Schedule';
    $('schedule-edit-id').value = '';
    $('schedule-input-label').value = '';
    $('schedule-input-start').value = '09:00';
    $('schedule-input-end').value = '17:00';

    const radios = document.getElementsByName('schedule-mode');
    if (radios.length > 0) radios[0].checked = true;

    // Default weekdays
    document.querySelectorAll('#schedule-day-chips .day-chip').forEach(chip => {
      const d = parseInt(chip.getAttribute('data-day'), 10);
      chip.classList.toggle('active', [1, 2, 3, 4, 5].includes(d));
    });
  }

  formWrap.style.display = 'flex';
  $('schedule-input-label').focus();
}

function closeScheduleForm() {
  $('schedule-form-wrap').style.display = 'none';
  $('schedule-edit-id').value = '';
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Master Render ───────────────────────────────────── */

function renderAll(s) {
  _s = s;

  // Simple toggles
  for (const key of TOGGLES) {
    const el = $(`toggle-${key}`);
    if (el) el.checked = !!s[key];
  }

  const on = s.extensionEnabled !== false;
  const isSnoozed = on && !!(s.snoozeUntil && Date.now() < s.snoozeUntil);
  document.body.classList.toggle('ext-off', !on);
  document.body.classList.toggle('ext-snoozed', isSnoozed);
  const badge = $('ext-badge');
  if (badge) {
    if (isSnoozed) {
      badge.textContent = t('status_snoozed') || 'Snoozed';
    } else {
      badge.textContent = on ? (t('status_active') || 'Active') : (t('status_paused') || 'Paused');
    }
  }
  updateSnoozeBanner(s);

  const searchInput = $('input-toggle-search');
  if (searchInput?.value?.trim()) {
    filterToggles(searchInput.value);
  } else {
    $('video-info-children').style.display = s.blockVideoInfo ? 'block' : 'none';
  }

  // Soft reminder
  const softMin = s.softReminder?.intervalMinutes || 30;
  $('toggle-softReminder').checked = !!s.softReminder?.enabled;
  $('soft-reminder-expand').classList.toggle('open', !!s.softReminder?.enabled);

  if (_softCustomMode) {
    $('select-softReminderInterval').value = 'custom';
    $('soft-reminder-custom-wrap').style.display = 'inline-flex';
    if (document.activeElement !== $('input-softReminderCustom')) {
      $('input-softReminderCustom').value = softMin;
    }
  } else {
    $('select-softReminderInterval').value = String(softMin);
    $('soft-reminder-custom-wrap').style.display = 'none';
  }

  // Daily limit
  const dailyMin = s.dailyLimit?.limitMinutes || 60;
  $('toggle-dailyLimit').checked = !!s.dailyLimit?.enabled;
  $('daily-limit-expand').classList.toggle('open', !!s.dailyLimit?.enabled);

  if (_dailyCustomMode) {
    $('select-dailyLimitMinutes').value = 'custom';
    $('daily-limit-custom-wrap').style.display = 'inline-flex';
    if (document.activeElement !== $('input-dailyLimitCustom')) {
      $('input-dailyLimitCustom').value = dailyMin;
    }
  } else {
    $('select-dailyLimitMinutes').value = String(dailyMin);
    $('daily-limit-custom-wrap').style.display = 'none';
  }

  // Focus Lock
  const focusLockEnabled = !!s.focusLock?.enabled;
  $('toggle-focusLockEnabled').checked = focusLockEnabled;
  $('focus-lock-config-wrap').style.display = focusLockEnabled ? 'block' : 'none';
  $('select-focusLockCooldown').value = String(s.focusLock?.cooldownMinutes || 10);

  // Scheduled Blocking
  $('toggle-scheduledBlockingEnabled').checked = !!s.scheduledBlocking?.enabled;
  renderSchedulesList(s);

  // Relocated Language selector
  const langSel = $('select-userLanguage');
  if (langSel) {
    langSel.value = s.userLanguage || 'auto';
  }

  // Appearance Theme selector
  const themeSel = $('select-themeMode');
  if (themeSel) {
    themeSel.value = s.themeMode || 'auto';
  }
  applyTheme(s.themeMode || 'auto');

  // Pending Unlock Banner
  renderPendingUnlockBanner();

  // Stats
  renderStats(s);

  // Preset UI update
  updatePresetUI(s);

  // Accordion Badges
  updateAccordionBadges(s);

  // Focus Cards Badges
  updateFocusCardBadges(s);
}

function renderStats(s) {
  const secs = s.stats?.todayWatchSeconds || 0;
  const timeFormatted = fmtTime(secs);

  const statsTimeEl = $('stats-time');
  if (statsTimeEl) statsTimeEl.textContent = timeFormatted;

  const panelTimeEl = $('stats-panel-time');
  if (panelTimeEl) panelTimeEl.textContent = timeFormatted;

  const panelStatusEl = $('stats-panel-status');
  const progWrap = $('watch-prog-wrap');
  const progEl = $('prog-fill');
  const limitLabelEl = $('stats-limit-label');

  if (s.dailyLimit?.enabled) {
    const limitMin = s.dailyLimit.limitMinutes || 60;
    const pct = Math.min(100, Math.round((secs / (limitMin * 60)) * 100));

    if (progWrap) progWrap.style.display = 'block';
    if (progEl) {
      progEl.style.width = `${pct}%`;
      progEl.classList.toggle('prog-warning', pct >= 80 && pct < 100);
      progEl.classList.toggle('prog-danger', pct >= 100);
    }
    if (limitLabelEl) {
      limitLabelEl.textContent = t('stats_limit_progress', [String(pct), String(limitMin)]) || `${pct}% of ${limitMin}m`;
      limitLabelEl.classList.remove('limit-unrestricted');
      limitLabelEl.title = `${limitMin} minute daily limit`;
    }
    if (panelStatusEl) {
      panelStatusEl.textContent = `${pct}% of ${limitMin} min limit used today`;
      panelStatusEl.classList.toggle('status-warning', pct >= 80);
    }
  } else {
    // When no daily limit is active, hide the arbitrary progress bar
    if (progWrap) progWrap.style.display = 'none';
    if (progEl) {
      progEl.style.width = '0%';
      progEl.classList.remove('prog-warning', 'prog-danger');
    }
    if (limitLabelEl) {
      limitLabelEl.textContent = t('stats_no_limit') || 'No Limit';
      limitLabelEl.classList.add('limit-unrestricted');
      limitLabelEl.title = 'Click to set a daily limit';
    }
    if (panelStatusEl) {
      panelStatusEl.textContent = 'No daily limit active (unrestricted)';
      panelStatusEl.classList.remove('status-warning');
    }
  }
}

async function broadcastSettingsToTabs(settings) {
  try {
    if (browser && browser.tabs && typeof browser.tabs.query === 'function') {
      const tabs = await browser.tabs.query({ url: ['*://*.youtube.com/*', '*://m.youtube.com/*'] });
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { type: 'IYT_APPLY_SETTINGS', settings }).catch(() => {});
        }
      }
    }
  } catch (e) {}
}

/* ── Event Bindings ──────────────────────────────────── */

function bindAll() {
  // Tab Bar navigation
  document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchTab(tab);
    });
  });

  // Block tab accordion section header buttons
  for (const sec of ACCORDION_SECTIONS) {
    const secEl = $(`sec-${sec}`);
    const btn = secEl?.querySelector('.sh-btn');
    if (btn) {
      btn.addEventListener('click', () => toggleAccordion(sec));
    }
  }

  // Toggle all accordions (Collapse All / Expand All)
  const btnToggleAll = $('btn-toggle-all-accordions');
  if (btnToggleAll) {
    btnToggleAll.addEventListener('click', toggleAllAccordions);
  }

  // Focus tab modular feature card collapse/expand
  document.querySelectorAll('.focus-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const cardName = header.getAttribute('data-card');
      if (cardName) toggleFocusCard(cardName);
    });
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const cardName = header.getAttribute('data-card');
        if (cardName) toggleFocusCard(cardName);
      }
    });
  });

  // Pending Unlock banner cancel
  $('btn-cancel-unlock').addEventListener('click', async () => {
    await StorageManager.updateNestedSetting('focusLock', 'pendingUnlock', null);
    if (_s?.focusLock) _s.focusLock.pendingUnlock = null;
    renderPendingUnlockBanner();
  });

  // 1st-Run Welcome Card dismiss
  $('btn-dismiss-welcome')?.addEventListener('click', dismissWelcomeCard);

  // Snooze Button, Modal & Banner actions
  $('btn-snooze')?.addEventListener('click', openSnoozeModal);
  $('btn-cancel-snooze')?.addEventListener('click', closeSnoozeModal);
  $('btn-resume-snooze')?.addEventListener('click', cancelSnooze);
  document.querySelectorAll('.snooze-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mins = parseInt(btn.getAttribute('data-minutes'), 10) || 15;
      handleSnoozeSelection(mins);
    });
  });
  $('modal-snooze')?.addEventListener('click', (e) => {
    if (e.target === $('modal-snooze')) closeSnoozeModal();
  });

  // Quick Search Bar in Distractions Tab
  const searchInput = $('input-toggle-search');
  const clearBtn = $('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', e => {
      filterToggles(e.target.value);
    });

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filterToggles('');
        searchInput.blur();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        filterToggles('');
        searchInput.focus();
      }
    });
  }

  // Quick Modes Preset dropdown
  const selectPreset = $('select-preset');
  if (selectPreset) {
    selectPreset.addEventListener('change', (e) => {
      applyPreset(e.target.value);
    });
  }

  // Quick Modes Preset chips
  ['balanced', 'zen', 'player', 'custom'].forEach(p => {
    const chip = $(`chip-preset-${p}`);
    if (chip) {
      chip.addEventListener('click', () => applyPreset(p));
    }
  });

  // Simple distraction toggles
  for (const key of TOGGLES) {
    const el = $(`toggle-${key}`);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const targetVal = el.checked;
      const prevVal = !targetVal;

      // Turning protections OFF is intercepted if Focus Lock is active
      if (!targetVal && isFocusLockActive()) {
        await interceptSettingChange(
          key,
          false,
          () => { el.checked = true; },
          async () => {
            await StorageManager.updateSetting(key, false);
            if (_s) _s[key] = false;
            broadcastSettingsToTabs(_s);
            if (key === 'blockVideoInfo') {
              const searchInput = $('input-toggle-search');
              if (searchInput?.value?.trim()) {
                filterToggles(searchInput.value);
              } else {
                $('video-info-children').style.display = 'none';
              }
            }
            updateAccordionBadges(_s);
            updatePresetUI(_s);
          }
        );
      } else {
        await StorageManager.updateSetting(key, targetVal);
        if (_s) _s[key] = targetVal;

        // Mutual exclusivity between blockHomeFeed and limitHomeFeed
        if (key === 'limitHomeFeed' && targetVal) {
          const blockFeedEl = $('toggle-blockHomeFeed');
          if (blockFeedEl && blockFeedEl.checked) {
            blockFeedEl.checked = false;
            await StorageManager.updateSetting('blockHomeFeed', false);
            if (_s) _s.blockHomeFeed = false;
          }
        } else if (key === 'blockHomeFeed' && targetVal) {
          const limitFeedEl = $('toggle-limitHomeFeed');
          if (limitFeedEl && limitFeedEl.checked) {
            limitFeedEl.checked = false;
            await StorageManager.updateSetting('limitHomeFeed', false);
            if (_s) _s.limitHomeFeed = false;
          }
        }

        broadcastSettingsToTabs(_s);
        if (key === 'extensionEnabled') {
          document.body.classList.toggle('ext-off', !targetVal);
          const badge = $('ext-badge');
          if (badge) {
            badge.textContent = targetVal ? (t('status_active') || 'Active') : (t('status_paused') || 'Paused');
          }
        }
        if (key === 'blockVideoInfo') {
          const searchInput = $('input-toggle-search');
          if (searchInput?.value?.trim()) {
            filterToggles(searchInput.value);
          } else {
            $('video-info-children').style.display = targetVal ? 'block' : 'none';
          }
        }
        updateAccordionBadges(_s);
        updatePresetUI(_s);
      }
    });
  }

  // Nested: soft reminder
  $('toggle-softReminder').addEventListener('change', async e => {
    const targetVal = e.target.checked;
    if (!targetVal && isFocusLockActive()) {
      await interceptSettingChange(
        'softReminder.enabled',
        false,
        () => { e.target.checked = true; },
        async () => {
          await StorageManager.updateNestedSetting('softReminder', 'enabled', false);
          $('soft-reminder-expand').classList.remove('open');
        }
      );
    } else {
      await StorageManager.updateNestedSetting('softReminder', 'enabled', targetVal);
      $('soft-reminder-expand').classList.toggle('open', targetVal);
    }
  });

  $('select-softReminderInterval').addEventListener('change', async e => {
    if (e.target.value === 'custom') {
      _softCustomMode = true;
      $('soft-reminder-custom-wrap').style.display = 'inline-flex';
      const input = $('input-softReminderCustom');
      if (!input.value) {
        input.value = _s?.softReminder?.intervalMinutes || 30;
      }
      input.focus();
      input.select();
    } else {
      _softCustomMode = false;
      $('soft-reminder-custom-wrap').style.display = 'none';
      await StorageManager.updateNestedSetting('softReminder', 'intervalMinutes', Number(e.target.value));
    }
  });

  $('input-softReminderCustom').addEventListener('input', async e => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 1440) {
      await StorageManager.updateNestedSetting('softReminder', 'intervalMinutes', val);
    }
  });

  $('input-softReminderCustom').addEventListener('blur', async e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 1440) val = 1440;
    e.target.value = val;
    await StorageManager.updateNestedSetting('softReminder', 'intervalMinutes', val);
  });

  // Preview soft reminder toast on active YouTube tab
  const btnPreviewSoft = $('btn-preview-soft-reminder');
  if (btnPreviewSoft) {
    btnPreviewSoft.addEventListener('click', async () => {
      try {
        const softMin = _s?.softReminder?.intervalMinutes || 30;
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs && tabs[0];
        const isYt = activeTab?.url && (activeTab.url.includes('youtube.com') || activeTab.url.includes('youtu.be'));

        if (activeTab?.id && isYt) {
          await browser.tabs.sendMessage(activeTab.id, {
            type: 'IYT_PREVIEW_TOAST',
            minutes: softMin
          });
          const span = btnPreviewSoft.querySelector('span');
          const originalText = span ? span.textContent : 'Preview';
          if (span) span.textContent = t('btn_preview_sent') || 'Sent!';
          btnPreviewSoft.classList.add('is-sent');
          setTimeout(() => {
            if (span) span.textContent = originalText;
            btnPreviewSoft.classList.remove('is-sent');
          }, 1500);
        } else {
          showToast(t('toast_preview_need_yt') || 'Open a YouTube tab to preview the reminder toast');
        }
      } catch (e) {
        showToast(t('toast_preview_need_yt') || 'Open a YouTube tab to preview the reminder toast');
      }
    });
  }

  // Nested: daily limit
  $('toggle-dailyLimit').addEventListener('change', async e => {
    const targetVal = e.target.checked;
    if (!targetVal && isFocusLockActive()) {
      await interceptSettingChange(
        'dailyLimit.enabled',
        false,
        () => { e.target.checked = true; },
        async () => {
          await StorageManager.updateNestedSetting('dailyLimit', 'enabled', false);
          $('daily-limit-expand').classList.remove('open');
        }
      );
    } else {
      await StorageManager.updateNestedSetting('dailyLimit', 'enabled', targetVal);
      if (targetVal) {
        await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', false);
      }
      $('daily-limit-expand').classList.toggle('open', targetVal);
    }
  });

  $('select-dailyLimitMinutes').addEventListener('change', async e => {
    if (e.target.value === 'custom') {
      _dailyCustomMode = true;
      $('daily-limit-custom-wrap').style.display = 'inline-flex';
      const input = $('input-dailyLimitCustom');
      if (!input.value) {
        input.value = _s?.dailyLimit?.limitMinutes || 60;
      }
      input.focus();
      input.select();
    } else {
      _dailyCustomMode = false;
      $('daily-limit-custom-wrap').style.display = 'none';
      const val = Number(e.target.value);
      await StorageManager.updateNestedSetting('dailyLimit', 'limitMinutes', val);
      await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', false);
    }
  });

  $('input-dailyLimitCustom').addEventListener('input', async e => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0 && val <= 1440) {
      await StorageManager.updateNestedSetting('dailyLimit', 'limitMinutes', val);
      await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', false);
    }
  });

  $('input-dailyLimitCustom').addEventListener('blur', async e => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 1440) val = 1440;
    e.target.value = val;
    await StorageManager.updateNestedSetting('dailyLimit', 'limitMinutes', val);
    await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', false);
  });

  // Focus Lock toggle
  $('toggle-focusLockEnabled').addEventListener('change', async e => {
    const willEnable = e.target.checked;
    if (willEnable) {
      if (_s.focusLock?.pin) {
        await StorageManager.updateNestedSetting('focusLock', 'enabled', true);
        $('focus-lock-config-wrap').style.display = 'block';
      } else {
        e.target.checked = false;
        showPinModal('setup');
      }
    } else {
      // Disabling Focus Lock goes through PIN + cooldown flow!
      e.target.checked = true;
      await interceptSettingChange(
        'focusLock.enabled',
        false,
        () => { e.target.checked = true; },
        async () => {
          await StorageManager.updateNestedSetting('focusLock', 'enabled', false);
          $('focus-lock-config-wrap').style.display = 'none';
        }
      );
    }
  });

  // Focus Lock cooldown selector
  $('select-focusLockCooldown').addEventListener('change', async e => {
    const minutes = Number(e.target.value);
    await StorageManager.updateNestedSetting('focusLock', 'cooldownMinutes', minutes);
    if (_s?.focusLock) _s.focusLock.cooldownMinutes = minutes;
  });

  // Focus Lock PIN setup modal actions
  $('btn-save-setup-pin').addEventListener('click', async () => {
    const pin1 = $('input-setup-pin').value.trim();
    const pin2 = $('input-setup-pin-confirm').value.trim();
    const errorEl = $('setup-pin-error');

    if (pin1.length !== 4 || !/^\d{4}$/.test(pin1)) {
      errorEl.textContent = t('focus_lock_error_invalid_pin') || 'PIN must be exactly 4 digits.';
      errorEl.style.display = 'block';
      return;
    }
    if (pin1 !== pin2) {
      errorEl.textContent = t('focus_lock_error_mismatch') || 'PINs do not match. Please try again.';
      errorEl.style.display = 'block';
      return;
    }

    const hashed = await hashPin(pin1);
    await StorageManager.updateSetting('focusLock', {
      ..._s.focusLock,
      pin: hashed,
      enabled: true
    });

    hidePinModals();
    $('toggle-focusLockEnabled').checked = true;
    $('focus-lock-config-wrap').style.display = 'block';
  });

  $('btn-cancel-setup-pin').addEventListener('click', hidePinModals);

  // Focus Lock PIN verify modal actions
  const submitPinVerify = async () => {
    const pin = $('input-verify-pin').value.trim();
    const errorEl = $('verify-pin-error');

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      errorEl.textContent = t('focus_lock_error_invalid_pin') || 'PIN must be exactly 4 digits.';
      errorEl.style.display = 'block';
      return;
    }

    const hashed = await hashPin(pin);
    if (hashed !== _s.focusLock?.pin) {
      errorEl.textContent = t('focus_lock_error_incorrect_pin') || 'Incorrect PIN. Try again.';
      errorEl.style.display = 'block';
      $('input-verify-pin').value = '';
      $('input-verify-pin').focus();
      return;
    }

    const callback = _pendingVerificationCallback;
    hidePinModals();
    if (callback) callback();
  };

  $('btn-submit-verify-pin').addEventListener('click', submitPinVerify);

  // Auto-submit when user enters 4th digit
  $('input-verify-pin').addEventListener('input', e => {
    if (e.target.value.trim().length === 4) {
      submitPinVerify();
    }
  });

  // Enter to submit, Escape to cancel
  $('input-verify-pin').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      submitPinVerify();
    } else if (e.key === 'Escape') {
      hidePinModals();
    }
  });

  $('btn-cancel-verify-pin').addEventListener('click', hidePinModals);

  // Focus Lock PIN setup modal keyboard support
  $('input-setup-pin').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      $('input-setup-pin-confirm').focus();
    } else if (e.key === 'Escape') {
      hidePinModals();
    }
  });

  $('input-setup-pin-confirm').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      $('btn-save-setup-pin').click();
    } else if (e.key === 'Escape') {
      hidePinModals();
    }
  });

  // Scheduled Blocking master toggle
  $('toggle-scheduledBlockingEnabled').addEventListener('change', async e => {
    const willEnable = e.target.checked;
    if (!willEnable && isFocusLockActive()) {
      await interceptSettingChange(
        'scheduledBlocking.enabled',
        false,
        () => { e.target.checked = true; },
        async () => {
          await StorageManager.updateNestedSetting('scheduledBlocking', 'enabled', false);
        }
      );
    } else {
      await StorageManager.updateNestedSetting('scheduledBlocking', 'enabled', willEnable);
    }
  });

  // Scheduled Blocking inline form controls
  $('btn-add-schedule').addEventListener('click', () => openScheduleForm());
  $('btn-cancel-schedule').addEventListener('click', closeScheduleForm);

  document.querySelectorAll('#schedule-day-chips .day-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
    });
  });

  $('btn-save-schedule').addEventListener('click', async () => {
    const errorEl = $('schedule-form-error');
    errorEl.style.display = 'none';

    const label = $('schedule-input-label').value.trim();
    if (!label) {
      errorEl.textContent = t('schedule_validation_label') || 'Please enter a schedule label.';
      errorEl.style.display = 'block';
      return;
    }

    const activeDays = [];
    document.querySelectorAll('#schedule-day-chips .day-chip.active').forEach(chip => {
      activeDays.push(parseInt(chip.getAttribute('data-day'), 10));
    });

    if (activeDays.length === 0) {
      errorEl.textContent = t('schedule_validation_days') || 'Please select at least one day.';
      errorEl.style.display = 'block';
      return;
    }

    const startTime = $('schedule-input-start').value;
    const endTime = $('schedule-input-end').value;
    if (!startTime || !endTime) {
      errorEl.textContent = t('schedule_validation_times') || 'Please specify both start and end times.';
      errorEl.style.display = 'block';
      return;
    }

    let mode = 'full';
    document.getElementsByName('schedule-mode').forEach(r => {
      if (r.checked) mode = r.value;
    });

    const editId = $('schedule-edit-id').value;
    const schedules = [...(_s.scheduledBlocking?.schedules || [])];

    if (editId) {
      const existing = schedules.find(x => x.id === editId);
      if (existing) {
        existing.label = label;
        existing.days = activeDays;
        existing.startTime = startTime;
        existing.endTime = endTime;
        existing.mode = mode;
      }
    } else {
      const newId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      schedules.push({
        id: newId,
        label,
        days: activeDays,
        startTime,
        endTime,
        mode,
        enabled: true
      });
    }

    await StorageManager.updateSetting('scheduledBlocking', {
      ..._s.scheduledBlocking,
      schedules
    });
    if (_s.scheduledBlocking) _s.scheduledBlocking.schedules = schedules;

    closeScheduleForm();
    renderSchedulesList(_s);
  });

  // Stats reset with spinning icon animation
  const statsResetBtn = $('stats-reset');
  if (statsResetBtn) {
    statsResetBtn.addEventListener('click', async () => {
      const icon = statsResetBtn.querySelector('.watch-reset-icon');
      if (icon) {
        icon.classList.add('is-spinning');
        setTimeout(() => icon.classList.remove('is-spinning'), 500);
      }
      await StorageManager.resetDailyStats();
    });
  }

  // Watch bar capsule click -> navigate to Stats tab
  $('watch-capsule')?.addEventListener('click', () => {
    switchTab('stats');
  });

  // Watch bar unrestricted limit click -> navigate to Focus tab
  $('stats-limit-label')?.addEventListener('click', () => {
    if ($('stats-limit-label')?.classList.contains('limit-unrestricted')) {
      switchTab('focus');
    } else {
      switchTab('stats');
    }
  });

  // Appearance / Theme selector in Settings tab
  const themeSel = $('select-themeMode');
  if (themeSel) {
    themeSel.addEventListener('change', async e => {
      const selectedTheme = e.target.value;
      await StorageManager.updateSetting('themeMode', selectedTheme);
      if (_s) _s.themeMode = selectedTheme;
      applyTheme(selectedTheme);
    });
  }

  // Relocated Language selector in Settings tab
  const langSel = $('select-userLanguage');
  if (langSel) {
    langSel.addEventListener('change', async e => {
      const selectedLang = e.target.value;
      await StorageManager.updateSetting('userLanguage', selectedLang);
      if (_s) _s.userLanguage = selectedLang;
      if (typeof I18N !== 'undefined') {
        await I18N.setLanguage(selectedLang);
      }
      localizeDOM();
      if (_s) renderAll(_s);
    });
  }

  // Backup & Restore: Export Settings
  $('btn-export-settings')?.addEventListener('click', async () => {
    try {
      const current = await StorageManager.getSettings();
      const exportData = JSON.stringify(current, null, 2);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = StorageManager.getTodayString();
      a.href = url;
      a.download = `intentional-yt-settings-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('settings_exported') || 'Settings exported successfully');
    } catch (err) {
      console.error('[IYT] Export settings failed:', err);
    }
  });

  // Backup & Restore: Import Settings
  const triggerImportFile = () => {
    const fileInput = $('input-import-file');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  };

  $('btn-import-settings')?.addEventListener('click', () => {
    if (isFocusLockActive()) {
      interceptSettingChange(
        'importSettings',
        true,
        null,
        triggerImportFile
      );
    } else {
      triggerImportFile();
    }
  });

  $('input-import-file')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Invalid JSON format');
        }
        const merged = await StorageManager.importSettings(parsed);
        _s = merged;
        applyTheme(merged.themeMode || 'auto');
        if (merged.userLanguage && typeof I18N !== 'undefined') {
          await I18N.setLanguage(merged.userLanguage);
          localizeDOM();
        }
        broadcastSettingsToTabs(merged);
        renderAll(merged);
        showToast(t('settings_imported') || 'Settings imported successfully');
      } catch (err) {
        console.error('[IYT] Import settings failed:', err);
        showToast(t('settings_import_failed') || 'Failed to import settings: Invalid JSON file');
      }
    };
    reader.readAsText(file);
  });

  // Reset Defaults in-page confirmation modal
  let _confirmResetAction = null;
  function showConfirmResetModal(onConfirm) {
    _confirmResetAction = onConfirm;
    const modal = $('modal-confirm-reset');
    if (modal) modal.style.display = 'flex';
  }

  function hideConfirmResetModal() {
    const modal = $('modal-confirm-reset');
    if (modal) modal.style.display = 'none';
    _confirmResetAction = null;
  }

  $('btn-confirm-reset-ok')?.addEventListener('click', async () => {
    const action = _confirmResetAction;
    hideConfirmResetModal();
    if (action) await action();
  });

  $('btn-confirm-reset-cancel')?.addEventListener('click', hideConfirmResetModal);

  // Reset all settings to default in Settings tab
  $('btn-reset-defaults').addEventListener('click', () => {
    const doReset = async () => {
      await StorageManager.resetToDefaults();
      const fresh = await StorageManager.getSettings();
      broadcastSettingsToTabs(fresh);
      renderAll(fresh);
      showToast('All settings reset to default');
    };

    if (isFocusLockActive()) {
      interceptSettingChange(
        'resetDefaults',
        true,
        null,
        () => showConfirmResetModal(doReset)
      );
    } else {
      showConfirmResetModal(doReset);
    }
  });



  // Stats dashboard action buttons
  $('btn-stats-goto-focus')?.addEventListener('click', () => {
    switchTab('focus');
  });
  $('btn-stats-panel-reset')?.addEventListener('click', async () => {
    await StorageManager.resetDailyStats();
    showToast('Daily watch time reset');
  });

  // Backdrop click dismisses any active modal overlay
  document.querySelectorAll('.iyt-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        hidePinModals();
        hideConfirmResetModal();
      }
    });
  });

  // Global Escape key dismisses modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      hidePinModals();
      hideConfirmResetModal();
    }
  });

  // Live update when settings write while popup is open
  browser.storage.onChanged.addListener(async changes => {
    if (changes.settings?.newValue) {
      const newSettings = changes.settings.newValue;
      if (changes.settings.oldValue?.themeMode !== newSettings.themeMode) {
        applyTheme(newSettings.themeMode || 'auto');
      }
      if (changes.settings.oldValue?.userLanguage !== newSettings.userLanguage) {
        if (typeof I18N !== 'undefined') {
          await I18N.setLanguage(newSettings.userLanguage || 'auto');
        }
        localizeDOM();
      }
      renderAll(newSettings);
    }
  });
}

async function init() {
  const [s, storedTab, storedAccordions, storedWelcome, storedFocusCards] = await Promise.all([
    StorageManager.getSettings(),
    browser.storage.local.get('activeTab'),
    browser.storage.local.get('accordionCollapsed'),
    browser.storage.local.get('welcomeDismissed'),
    browser.storage.local.get('focusCardsCollapsed')
  ]);

  applyTheme(s.themeMode || 'auto');

  if (typeof I18N !== 'undefined') {
    await I18N.setLanguage(s.userLanguage || 'auto');
  }
  localizeDOM();

  const softPresets = ['15', '30', '45', '60', '90'];
  _softCustomMode = !softPresets.includes(String(s.softReminder?.intervalMinutes || 30));

  const dailyPresets = ['15', '30', '45', '60', '90', '120'];
  _dailyCustomMode = !dailyPresets.includes(String(s.dailyLimit?.limitMinutes || 60));

  restoreAccordionState(storedAccordions?.accordionCollapsed);
  restoreFocusCardState(storedFocusCards?.focusCardsCollapsed);
  renderAll(s);
  bindAll();

  // Show 1st-run welcome card if not dismissed yet
  if (!storedWelcome?.welcomeDismissed) {
    const welcomeCard = $('welcome-card');
    if (welcomeCard) welcomeCard.style.display = 'flex';
  }

  // Restore persisted active tab (default 'block')
  const initialTab = storedTab?.activeTab || 'block';
  switchTab(initialTab);
}

document.addEventListener('DOMContentLoaded', init);
