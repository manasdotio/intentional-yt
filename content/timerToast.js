/**
 * timerToast.js — Intentional YT v3
 * Passive watch timer, soft reminder toast, and daily limit enforcement.
 * Attached per watch/video page by youtubeObserver.js.
 */

'use strict';

const IYT_Timer = (() => {
  let _video = null;
  let _settings = null;
  let _sessionSeconds = 0;
  let _intervalHandle = null;
  let _batchAccumulator = 0;   // seconds accumulated since last storage write
  let _baseWatchSeconds = 0;   // todayWatchSeconds value in storage
  let _reminderIntervalCount = 0;
  let _limitOverlayActive = false;

  function _findActiveVideo() {
    return document.querySelector('video.html5-main-video')
      || document.querySelector('#movie_player video')
      || document.querySelector('.html5-video-player video')
      || document.querySelector('ytd-watch-flexy video')
      || document.querySelector('ytd-player video')
      || document.querySelector('video');
  }

  function _isLimitExceeded() {
    if (!_settings?.dailyLimit?.enabled) return false;
    if (_settings.stats?.limitDismissedToday) return false;
    const limitMin = Number(_settings.dailyLimit.limitMinutes) || 60;
    const currentTotalSec = (_baseWatchSeconds || 0) + _batchAccumulator;
    return (currentTotalSec / 60) >= limitMin;
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────
  function _showToast(minutes) {
    document.getElementById('iyt-toast')?.remove();

    const toast = document.createElement('div');
    toast.id = 'iyt-toast';
    toast.className = 'iyt-toast-container';

    const iconSpan = document.createElement('span');
    iconSpan.className = 'iyt-toast-icon';
    iconSpan.textContent = '⏱';

    const msgSpan = document.createElement('span');
    msgSpan.className = 'iyt-toast-message';
    msgSpan.textContent = `You've been watching for ${minutes} minute${minutes !== 1 ? 's' : ''}.`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'iyt-toast-close';
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.textContent = '✕';

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('iyt-toast-show'));
    });

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      toast.classList.remove('iyt-toast-show');
      setTimeout(() => toast.remove(), 350);
    }

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
    setTimeout(dismiss, 6000);
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

    const limitMin = _settings?.dailyLimit?.limitMinutes || 60;

    const icon = document.createElement('div');
    icon.className = 'iy-limit-icon';
    icon.textContent = '⏳';

    const title = document.createElement('h2');
    title.className = 'iy-limit-title';
    title.textContent = 'Daily Limit Reached';

    const p = document.createElement('p');
    p.className = 'iy-limit-message';
    p.textContent = `You've reached your ${limitMin}-minute daily watch limit for YouTube today.`;

    const btnGroup = document.createElement('div');
    btnGroup.className = 'iy-limit-btn-group';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'iy-limit-button';
    stopBtn.textContent = 'Stop Watching (Go Home)';

    const overrideBtn = document.createElement('button');
    overrideBtn.className = 'iy-limit-button-secondary';
    overrideBtn.textContent = 'Dismiss for today';

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
      _video?.pause();
      window.location.href = 'https://www.youtube.com/';
    });

    overrideBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', true);
      if (_settings?.stats) _settings.stats.limitDismissedToday = true;
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

  function _onTimeUpdate() {
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

    // Read settings at session start
    _settings = await StorageManager.getSettings();
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
    _video.addEventListener('ended', _onPause);
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
      _video.removeEventListener('ended', _onPause);
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
  browser.storage.onChanged.addListener((changes) => {
    if (changes.settings?.newValue) {
      _settings = changes.settings.newValue;
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

  return { attach, detach };
})();

window.__iytTimer = IYT_Timer;
