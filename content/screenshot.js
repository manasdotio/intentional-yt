/**
 * screenshot.js — Intentional YT v3
 * Video frame screenshot capture button & shortcut for YouTube player.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

(function () {
  let _settings = null;
  let _observer = null;
  let _heartbeatTimer = null;
  let _pendingUpdate = false;

  const CAMERA_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
  const CHECKMARK_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

  function getMsg(key, fallback) {
    try {
      if (typeof I18N !== 'undefined' && I18N.getMessage) {
        return I18N.getMessage(key, null, fallback);
      }
      if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
        const msg = browser.i18n.getMessage(key);
        if (msg) return msg;
      }
    } catch {}
    return fallback;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function hasActiveMiniplayer() {
    return Boolean(document.querySelector?.('ytd-miniplayer[active] video, ytm-miniplayer[active] video, ytm-miniplayer video'));
  }

  function isVideoPage() {
    const p = location.pathname;
    return p === '/watch' || p.startsWith('/shorts') || p.startsWith('/live') || p.startsWith('/embed') || hasActiveMiniplayer();
  }

  function isEditable(el) {
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return Boolean(el.closest?.('input, textarea, [contenteditable="true"], ytd-searchbox, #search-form, #commentbox, ytd-commentbox, yt-dropdown-menu'));
  }

  function getActiveVideo() {
    const player = document.querySelector('#movie_player, .html5-video-player');
    if (player) {
      const v = player.querySelector('video');
      if (v) return v;
    }
    const shortsVideo = document.querySelector('ytd-reel-video-renderer[is-active] video, ytd-shorts video');
    if (shortsVideo) return shortsVideo;
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function getVideoTitle() {
    const el = document.querySelector(
      'h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string, ytd-watch-metadata #title, h1.title.ytd-video-primary-info-renderer, ytd-reel-video-renderer[is-active] .title, ytd-reel-video-renderer[is-active] #video-title'
    );
    let title = el?.textContent?.trim();
    if (!title) {
      title = document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();
    }
    title = title || 'YouTube Video';
    title = title.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
    title = title.replace(/^[_.\s]+|[_.\s]+$/g, '');
    if (title.length > 120) title = title.slice(0, 120).trim();
    return title || 'YouTube_Video';
  }

  function formatTimestamp(seconds) {
    const s = Math.floor(Math.max(0, seconds || 0));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs}h${String(mins).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`;
    }
    return `${mins}m${String(secs).padStart(2, '0')}s`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        a.remove();
        URL.revokeObjectURL(url);
      } catch {}
    }, 1000);
  }

  async function copyToClipboard(blob) {
    try {
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
      }
    } catch {}
  }

  function triggerFeedback() {
    const player = document.querySelector('#movie_player, .html5-video-player') || getActiveVideo()?.parentElement;
    if (player) {
      const flash = document.createElement('div');
      flash.className = 'iyt-screenshot-flash';
      player.appendChild(flash);
      setTimeout(() => {
        try { flash.remove(); } catch {}
      }, 400);

      const oldToast = player.querySelector('.iyt-screenshot-toast');
      if (oldToast) oldToast.remove();

      const toast = document.createElement('div');
      toast.className = 'iyt-screenshot-toast';
      const msg = getMsg('screenshot_toast_saved', 'Screenshot saved');
      toast.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>${escapeHtml(msg)}</span>`;
      player.appendChild(toast);
      setTimeout(() => {
        try { toast.remove(); } catch {}
      }, 1500);
    }

    // Feedback on player button
    const playerBtn = document.getElementById('iyt-screenshot-btn');
    if (playerBtn) {
      playerBtn.classList.add('iyt-captured');
      playerBtn.innerHTML = CHECKMARK_SVG;
      setTimeout(() => {
        if (playerBtn.isConnected) {
          playerBtn.classList.remove('iyt-captured');
          playerBtn.innerHTML = CAMERA_SVG;
        }
      }, 1200);
    }
  }

  function takeScreenshot() {
    const video = getActiveVideo();
    if (!video || !video.videoWidth || !video.videoHeight) {
      console.warn('[IYT] No valid video found for screenshot');
      return false;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const timestamp = formatTimestamp(video.currentTime);
      const title = getVideoTitle();
      const filename = `${title} (${timestamp}).png`;

      canvas.toBlob((blob) => {
        if (!blob) return;
        triggerDownload(blob, filename);
        copyToClipboard(blob);
        triggerFeedback();
      }, 'image/png');

      return true;
    } catch (err) {
      console.warn('[IYT] Screenshot capture error:', err);
      return false;
    }
  }

  function removeScreenshotButton() {
    const btn = document.getElementById('iyt-screenshot-btn');
    if (btn) btn.remove();
    const actionBtn = document.getElementById('iyt-action-screenshot-btn');
    if (actionBtn) actionBtn.remove();
  }

  function injectPlayerScreenshotButton() {
    const rightControls = document.querySelector(
      '#movie_player .ytp-right-controls, .html5-video-player .ytp-right-controls, .ytp-chrome-controls .ytp-right-controls, .ytp-right-controls'
    );
    if (!rightControls) return false;

    const existing = document.getElementById('iyt-screenshot-btn');
    if (existing) {
      if (existing.isConnected && rightControls.contains(existing)) {
        return true;
      }
      existing.remove();
    }

    const btn = document.createElement('button');
    btn.id = 'iyt-screenshot-btn';
    btn.className = 'ytp-button iyt-screenshot-btn';
    const title = getMsg('screenshot_button_title', 'Take screenshot (S)');
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.innerHTML = CAMERA_SVG;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      takeScreenshot();
    });

    try {
      const settingsBtn = rightControls.querySelector('.ytp-settings-button');
      if (settingsBtn && settingsBtn.parentNode === rightControls) {
        rightControls.insertBefore(btn, settingsBtn);
      } else if (rightControls.firstElementChild) {
        rightControls.insertBefore(btn, rightControls.firstElementChild);
      } else {
        rightControls.appendChild(btn);
      }
    } catch (_) {
      try {
        rightControls.appendChild(btn);
      } catch (err) {
        return false;
      }
    }

    return true;
  }

  function isEnabled() {
    if (_settings && _settings.extensionEnabled === false) {
      return false;
    }
    const blockerSettings = window.__iytBlocker?.getSettings?.();
    if (blockerSettings && blockerSettings.extensionEnabled === false) {
      return false;
    }
    return true;
  }

  function injectScreenshotButton() {
    if (!isEnabled() || !isVideoPage()) {
      removeScreenshotButton();
      return;
    }
    // Clean up any legacy action bar button if still in DOM
    const actionBtn = document.getElementById('iyt-action-screenshot-btn');
    if (actionBtn) actionBtn.remove();

    injectPlayerScreenshotButton();
  }

  async function update(settings) {
    try {
      if (settings) {
        _settings = settings;
      } else if (!_settings) {
        try {
          _settings = window.__iytBlocker?.getSettings?.()
            || (typeof StorageManager !== 'undefined' ? await StorageManager.getSettings() : null);
        } catch (_) {}
      }

      injectScreenshotButton();
    } catch (_) {}
  }

  function scheduleUpdate() {
    if (_pendingUpdate) return;
    _pendingUpdate = true;
    setTimeout(() => {
      _pendingUpdate = false;
      injectScreenshotButton();
    }, 150);
  }

  function startObserver() {
    if (_observer) return;
    _observer = new MutationObserver(() => {
      if (!isEnabled() || !isVideoPage()) return;
      if (!document.getElementById('iyt-screenshot-btn')) {
        scheduleUpdate();
      }
    });

    const target = document.body || document.documentElement;
    if (target) {
      _observer.observe(target, { childList: true, subtree: true });
    }
  }

  // Heartbeat fallback: checks every 1s on video page to ensure button is present
  function startHeartbeat() {
    if (_heartbeatTimer) return;
    _heartbeatTimer = setInterval(() => {
      if (isEnabled() && isVideoPage()) {
        if (!document.getElementById('iyt-screenshot-btn')) {
          injectScreenshotButton();
        }
      }
    }, 1000);
    if (_heartbeatTimer && typeof _heartbeatTimer.unref === 'function') {
      _heartbeatTimer.unref();
    }
  }

  // Keyboard shortcut listener ('s' / 'S')
  window.addEventListener('keydown', (e) => {
    if (e.key !== 's' && e.key !== 'S') return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (isEditable(e.target) || isEditable(document.activeElement)) return;
    if (!isEnabled() || !isVideoPage()) return;

    e.preventDefault();
    e.stopPropagation();
    takeScreenshot();
  }, true);

  // Storage changes
  if (browser?.storage?.onChanged) {
    browser.storage.onChanged.addListener((changes) => {
      if (changes.settings?.newValue) {
        _settings = changes.settings.newValue;
        update(_settings);
      }
    });
  }

  // Runtime messages from popup
  if (browser?.runtime?.onMessage) {
    browser.runtime.onMessage.addListener((msg) => {
      if (msg?.type === 'IYT_APPLY_SETTINGS' && msg.settings) {
        _settings = msg.settings;
        update(_settings);
      }
    });
  }

  // Route & player update events
  document.addEventListener('yt-navigate-finish', () => update());
  document.addEventListener('yt-page-data-updated', () => update());
  document.addEventListener('yt-player-updated', () => update());
  window.addEventListener('popstate', () => update());

  // Export public interface on window
  window.__iytScreenshot = {
    update,
    injectScreenshotButton: injectPlayerScreenshotButton,
    removeScreenshotButton,
    takeScreenshot,
    formatTimestamp,
    getVideoTitle
  };

  // Start observing and heartbeat immediately
  startObserver();
  startHeartbeat();

  // Initial update
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      startObserver();
      update();
    }, { once: true });
  } else {
    update();
  }
})();
