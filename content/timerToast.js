/**
 * timerToast.js — Intentional YT v3
 * Passive watch timer, soft reminder toast, and daily limit enforcement.
 * Attached per watch/video page by youtubeObserver.js.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;


const IYT_Timer = (() => {
  let _video = null;
  let _settings = null;
  let _sessionSeconds = 0;
  let _intervalHandle = null;
  let _batchAccumulator = 0;   // seconds accumulated since last storage write
  let _baseWatchSeconds = 0;   // todayWatchSeconds value in storage
  let _reminderIntervalCount = 0;
  let _limitOverlayActive = false;
  let _allowedVideoId = null;
  let _graceConsumedFor = null;

  function _findActiveVideo() {
    return document.querySelector('video.html5-main-video')
      || document.querySelector('#movie_player video')
      || document.querySelector('.html5-video-player video')
      || document.querySelector('ytd-watch-flexy video')
      || document.querySelector('ytd-player video')
      || document.querySelector('video');
  }

  function _getVideoId() {
    const p = window.location.pathname;
    if (p === '/watch') {
      return new URLSearchParams(window.location.search).get('v') || window.location.href;
    }
    if (p.startsWith('/shorts/')) {
      return p.split('/shorts/')[1]?.split(/[?#/]/)[0] || window.location.href;
    }
    return window.location.pathname + window.location.search;
  }

  function _canOfferFinishVideo() {
    if (window.location.pathname.startsWith('/live')) return false;
    if (!_video) return false;
    if (_video.ended) return false;
    if (_video.duration === Infinity) return false;

    // If the user already used "Finish this video" on this video and it ended, do not offer again
    if (_graceConsumedFor && _graceConsumedFor === _getVideoId()) return false;

    // Check if the video is already within 2 seconds of the end
    if (Number.isFinite(_video.duration) && _video.duration > 0) {
      const remSec = _video.duration - (_video.currentTime || 0);
      if (remSec <= 2) return false;
    }

    // Crucial: Only offer "Finish this video" if the user was actively watching this video
    // when the limit expired (session seconds > 0 or currentTime > 5), NOT when navigating
    // to a brand new video while the limit is already exhausted!
    const isMidWatch = _sessionSeconds > 0 || ((_video.currentTime || 0) > 5 && !_video.paused);
    return isMidWatch;
  }

  function _isLimitExceeded() {
    if (!_settings?.dailyLimit?.enabled) return false;
    if (_settings.stats?.limitDismissedToday) return false;
    if (_allowedVideoId && _allowedVideoId === _getVideoId()) return false;
    const limitMin = Number(_settings.dailyLimit.limitMinutes) || 60;
    const currentTotalSec = (_baseWatchSeconds || 0) + _batchAccumulator;
    return (currentTotalSec / 60) >= limitMin;
  }

  function _t(key, subs, fallback) {
    if (typeof I18N !== 'undefined' && I18N.getMessage) {
      return I18N.getMessage(key, subs, fallback);
    }
    try {
      if (browser && browser.i18n && typeof browser.i18n.getMessage === 'function') {
        const msg = browser.i18n.getMessage(key, subs);
        if (msg) return msg;
      }
    } catch (e) {}
    return fallback;
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────
  function _showToast(minutes) {
    document.getElementById('iyt-toast')?.remove();

    const toast = document.createElement('div');
    toast.id = 'iyt-toast';
    toast.className = 'iyt-toast-container';
    const dir = (typeof I18N !== 'undefined' && I18N.getDirection) ? I18N.getDirection() : 'ltr';
    toast.setAttribute('dir', dir);

    // Header: Icon + Badge + Close button
    const header = document.createElement('div');
    header.className = 'iyt-toast-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'iyt-toast-header-left';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'iyt-toast-icon-wrap';
    iconWrap.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

    const badge = document.createElement('span');
    badge.className = 'iyt-toast-badge';
    badge.textContent = _t('toast_reminder_badge', null, 'Gentle Reminder');

    headerLeft.appendChild(iconWrap);
    headerLeft.appendChild(badge);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'iyt-toast-close';
    closeBtn.setAttribute('aria-label', _t('toast_dismiss_aria', null, 'Dismiss'));
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    // Body Message
    const msgSpan = document.createElement('div');
    msgSpan.className = 'iyt-toast-message';
    const msgText = minutes === 1
      ? _t('toast_reminder_message_singular', null, "You've been watching for 1 minute.")
      : _t('toast_reminder_message', [String(minutes)], `You've been watching for ${minutes} minutes.`);
    msgSpan.textContent = msgText;

    // Action Buttons Row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'iyt-toast-actions';

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'iyt-toast-btn iyt-toast-btn-pause';
    pauseBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg><span>' + _t('toast_button_pause', null, 'Pause Video') + '</span>';

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'iyt-toast-btn iyt-toast-btn-dismiss';
    dismissBtn.textContent = _t('toast_button_continue', null, 'Keep Watching');

    actionsRow.appendChild(pauseBtn);
    actionsRow.appendChild(dismissBtn);

    // 6-second countdown progress bar
    const progressTrack = document.createElement('div');
    progressTrack.className = 'iyt-toast-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'iyt-toast-progress-bar';
    progressTrack.appendChild(progressBar);

    toast.appendChild(header);
    toast.appendChild(msgSpan);
    toast.appendChild(actionsRow);
    toast.appendChild(progressTrack);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('iyt-toast-show'));
    });

    let dismissed = false;
    let autoDismissTimer = null;
    let remainingMs = 6000;
    let timerStartedAt = Date.now();

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      toast.classList.remove('iyt-toast-show');
      setTimeout(() => toast.remove(), 350);
    }

    function startTimer(duration) {
      timerStartedAt = Date.now();
      remainingMs = duration;
      autoDismissTimer = setTimeout(dismiss, duration);
    }

    function pauseTimer() {
      if (dismissed || !autoDismissTimer) return;
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
      const elapsed = Date.now() - timerStartedAt;
      remainingMs = Math.max(0, remainingMs - elapsed);
    }

    function resumeTimer() {
      if (dismissed || autoDismissTimer || remainingMs <= 0) return;
      startTimer(remainingMs);
    }

    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });

    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });

    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!_video) _video = _findActiveVideo();
      if (_video && !_video.paused) {
        _video.pause();
      }
      pauseBtn.classList.add('is-paused');
      pauseBtn.innerHTML = '<span>' + _t('toast_status_paused', null, 'Paused ✓') + '</span>';
      setTimeout(dismiss, 1200);
    });

    startTimer(6000);
  }

  // ─── Daily Limit Overlay ───────────────────────────────────────────────────
  function _showLimitOverlay() {
    if (_limitOverlayActive && document.getElementById('iyt-limit-overlay')) return;

    let playerEl = document.querySelector('#movie_player')
      || document.querySelector('.html5-video-player')
      || document.querySelector('ytd-player')
      || (_video ? _video.closest('.html5-video-player') : null)
      || (_video ? _video.parentElement : null);

    if (!playerEl) {
      playerEl = document.querySelector('#player') || document.querySelector('ytd-watch-flexy') || document.body;
    }
    if (!playerEl) return;

    if (getComputedStyle(playerEl).position === 'static') {
      playerEl.style.position = 'relative';
    }

    document.getElementById('iyt-limit-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'iyt-limit-overlay';
    overlay.className = 'iy-limit-overlay';
    const dir = (typeof I18N !== 'undefined' && I18N.getDirection) ? I18N.getDirection() : 'ltr';
    overlay.setAttribute('dir', dir);

    const limitMin = _settings?.dailyLimit?.limitMinutes || 60;

    const icon = document.createElement('div');
    icon.className = 'iy-limit-icon';
    icon.textContent = '⏳';

    const title = document.createElement('h2');
    title.className = 'iy-limit-title';
    title.textContent = _t('overlay_limit_title', null, 'Daily Limit Reached');

    const p = document.createElement('p');
    p.className = 'iy-limit-message';
    p.textContent = _t('overlay_limit_message', [String(limitMin)], `You've reached your ${limitMin}-minute daily watch limit for YouTube today.`);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'iy-limit-btn-group';

    const canFinish = _canOfferFinishVideo();

    if (canFinish) {
      const finishBtn = document.createElement('button');
      finishBtn.className = 'iy-limit-button';
      let label = _t('overlay_button_finish_video', null, 'Finish this video');
      if (_video && Number.isFinite(_video.duration) && _video.duration > 0) {
        const remSec = Math.max(0, _video.duration - (_video.currentTime || 0));
        const remMin = Math.ceil(remSec / 60);
        if (remMin > 0) {
          label = _t('overlay_button_finish_video_remaining', [String(remMin)], `Finish this video (${remMin}m left)`);
        }
      }
      finishBtn.textContent = label;
      finishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _allowedVideoId = _getVideoId();
        overlay.remove();
        _limitOverlayActive = false;
        if (_video && _video.paused) {
          _video.play().catch(() => {});
        }
      });
      btnGroup.appendChild(finishBtn);
    }

    const stopBtn = document.createElement('button');
    stopBtn.className = canFinish ? 'iy-limit-button-secondary' : 'iy-limit-button';
    stopBtn.textContent = _t('overlay_button_stop_watching', null, 'Stop Watching (Go Home)');

    const overrideBtn = document.createElement('button');
    overrideBtn.className = 'iy-limit-button-secondary';
    overrideBtn.textContent = _t('overlay_button_dismiss_today', null, 'Dismiss for today');

    btnGroup.appendChild(stopBtn);
    btnGroup.appendChild(overrideBtn);

    overlay.appendChild(icon);
    overlay.appendChild(title);
    overlay.appendChild(p);
    overlay.appendChild(btnGroup);

    playerEl.appendChild(overlay);
    _limitOverlayActive = true;

    // Prevent clicks from penetrating through overlay to player
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _allowedVideoId = null;
      _video?.pause();
      window.location.href = 'https://www.youtube.com/';
    });

    overrideBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', true);
      if (_settings?.stats) _settings.stats.limitDismissedToday = true;
      _allowedVideoId = null;
      overlay.remove();
      _limitOverlayActive = false;
    });
  }

  function _removeLimitOverlay() {
    document.getElementById('iyt-limit-overlay')?.remove();
    _limitOverlayActive = false;
  }

  // ─── Write accumulated seconds to storage ─────────────────────────────────
  function _flushToStorage(seconds) {
    if (seconds <= 0) return Promise.resolve();
    return StorageManager._enqueue(async () => {
      try {
        const stored = await browser.storage.local.get('settings');
        const settings = stored.settings
          ? StorageManager._merge(StorageManager.getDefaultSettings(), stored.settings)
          : StorageManager.getDefaultSettings();

        const today = StorageManager.getTodayString();
        if (!settings.stats || settings.stats.lastStatsReset !== today) {
          settings.stats = {
            todayWatchSeconds: 0,
            limitDismissedToday: false,
            lastStatsReset: today
          };
        }

        settings.stats.todayWatchSeconds = (settings.stats.todayWatchSeconds || 0) + seconds;
        _baseWatchSeconds = settings.stats.todayWatchSeconds;
        if (settings.snoozeUntil && Date.now() >= settings.snoozeUntil) {
          settings.snoozeUntil = null;
        }
        await browser.storage.local.set({ settings });

        _settings = settings;

        // Daily limit check after flush
        if (_isLimitExceeded()) {
          if (_video && !_video.paused) {
            _video.pause();
          }
          _showLimitOverlay();
        }
      } catch (err) {
        console.warn('[IYT] flush failed', err);
      }
    });
  }

  // ─── Tick (runs every second while playing) ────────────────────────────────
  function _tick() {
    // If video element became detached, try to re-find
    if (!_video || !_video.isConnected) {
      const newVideo = _findActiveVideo();
      if (newVideo && newVideo !== _video) {
        attach();
        return;
      }
    }

    if (_video && _video.paused) {
      _onPause();
      return;
    }

    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    _sessionSeconds++;
    _batchAccumulator++;

    // Check daily limit every second in real time
    if (_isLimitExceeded()) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
      return;
    }

    // Batch-write every 5 seconds
    if (_batchAccumulator >= 5) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }

    // Soft reminder check (every intervalMinutes of SESSION time)
    if (_settings?.softReminder?.enabled) {
      const intervalSec = (_settings.softReminder.intervalMinutes || 30) * 60;
      const expectedCount = Math.floor(_sessionSeconds / intervalSec);
      if (expectedCount > _reminderIntervalCount) {
        _reminderIntervalCount = expectedCount;
        _showToast(Math.round(_sessionSeconds / 60));
      }
    }
  }

  // ─── Video event handlers ──────────────────────────────────────────────────
  function _onPlay() {
    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    if (_isLimitExceeded()) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
      return;
    }

    if (_intervalHandle) return; // guard against duplicate intervals
    _intervalHandle = setInterval(_tick, 1000);
  }

  function _onPause() {
    if (_intervalHandle) {
      clearInterval(_intervalHandle);
      _intervalHandle = null;
    }
    // Flush any un-flushed seconds immediately on pause
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  }

  function _onEnded() {
    _onPause();
    // Ignore ad endings
    if (document.querySelector('.ad-showing, .ad-interrupting') || (_video && _video.closest('.ad-showing'))) {
      return;
    }
    _graceConsumedFor = _getVideoId();
    _allowedVideoId = null;
    if (_isLimitExceeded()) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
    }
  }

  function _onTimeUpdate() {
    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    if (_isLimitExceeded()) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
      return;
    }
    // Fallback: if video is actively progressing and not paused, ensure timer runs
    if (_video && !_video.paused && !_intervalHandle) {
      _onPlay();
    }
  }

  // ─── Attach to video element ───────────────────────────────────────────────
  async function attach() {
    // Poll up to 6 seconds for the video element
    let video = null;
    for (let i = 0; i < 20; i++) {
      video = _findActiveVideo();
      if (video && video.isConnected) break;
      await new Promise(r => setTimeout(r, 300));
    }
    if (!video) {
      console.warn('[IYT] No video element found');
      return;
    }

    if (_video === video && _intervalHandle) {
      return;
    }

    detach(); // clean up any previous session

    _video = video;
    _sessionSeconds = 0;
    _batchAccumulator = 0;
    _reminderIntervalCount = 0;
    _limitOverlayActive = false;

    // Reset allowed video if route/videoId changed
    const currentVid = _getVideoId();
    if (_allowedVideoId && _allowedVideoId !== currentVid) {
      _allowedVideoId = null;
    }

    // Read settings at session start
    _settings = await StorageManager.getSettings();
    if (typeof I18N !== 'undefined') {
      await I18N.setLanguage(_settings?.userLanguage || 'auto');
    }
    _baseWatchSeconds = _settings.stats?.todayWatchSeconds || 0;

    // If limit already exceeded and not dismissed, intercept immediately
    if (_isLimitExceeded()) {
      _video.pause();
      _showLimitOverlay();
    }

    _video.addEventListener('play', _onPlay);
    _video.addEventListener('playing', _onPlay);
    _video.addEventListener('timeupdate', _onTimeUpdate);
    _video.addEventListener('pause', _onPause);
    _video.addEventListener('ended', _onEnded);
    _video.addEventListener('waiting', _onPause);

    // If video is already playing when we attach, start counting immediately
    if (!_video.paused) {
      _onPlay();
    }
  }

  // ─── Detach / reset ────────────────────────────────────────────────────────
  function detach() {
    _onPause(); // flushes remaining accumulator and clears interval
    if (_video) {
      _video.removeEventListener('play', _onPlay);
      _video.removeEventListener('playing', _onPlay);
      _video.removeEventListener('timeupdate', _onTimeUpdate);
      _video.removeEventListener('pause', _onPause);
      _video.removeEventListener('ended', _onEnded);
      _video.removeEventListener('waiting', _onPause);
      _video = null;
    }
    _removeLimitOverlay();
    document.getElementById('iyt-toast')?.remove();
    _sessionSeconds = 0;
    _batchAccumulator = 0;
    _reminderIntervalCount = 0;
    _baseWatchSeconds = 0;
    _limitOverlayActive = false;
    _allowedVideoId = null;
  }

  // Flush on tab close, hide, or navigation
  window.addEventListener('beforeunload', () => {
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  window.addEventListener('pagehide', () => {
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  // Keep _settings in sync when popup or another tab changes settings
  browser.storage.onChanged.addListener(async (changes) => {
    if (changes.settings?.newValue) {
      const oldLang = _settings?.userLanguage;
      _settings = changes.settings.newValue;
      if (typeof I18N !== 'undefined' && oldLang !== _settings.userLanguage) {
        await I18N.setLanguage(_settings.userLanguage || 'auto');
      }
      _baseWatchSeconds = _settings.stats?.todayWatchSeconds || 0;
      if (_isLimitExceeded()) {
        if (_video && !_video.paused) {
          _video.pause();
        }
        _showLimitOverlay();
      } else {
        _removeLimitOverlay();
      }
    }
  });

  // Listen for preview messages from extension popup
  if (browser && browser.runtime && browser.runtime.onMessage) {
    browser.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'IYT_PREVIEW_TOAST') {
        const mins = msg.minutes || (_settings?.softReminder?.intervalMinutes || 30);
        _showToast(mins);
      }
    });
  }

  return { attach, detach, showToast: _showToast };
})();

window.__iytTimer = IYT_Timer;
