/**
 * scheduledBlocker.js — Intentional YT v3
 * Enforces time-based scheduled blocking rules (full commitment overlay or strict protection mode).
 * Zero-dependency, run at document_start.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

(function () {
  const html = document.documentElement;
  let _evaluation = 0;
  let _intervalHandle = null;

  function freezeMedia(el) {
    if (!el) return;
    try {
      if (!el.paused) {
        el.pause();
      }
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

  function showFullBlockOverlay(sched) {
    const signature = JSON.stringify(sched);
    const existing = document.getElementById("iyt-scheduled-block-screen");
    if (existing?.dataset.signature === signature) return;
    html.classList.add('iyt-scheduled-full-block');
    startMediaLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (document.pictureInPictureElement && document.exitPictureInPicture) document.exitPictureInPicture().catch(() => {});

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

    const titleText = getMsg('scheduled_block_title', null, 'YouTube is unavailable right now');
    const reopenText = getMsg('scheduled_block_reopens', [sched.endTime], `Reopens at ${sched.endTime}`);
    const commitmentText = getMsg('scheduled_block_commitment', null, 'This schedule is enforced by Intentional YT to protect your focus.');
    const labelText = sched.label || 'Scheduled Focus Block';

    IYT_Dialog.close(overlay);
    overlay.dataset.signature = signature;
    overlay.innerHTML = `
      <div class="iyt-scheduled-card">
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
            <path d="M 210 162 C 210 152 221 146 229 151 L 340 245 C 347 250 347 262 340 267 L 229 361 C 221 366 210 360 210 350 Z" fill="url(#iytRed)"/>
            <path d="M 226 186 C 226 180 233 176 238 180 L 316 250 C 321 254 321 262 316 266 L 238 336 C 233 340 226 336 226 330 Z" fill="#FFFFFF"/>
          </svg>
        </div>

        <h1 class="iyt-scheduled-title"></h1>

        <div class="iyt-scheduled-meta">
          <span class="iyt-scheduled-pill"></span>
          <span class="iyt-scheduled-reopens"></span>
        </div>

        <p class="iyt-scheduled-commitment"></p>

        <div class="iyt-scheduled-actions">
          <button type="button" class="iyt-scheduled-btn-close" id="iyt-btn-close-tab"></button>
          <button type="button" class="iyt-scheduled-btn-leave" id="iyt-btn-leave-yt"></button>
        </div>
      </div>
    `;

    overlay.setAttribute('aria-label', titleText);
    overlay.setAttribute('dir', I18N.getDirection());
    overlay.querySelector('.iyt-scheduled-title').textContent = titleText;
    overlay.querySelector('.iyt-scheduled-pill').textContent = labelText;
    overlay.querySelector('.iyt-scheduled-commitment').textContent = commitmentText;
    const reopening = overlay.querySelector('.iyt-scheduled-reopens');
    reopening.textContent = sched.endTime ? reopenText : '';
    reopening.hidden = !sched.endTime;
    overlay.querySelector('#iyt-btn-close-tab').textContent = getMsg('scheduled_close_tab', null, 'Close Tab');
    overlay.querySelector('#iyt-btn-leave-yt').textContent = getMsg('scheduled_blank_screen', null, 'Blank Screen');
    const closeBtn = overlay.querySelector('#iyt-btn-close-tab');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        browser.runtime.sendMessage({ type: 'IYT_CLOSE_TAB' }).catch(() => window.location.replace('about:blank'));
      });
    }

    const leaveBtn = overlay.querySelector('#iyt-btn-leave-yt');
    if (leaveBtn) {
      leaveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.replace('about:blank');
      });
    }

    IYT_Dialog.open(overlay);
    pauseAllVideos();
  }

  function hideFullBlockOverlay() {
    stopMediaLock();
    html.classList.remove('iyt-scheduled-full-block');
    const overlay = document.getElementById('iyt-scheduled-block-screen');
    if (overlay) { IYT_Dialog.close(overlay); overlay.remove(); }
  }

  async function evaluateSchedules() {
    const generation = ++_evaluation;
    try {
      const settings = await StorageManager.getSettings();
      if (generation !== _evaluation) return;
      await I18N.setLanguage(settings.userLanguage || 'auto');
      if (generation !== _evaluation) return;
      const active = IYT_Policy.schedules(settings);
      const full = active.find(rule => rule.mode === 'full');
      if (full) {
        const end = IYT_Policy.fullBlockEnds(settings);
        const endTime = end ? end.toLocaleString(settings.userLanguage === 'auto' ? undefined : settings.userLanguage.replace('_','-'), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '';
        showFullBlockOverlay({ ...full, endTime, language: settings.userLanguage });
      } else hideFullBlockOverlay();
      await window.__iytBlocker?.applyAllSettings();
    } catch (error) { console.warn('[IYT] Schedule evaluation failed', error); }
    finally {
      if (generation === _evaluation) {
        clearTimeout(_intervalHandle);
        _intervalHandle = setTimeout(evaluateSchedules, 60000 - Date.now() % 60000 + 20);
      }
    }
  }
  browser.storage.onChanged.addListener(changes => { if (changes.settings) evaluateSchedules(); });
  document.addEventListener('yt-navigate-finish', evaluateSchedules);
  window.addEventListener('popstate', evaluateSchedules);
  window.addEventListener('focus', evaluateSchedules);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) evaluateSchedules(); });
  evaluateSchedules();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', evaluateSchedules, { once: true });
})();
