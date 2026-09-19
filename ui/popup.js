/**
 * popup.js — Intentional YT v3
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

const t = getMsg; // Alias so all existing calls to t() route through getMsg()

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
  'blockHomeFeed', 'blockSidebar', 'blockRecommended',
  'blockLiveChat', 'blockPlaylist', 'blockEndScreenVideowall',
  'blockEndScreenCards', 'blockComments', 'blockProfilePhotos',
  'blockMixPlaylists', 'blockMerch', 'blockVideoInfo',
  'blockVideoButtons', 'blockChannelInfo', 'blockVideoDescription',
  'blockTopHeader', 'blockNotificationBell', 'blockIrrelevantSearchResults',
  'blockExploreAndTrending', 'blockMoreFromYouTube', 'blockShorts',
  'blockSubscriptionsFeed', 'disableAutoplay', 'disableAnnotations',
  'hideThumbnails', 'grayscaleMode',
];

let _s = null;
let _softCustomMode = false;
let _dailyCustomMode = false;
const $ = id => document.getElementById(id);

function fmtTime(secs) {
  if (!secs || secs <= 0) return t('time_fmt_zero_min') || '0 min';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return t('time_fmt_hours_minutes', [String(h), String(m)]) || `${h}h ${m}m`;
  if (m > 0) return t('time_fmt_minutes', [String(m)]) || `${m} min`;
  return t('time_fmt_seconds', [String(s)]) || `${s}s`;
}

function renderAll(s) {
  _s = s;

  for (const key of TOGGLES) {
    const el = $(`toggle-${key}`);
    if (el) el.checked = !!s[key];
  }

  const on = s.extensionEnabled !== false;
  document.body.classList.toggle('ext-off', !on);
  const badge = $('ext-badge');
  if (badge) {
    badge.textContent = on ? (t('status_active') || 'Active') : (t('status_paused') || 'Paused');
  }

  $('video-info-children').style.display = s.blockVideoInfo ? 'block' : 'none';

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

  // Language selector
  const langSel = $('select-userLanguage');
  if (langSel) {
    langSel.value = s.userLanguage || 'auto';
  }

  renderStats(s);
}

function renderStats(s) {
  const secs = s.stats?.todayWatchSeconds || 0;
  $('stats-time').textContent = fmtTime(secs);

  if (s.dailyLimit?.enabled) {
    const limitMin = s.dailyLimit.limitMinutes || 60;
    const pct = Math.min(100, Math.round((secs / (limitMin * 60)) * 100));
    $('prog-fill').style.width = `${pct}%`;
    $('stats-limit-label').textContent = t('stats_limit_progress', [String(pct), String(limitMin)]) || `${pct}% of ${limitMin}m`;
  } else {
    const pct = Math.min(100, Math.round((secs / 7200) * 100));
    $('prog-fill').style.width = `${pct}%`;
    $('stats-limit-label').textContent = t('stats_no_limit') || 'no limit';
  }
}

function bindAll() {
  // Simple toggles
  for (const key of TOGGLES) {
    const el = $(`toggle-${key}`);
    if (!el) continue;
    el.addEventListener('change', async () => {
      await StorageManager.updateSetting(key, el.checked);
      if (_s) _s[key] = el.checked;
      if (key === 'extensionEnabled') {
        document.body.classList.toggle('ext-off', !el.checked);
        const badge = $('ext-badge');
        if (badge) {
          badge.textContent = el.checked ? (t('status_active') || 'Active') : (t('status_paused') || 'Paused');
        }
      }
      if (key === 'blockVideoInfo') {
        $('video-info-children').style.display = el.checked ? 'block' : 'none';
      }
    });
  }

  // Nested: soft reminder
  $('toggle-softReminder').addEventListener('change', async e => {
    await StorageManager.updateNestedSetting('softReminder', 'enabled', e.target.checked);
    $('soft-reminder-expand').classList.toggle('open', e.target.checked);
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

  // Nested: daily limit
  $('toggle-dailyLimit').addEventListener('change', async e => {
    await StorageManager.updateNestedSetting('dailyLimit', 'enabled', e.target.checked);
    if (e.target.checked) {
      await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', false);
    }
    $('daily-limit-expand').classList.toggle('open', e.target.checked);
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

  // Stats reset
  $('stats-reset').addEventListener('click', async () => {
    await StorageManager.resetDailyStats();
  });

  // Language selector
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

  // Live update when timer or settings write while popup is open
  browser.storage.onChanged.addListener(async changes => {
    if (changes.settings?.newValue) {
      const newSettings = changes.settings.newValue;
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
  const s = await StorageManager.getSettings();
  if (typeof I18N !== 'undefined') {
    await I18N.setLanguage(s.userLanguage || 'auto');
  }
  localizeDOM();

  const softPresets = ['15', '30', '45', '60', '90'];
  _softCustomMode = !softPresets.includes(String(s.softReminder?.intervalMinutes || 30));

  const dailyPresets = ['15', '30', '45', '60', '90', '120'];
  _dailyCustomMode = !dailyPresets.includes(String(s.dailyLimit?.limitMinutes || 60));

  renderAll(s);
  bindAll();
}

document.addEventListener('DOMContentLoaded', init);
