/**
 * scheduledBlocker.js — Intentional YT v3
 * Enforces time-based scheduled blocking rules (full commitment overlay or strict protection mode).
 * Zero-dependency, run at document_start.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

(function () {
  const html = document.documentElement;
  let _currentSchedule = null;
  let _strictModeActive = false;
  let _intervalHandle = null;

  const ALL_BLOCK_CLASSES = [
    'iyt-no-home-feed',
    'iyt-no-sidebar',
    'iyt-no-recommended',
    'iyt-no-live-chat',
    'iyt-no-playlist',
    'iyt-no-endscreen-wall',
    'iyt-no-endscreen-cards',
    'iyt-no-comments',
    'iyt-no-profile-photos',
    'iyt-no-mix-playlists',
    'iyt-no-merch',
    'iyt-no-video-info',
    'iyt-no-video-buttons',
    'iyt-no-channel-info',
    'iyt-no-video-desc',
    'iyt-no-top-header',
    'iyt-no-notif-bell',
    'iyt-no-irrelevant-search',
    'iyt-no-explore',
    'iyt-no-more-yt',
    'iyt-no-shorts',
    'iyt-no-subscriptions',
    'iyt-no-annotations',
    'iyt-no-thumbnails',
    'iyt-grayscale',
  ];

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function isScheduleActive(sched, now = new Date()) {
    if (!sched || !sched.enabled || !sched.days || !sched.startTime || !sched.endTime) {
      return false;
    }

    const day = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sh, sm] = sched.startTime.split(':').map(Number);
    const [eh, em] = sched.endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;

    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    // Normal same-day window (e.g. 09:00 to 17:00)
    if (startMins < endMins) {
      return sched.days.includes(day) && (currentMins >= startMins && currentMins < endMins);
    }

    // Overnight window (e.g. 22:00 to 06:00)
    if (startMins > endMins) {
      // Before midnight: today must be in active days
      if (sched.days.includes(day) && currentMins >= startMins) {
        return true;
      }
      // After midnight: yesterday must have been in active days
      const yesterday = (day + 6) % 7;
      if (sched.days.includes(yesterday) && currentMins < endMins) {
        return true;
      }
    }

    // Edge case: startMins === endMins (24hr block if current day matches)
    if (startMins === endMins) {
      return sched.days.includes(day);
    }

    return false;
  }

  function pauseAllVideos() {
    document.querySelectorAll('video').forEach(v => {
      try {
        if (!v.paused) v.pause();
      } catch (e) {}
    });
  }

  function showFullBlockOverlay(sched) {
    html.classList.add('iyt-scheduled-full-block');

    let overlay = document.getElementById('iyt-scheduled-block-screen');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'iyt-scheduled-block-screen';
      const targetParent = document.body || html;
      targetParent.appendChild(overlay);
    }

    const iconUrl = (browser.runtime && browser.runtime.getURL)
      ? browser.runtime.getURL('icons/icon-128.png')
      : '../icons/icon-128.png';

    const titleText = getMsg('scheduled_block_title', null, 'YouTube is unavailable right now');
    const reopenText = getMsg('scheduled_block_reopens', [sched.endTime], `Reopens at ${sched.endTime}`);
    const commitmentText = getMsg('scheduled_block_commitment', null, 'This schedule is enforced by Intentional YT to protect your focus.');
    const labelText = sched.label || 'Scheduled Block';

    overlay.innerHTML = `
      <div class="iyt-scheduled-card">
        <img src="${iconUrl}" alt="" class="iyt-scheduled-icon" />
        <h1 class="iyt-scheduled-title">${escapeHtml(titleText)}</h1>
        <span class="iyt-scheduled-label">${escapeHtml(labelText)}</span>
        <p class="iyt-scheduled-reopens">${escapeHtml(reopenText)}</p>
        <p class="iyt-scheduled-commitment">${escapeHtml(commitmentText)}</p>
      </div>
    `;

    pauseAllVideos();
  }

  function hideFullBlockOverlay() {
    html.classList.remove('iyt-scheduled-full-block');
    const overlay = document.getElementById('iyt-scheduled-block-screen');
    if (overlay) overlay.remove();
  }

  function applyStrictMode() {
    hideFullBlockOverlay();
    ALL_BLOCK_CLASSES.forEach(cls => html.classList.add(cls));
    _strictModeActive = true;
  }

  function restoreNormalSettings() {
    hideFullBlockOverlay();
    if (_strictModeActive) {
      _strictModeActive = false;
      if (window.__iytBlocker && typeof window.__iytBlocker.applyAllSettings === 'function') {
        window.__iytBlocker.applyAllSettings();
      }
    }
  }

  async function evaluateSchedules() {
    let settings;
    try {
      settings = await StorageManager.getSettings();
    } catch (e) {
      return;
    }

    if (!settings || !settings.extensionEnabled || !settings.scheduledBlocking?.enabled) {
      _currentSchedule = null;
      restoreNormalSettings();
      return;
    }

    const schedules = settings.scheduledBlocking.schedules || [];
    const now = new Date();

    // Find all active schedules
    const activeList = schedules.filter(s => isScheduleActive(s, now));

    if (activeList.length === 0) {
      _currentSchedule = null;
      restoreNormalSettings();
      return;
    }

    // If any active schedule is "full", full block takes precedence
    const fullSchedule = activeList.find(s => s.mode === 'full');
    if (fullSchedule) {
      _currentSchedule = fullSchedule;
      showFullBlockOverlay(fullSchedule);
      return;
    }

    // Otherwise strict mode applies
    const strictSchedule = activeList.find(s => s.mode === 'strict') || activeList[0];
    _currentSchedule = strictSchedule;
    applyStrictMode();
  }

  // Periodic check every 60 seconds
  _intervalHandle = setInterval(evaluateSchedules, 60000);

  // Storage listener for instantaneous response when schedules are added/edited/toggled
  browser.storage.onChanged.addListener(changes => {
    if (changes.settings) {
      evaluateSchedules();
    }
  });

  // Navigation listener
  document.addEventListener('yt-navigate-finish', evaluateSchedules);
  document.addEventListener('yt-page-data-updated', evaluateSchedules);
  window.addEventListener('popstate', evaluateSchedules);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluateSchedules, { once: true });
  } else {
    evaluateSchedules();
  }
})();
