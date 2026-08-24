/**
 * popup.js — Intentional YT v3
 */

'use strict';

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
  if (!secs || secs <= 0) return '0 min';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return `${s}s`;
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
  if (badge) { badge.textContent = on ? 'Active' : 'Paused'; }

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

  renderStats(s);
}

function renderStats(s) {
  const secs = s.stats?.todayWatchSeconds || 0;
  $('stats-time').textContent = fmtTime(secs);

  if (s.dailyLimit?.enabled) {
    const pct = Math.min(100, Math.round((secs / ((s.dailyLimit.limitMinutes || 60) * 60)) * 100));
    $('prog-fill').style.width = `${pct}%`;
    $('stats-limit-label').textContent = `${pct}% of ${s.dailyLimit.limitMinutes}m`;
  } else {
    const pct = Math.min(100, Math.round((secs / 7200) * 100));
    $('prog-fill').style.width = `${pct}%`;
    $('stats-limit-label').textContent = 'no limit';
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
        if (badge) badge.textContent = el.checked ? 'Active' : 'Paused';
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

  // Live update when timer writes while popup is open
  browser.storage.onChanged.addListener(changes => {
    if (changes.settings?.newValue) renderAll(changes.settings.newValue);
  });
}

async function init() {
  const s = await StorageManager.getSettings();
  const softPresets = ['15', '30', '45', '60', '90'];
  _softCustomMode = !softPresets.includes(String(s.softReminder?.intervalMinutes || 30));

  const dailyPresets = ['15', '30', '45', '60', '90', '120'];
  _dailyCustomMode = !dailyPresets.includes(String(s.dailyLimit?.limitMinutes || 60));

  renderAll(s);
  bindAll();
}

document.addEventListener('DOMContentLoaded', init);
