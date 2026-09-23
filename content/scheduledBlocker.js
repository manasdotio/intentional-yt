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

  function freezeMedia(el) {
    if (!el) return;
    try {
      el.muted = true;
      el.volume = 0;
      if (!el.paused) {
        el.pause();
      }
      el.removeAttribute('autoplay');
      el.currentTime = 0;
    } catch (e) {}
  }

  function freezeAllMedia() {
    document.querySelectorAll('video, audio').forEach(freezeMedia);
  }

  function pauseAllVideos() {
    freezeAllMedia();
  }

  // On-demand media freeze observer — only active when full block is displayed
  let _mediaObserverActive = false;
  const mediaObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
          freezeMedia(node);
        } else if (node.firstElementChild) {
          node.querySelectorAll('video, audio').forEach(freezeMedia);
        }
      }
    }
  });

  function onMediaIntercept(e) {
    if (html.classList.contains('iyt-scheduled-full-block')) {
      const target = e.target;
      if (target && (target.tagName === 'VIDEO' || target.tagName === 'AUDIO')) {
        freezeMedia(target);
      }
    }
  }

  function startMediaLock() {
    if (_mediaObserverActive) return;
    _mediaObserverActive = true;
    freezeAllMedia();
    mediaObserver.observe(html, { childList: true, subtree: true });
    window.addEventListener('play', onMediaIntercept, true);
    window.addEventListener('playing', onMediaIntercept, true);
  }

  function stopMediaLock() {
    if (!_mediaObserverActive) return;
    _mediaObserverActive = false;
    mediaObserver.disconnect();
    window.removeEventListener('play', onMediaIntercept, true);
    window.removeEventListener('playing', onMediaIntercept, true);
  }

  // 1. FAST-PATH: Synchronous restoration from sessionStorage on reload (0ms latency, zero delay/flash)
  try {
    const cachedMode = sessionStorage.getItem('iyt_scheduled_mode');
    if (cachedMode === 'full') {
      html.classList.add('iyt-scheduled-full-block');
      freezeAllMedia();
      const cachedEnd = sessionStorage.getItem('iyt_scheduled_end') || '';
      const cachedLabel = sessionStorage.getItem('iyt_scheduled_label') || '';
      showFullBlockOverlay({ endTime: cachedEnd, label: cachedLabel, mode: 'full' });
    } else if (cachedMode === 'strict') {
      applyStrictMode();
    }
  } catch (e) {}

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

  function showFullBlockOverlay(sched) {
    html.classList.add('iyt-scheduled-full-block');
    startMediaLock();

    let overlay = document.getElementById('iyt-scheduled-block-screen');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'iyt-scheduled-block-screen';
      const targetParent = document.body || html;
      targetParent.appendChild(overlay);
    }

    // Ensure overlay adopts document.body as parent once body is available
    if (document.body && overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    } else if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body && overlay.parentElement !== document.body) {
          document.body.appendChild(overlay);
        }
      }, { once: true });
    }

    let iconUrl = '';
    try {
      if (typeof browser !== 'undefined' && browser.runtime && typeof browser.runtime.getURL === 'function') {
        iconUrl = browser.runtime.getURL('icons/icon-128.png');
      } else if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
        iconUrl = chrome.runtime.getURL('icons/icon-128.png');
      }
    } catch (e) {
      iconUrl = '';
    }

    const titleText = getMsg('scheduled_block_title', null, 'YouTube is unavailable right now');
    const reopenText = getMsg('scheduled_block_reopens', [sched.endTime], `Reopens at ${sched.endTime}`);
    const commitmentText = getMsg('scheduled_block_commitment', null, 'This schedule is enforced by Intentional YT to protect your focus.');
    const labelText = sched.label || 'Scheduled Focus Block';

    overlay.innerHTML = `
      <div class="iyt-scheduled-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(titleText)}">
        <div class="iyt-scheduled-icon-wrap">
          <svg class="iyt-scheduled-icon-svg" viewBox="0 0 512 512" width="42" height="42" aria-label="Intentional YT" role="img">
            <defs>
              <linearGradient id="iytFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#60A5FA"/>
                <stop offset="100%" stop-color="#2563EB"/>
              </linearGradient>
              <linearGradient id="iytRed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FF334B"/>
                <stop offset="100%" stop-color="#E11D48"/>
              </linearGradient>
            </defs>
            <circle cx="256" cy="256" r="210" fill="none" stroke="#2563EB" stroke-width="26"/>
            <path d="M 256 46 A 210 210 0 0 1 466 256" fill="none" stroke="url(#iytFocusGrad)" stroke-width="30" stroke-linecap="round"/>
            <line x1="256" y1="28" x2="256" y2="64" stroke="#60A5FA" stroke-width="14" stroke-linecap="round"/>
            <line x1="256" y1="448" x2="256" y2="484" stroke="#2563EB" stroke-width="14" stroke-linecap="round"/>
            <line x1="28" y1="256" x2="64" y2="256" stroke="#60A5FA" stroke-width="14" stroke-linecap="round"/>
            <line x1="448" y1="256" x2="484" y2="256" stroke="#2563EB" stroke-width="14" stroke-linecap="round"/>
            <path d="M 210 162 C 210 152 221 146 229 151 L 340 245 C 347 250 347 262 340 267 L 229 361 C 221 366 210 360 210 350 Z" fill="url(#ytRed)"/>
            <path d="M 226 186 C 226 180 233 176 238 180 L 316 250 C 321 254 321 262 316 266 L 238 336 C 233 340 226 336 226 330 Z" fill="#FFFFFF"/>
          </svg>
        </div>

        <h1 class="iyt-scheduled-title">${escapeHtml(titleText)}</h1>

        <div class="iyt-scheduled-meta">
          <span class="iyt-scheduled-pill">${escapeHtml(labelText)}</span>
          ${sched.endTime ? `<span class="iyt-scheduled-reopens">Reopens at ${escapeHtml(sched.endTime)}</span>` : ''}
        </div>

        <p class="iyt-scheduled-commitment">${escapeHtml(commitmentText)}</p>

        <div class="iyt-scheduled-actions">
          <button type="button" class="iyt-scheduled-btn-close" id="iyt-btn-close-tab">Close Tab</button>
          <button type="button" class="iyt-scheduled-btn-leave" id="iyt-btn-leave-yt">Blank Screen</button>
        </div>
      </div>
    `;

    const closeBtn = overlay.querySelector('#iyt-btn-close-tab');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          window.close();
        } catch (err) {}
        setTimeout(() => {
          try {
            window.location.replace('about:blank');
          } catch (e) {}
        }, 120);
      });
    }

    const leaveBtn = overlay.querySelector('#iyt-btn-leave-yt');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.replace('about:blank');
      });
    }

    pauseAllVideos();
  }

  function hideFullBlockOverlay() {
    stopMediaLock();
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
    try {
      sessionStorage.removeItem('iyt_scheduled_mode');
      sessionStorage.removeItem('iyt_scheduled_end');
      sessionStorage.removeItem('iyt_scheduled_label');
    } catch (e) {}
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
      try {
        sessionStorage.setItem('iyt_scheduled_mode', 'full');
        sessionStorage.setItem('iyt_scheduled_end', fullSchedule.endTime || '');
        sessionStorage.setItem('iyt_scheduled_label', fullSchedule.label || '');
      } catch (e) {}
      showFullBlockOverlay(fullSchedule);
      return;
    }

    // Otherwise strict mode applies
    const strictSchedule = activeList.find(s => s.mode === 'strict') || activeList[0];
    _currentSchedule = strictSchedule;
    try {
      sessionStorage.setItem('iyt_scheduled_mode', 'strict');
      sessionStorage.removeItem('iyt_scheduled_end');
      sessionStorage.removeItem('iyt_scheduled_label');
    } catch (e) {}
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

  // Initial evaluation immediately at document_start (0ms delay)
  evaluateSchedules();

  // Re-verify on DOMContentLoaded in case DOM nodes need moving or re-verification
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', evaluateSchedules, { once: true });
  }
})();
