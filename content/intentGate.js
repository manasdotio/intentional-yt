/**
 * intentGate.js — Intentional YT Pro Mindful Intent Gate & Session Check-in
 * 
 * 1. Entry Gate: Interrupts autopilot browsing with a mindful breathing pause
 *    and intention prompt before entering YouTube.
 * 2. Mid-Session Check-in: Gently re-checks after X minutes to keep users
 *    accountable to their original goal and prevent algorithmic rabbit holes.
 * 
 * 100% Local privacy: All state stays in the browser session.
 */
'use strict';

(function() {
  var browser = globalThis.browser || globalThis.chrome;

  const SESSION_CLEARED_KEY = 'iyt_intent_cleared';
  const SESSION_GOAL_KEY = 'iyt_intent_goal';
  const SESSION_START_TIME_KEY = 'iyt_intent_start_time';
  const SESSION_CHECKIN_DUE_KEY = 'iyt_intent_checkin_due';

  let _intentActive = false;
  let _countdownTimer = null;
  let _remainingSeconds = 0;
  let _recheckTimer = null;

  function getMsg(key, substitutions, fallback) {
    try {
      if (typeof I18N !== 'undefined' && I18N && typeof I18N.getMessage === 'function') {
        const msg = I18N.getMessage(key, substitutions);
        if (msg) return msg;
      }
      if (typeof browser !== 'undefined' && browser.i18n && typeof browser.i18n.getMessage === 'function') {
        const msg = browser.i18n.getMessage(key, substitutions);
        if (msg) return msg;
      }
    } catch (_) {}
    return fallback !== undefined ? fallback : '';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  let _mediaObserverActive = false;
  let _pauseInterval = null;

  function freezeMedia(el) {
    if (!el) return;
    try {
      if (!el.paused) {
        el.pause();
      }
    } catch (_) {}
    pauseYouTubePlayer();
  }

  function pauseYouTubePlayer() {
    try {
      const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    } catch (_) {}
    try {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
      }
    } catch (_) {}
  }

  const mediaObserver = typeof MutationObserver !== 'undefined' ? new MutationObserver((mutations) => {
    if (!_intentActive) return;
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
  }) : null;

  function onMediaIntercept(e) {
    if (_intentActive) {
      const target = e.target;
      if (target && (target.tagName === 'VIDEO' || target.tagName === 'AUDIO' || typeof target.pause === 'function')) {
        freezeMedia(target);
      }
    }
  }

  function startMediaLock() {
    if (_mediaObserverActive) return;
    _mediaObserverActive = true;
    document.querySelectorAll('video, audio').forEach(freezeMedia);
    pauseYouTubePlayer();

    const target = document.documentElement || document;
    try {
      mediaObserver?.observe(target, { childList: true, subtree: true });
    } catch (_) {}

    window.addEventListener('play', onMediaIntercept, true);
    window.addEventListener('playing', onMediaIntercept, true);
    window.addEventListener('timeupdate', onMediaIntercept, true);

    if (_pauseInterval) clearInterval(_pauseInterval);
    _pauseInterval = setInterval(() => {
      if (!_intentActive) {
        stopMediaLock();
        return;
      }
      document.querySelectorAll('video, audio').forEach(freezeMedia);
      pauseYouTubePlayer();
    }, 250);
  }

  function stopMediaLock() {
    if (_pauseInterval) {
      clearInterval(_pauseInterval);
      _pauseInterval = null;
    }
    if (!_mediaObserverActive) return;
    _mediaObserverActive = false;
    try {
      mediaObserver?.disconnect();
    } catch (_) {}
    window.removeEventListener('play', onMediaIntercept, true);
    window.removeEventListener('playing', onMediaIntercept, true);
    window.removeEventListener('timeupdate', onMediaIntercept, true);
  }

  function pauseAllVideos() {
    startMediaLock();
  }

  function scheduleRecheck(settings) {
    if (_recheckTimer) {
      clearTimeout(_recheckTimer);
      _recheckTimer = null;
    }
    const recheckMinutes = settings?.intentGate?.recheckMinutes;
    if (!recheckMinutes || recheckMinutes <= 0) {
      try { sessionStorage.removeItem(SESSION_CHECKIN_DUE_KEY); } catch (_) {}
      return;
    }

    const intervalMs = recheckMinutes * 60 * 1000;
    const dueTime = Date.now() + intervalMs;
    try {
      sessionStorage.setItem(SESSION_CHECKIN_DUE_KEY, String(dueTime));
    } catch (_) {}

    _recheckTimer = setTimeout(() => {
      showCheckInOverlay(settings);
    }, intervalMs);
  }

  async function checkAndShowGate(settings) {
    if (!settings) {
      try {
        if (typeof StorageManager !== 'undefined' && StorageManager.getSettings) {
          settings = await StorageManager.getSettings();
        } else {
          return;
        }
      } catch (_) {
        return;
      }
    }

    // Must be enabled, extension active
    if (settings.extensionEnabled === false || !settings.intentGate?.enabled) {
      hideGate();
      if (_recheckTimer) clearTimeout(_recheckTimer);
      return;
    }

    // Must have Pro license
    const isPro = typeof IYT_Licensing !== 'undefined' ? await IYT_Licensing.isPro() : false;
    if (!isPro) {
      hideGate();
      if (_recheckTimer) clearTimeout(_recheckTimer);
      return;
    }

    // Check if full scheduled block is currently active (it takes priority)
    if (typeof IYT_Policy !== 'undefined' && IYT_Policy.schedules) {
      const fullSchedules = IYT_Policy.schedules(settings).filter(s => s.mode === 'full');
      if (fullSchedules.length > 0) {
        return;
      }
    }

    // Check if user already passed entry gate in this tab session
    try {
      if (sessionStorage.getItem(SESSION_CLEARED_KEY) === 'true') {
        const recheckMin = settings.intentGate?.recheckMinutes || 0;
        if (recheckMin > 0) {
          const dueStr = sessionStorage.getItem(SESSION_CHECKIN_DUE_KEY);
          if (dueStr) {
            const due = Number(dueStr);
            if (due && Date.now() >= due) {
              showCheckInOverlay(settings);
              return;
            } else if (due) {
              const remainingMs = Math.max(1000, due - Date.now());
              if (_recheckTimer) clearTimeout(_recheckTimer);
              _recheckTimer = setTimeout(() => showCheckInOverlay(settings), remainingMs);
            }
          } else {
            scheduleRecheck(settings);
          }
        }
        return;
      }
    } catch (_) {}

    showGate(settings);
  }

  function getOrCreateOverlay() {
    const html = document.documentElement;
    if (document.body && document.body.inert) {
      document.body.inert = false;
    }

    let overlay = document.getElementById('iyt-intent-gate-screen');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'iyt-intent-gate-screen';
    }

    if (document.body) {
      if (overlay.parentElement !== document.body) {
        document.body.appendChild(overlay);
      }
    } else {
      if (overlay.parentElement !== html) {
        html.appendChild(overlay);
      }
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body && overlay.parentElement !== document.body) {
          document.body.appendChild(overlay);
          if (document.body.inert) document.body.inert = false;
        }
      }, { once: true });
    }

    return overlay;
  }

  /* ═══════════════════════════════════════════════════════════
     1. ENTRY INTENT GATE
  ═══════════════════════════════════════════════════════════ */
  function showGate(settings) {
    if (_intentActive && document.getElementById('iyt-intent-gate-screen')) return;
    _intentActive = true;

    const html = document.documentElement;
    html.classList.add('iyt-intent-gate-active');
    pauseAllVideos();

    const overlay = getOrCreateOverlay();

    const duration = Number.isInteger(settings.intentGate?.durationSeconds) ? settings.intentGate.durationSeconds : 5;
    _remainingSeconds = duration;

    const titleText = getMsg('intent_gate_title', null, 'What is your intention?');
    const breathText = getMsg('intent_gate_breathe', null, 'Take a breath');
    const readyText = getMsg('intent_gate_ready', null, 'Ready');
    const chipSearch = getMsg('intent_gate_chip_search', null, 'Specific search');
    const chipStudy = getMsg('intent_gate_chip_study', null, 'Deep study');
    const chipQuick = getMsg('intent_gate_chip_quick', null, '10m check');
    const placeholderText = getMsg('intent_gate_input_placeholder', null, 'Search topic or set goal…');
    const proceedText = getMsg('btn_proceed_youtube', null, 'Continue to YouTube');
    const closeBtnText = getMsg('intent_gate_btn_close', null, 'Close Tab');

    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', titleText);
    overlay.setAttribute('dir', typeof I18N !== 'undefined' ? I18N.getDirection() : 'ltr');

    overlay.innerHTML = `
      <div class="iyt-intent-card" id="iyt-intent-card">
        <div class="iyt-ios-breathe">
          <div class="iyt-ios-breathe-ring"></div>
          <div class="iyt-ios-ring-2"></div>
          <div class="iyt-ios-countdown" id="iyt-intent-countdown">${_remainingSeconds > 0 ? _remainingSeconds : '✓'}</div>
        </div>

        <div class="iyt-ios-subtitle" id="iyt-intent-breathe-label">${_remainingSeconds > 0 ? breathText : readyText}</div>
        <h1 class="iyt-ios-title">${titleText}</h1>

        <div class="iyt-ios-search-wrap">
          <svg class="iyt-ios-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5"/>
            <line x1="12.5" y1="12.5" x2="17" y2="17"/>
          </svg>
          <input type="text" id="iyt-intent-custom-input" class="iyt-ios-search-input" placeholder="${placeholderText}" maxlength="120" autocomplete="off" spellcheck="false" />
        </div>

        <div class="iyt-ios-pills" role="group" aria-label="Goal choices">
          <button type="button" class="iyt-intent-chip" data-intent="search">${chipSearch}</button>
          <button type="button" class="iyt-intent-chip" data-intent="study">${chipStudy}</button>
          <button type="button" class="iyt-intent-chip" data-intent="quick">${chipQuick}</button>
        </div>

        <div class="iyt-ios-actions">
          <button type="button" class="iyt-intent-btn-proceed" id="iyt-btn-intent-proceed" ${_remainingSeconds > 0 ? 'disabled' : ''}>
            <span id="iyt-intent-btn-label">${_remainingSeconds > 0 ? `Pause (${_remainingSeconds}s)` : proceedText}</span>
          </button>
          <button type="button" class="iyt-intent-btn-close" id="iyt-btn-intent-close">${closeBtnText}</button>
        </div>
      </div>
    `;

    // Hook elements & events
    let selectedIntent = '';
    const chips = overlay.querySelectorAll('.iyt-intent-chip');
    const customInput = overlay.querySelector('#iyt-intent-custom-input');
    const proceedBtn = overlay.querySelector('#iyt-btn-intent-proceed');
    const btnLabel = overlay.querySelector('#iyt-intent-btn-label');
    const btnArrow = overlay.querySelector('#iyt-intent-btn-arrow');
    const countdownEl = overlay.querySelector('#iyt-intent-countdown');
    const breatheLabel = overlay.querySelector('#iyt-intent-breathe-label');

    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const intent = chip.dataset.intent;
        if (selectedIntent === intent) {
          chip.classList.remove('active');
          selectedIntent = '';
          if (customInput) customInput.placeholder = placeholderText;
        } else {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          selectedIntent = intent;
          if (customInput) {
            if (intent === 'search') {
              customInput.placeholder = 'Type what you want to search…';
              customInput.focus();
            } else if (intent === 'study') {
              customInput.placeholder = 'Optional: What are you studying?';
            } else if (intent === 'quick') {
              customInput.placeholder = 'Optional: What are you checking?';
            }
          }
        }
      });
    });

    if (customInput) {
      customInput.addEventListener('input', () => {
        if (customInput.value.trim().length > 0 && selectedIntent !== 'search') {
          chips.forEach(c => c.classList.remove('active'));
          selectedIntent = 'custom';
        }
      });

      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (_remainingSeconds <= 0) {
            proceed();
          }
        }
      });

      setTimeout(() => {
        if (customInput && selectedIntent === 'search') customInput.focus();
      }, 100);
    }

    // Accessible keyboard focus trapping
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusables = overlay.querySelectorAll('button:not(:disabled), input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    // Countdown timer
    if (_countdownTimer) clearInterval(_countdownTimer);
    if (_remainingSeconds > 0) {
      _countdownTimer = setInterval(() => {
        _remainingSeconds--;
        if (countdownEl) countdownEl.textContent = _remainingSeconds > 0 ? _remainingSeconds : '✓';
        if (btnLabel && _remainingSeconds > 0) {
          btnLabel.textContent = `Mindful pause (${_remainingSeconds}s)`;
        }
        if (_remainingSeconds <= 0) {
          clearInterval(_countdownTimer);
          _countdownTimer = null;
          if (proceedBtn) {
            proceedBtn.disabled = false;
            if (btnLabel) btnLabel.textContent = proceedText;
            if (btnArrow) btnArrow.style.display = 'inline-block';
          }
          if (breatheLabel) breatheLabel.textContent = readyText;
        }
      }, 1000);
    }

    function proceed() {
      if (_countdownTimer) {
        clearInterval(_countdownTimer);
        _countdownTimer = null;
      }
      const rawInput = customInput ? customInput.value.trim() : '';
      let finalGoal = 'Intentional watch';
      if (rawInput) {
        finalGoal = rawInput;
      } else if (selectedIntent === 'study') {
        finalGoal = 'Study / Deep Work';
      } else if (selectedIntent === 'quick') {
        finalGoal = 'Quick check';
      } else if (selectedIntent === 'search') {
        finalGoal = 'Specific search';
      }

      try {
        sessionStorage.setItem(SESSION_CLEARED_KEY, 'true');
        sessionStorage.setItem(SESSION_GOAL_KEY, finalGoal);
        sessionStorage.setItem(SESSION_START_TIME_KEY, String(Date.now()));
      } catch (_) {}

      // Schedule periodic mid-session check-in if enabled
      scheduleRecheck(settings);

      const isHome = window.location.pathname === '/' || window.location.pathname === '';
      const isExplicitSearch = selectedIntent === 'search' && rawInput.length > 0;

      hideGate();

      // Only redirect to search if user clicked search AND actively typed a search query
      if (isHome && isExplicitSearch) {
        window.location.href = '/results?search_query=' + encodeURIComponent(rawInput);
      } else if (selectedIntent === 'search') {
        setTimeout(() => {
          const searchInput = document.querySelector('input#search') || document.querySelector('input.ytd-searchbox');
          searchInput?.focus();
        }, 150);
      }
    }

    proceedBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      proceed();
    });

    const closeBtn = overlay.querySelector('#iyt-btn-intent-close');
    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      closeTab();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     2. MID-SESSION INTENTION CHECK-IN OVERLAY
  ═══════════════════════════════════════════════════════════ */
  function showCheckInOverlay(settings) {
    if (_intentActive && document.getElementById('iyt-intent-gate-screen')) return;
    _intentActive = true;

    const html = document.documentElement;
    html.classList.add('iyt-intent-gate-active');
    pauseAllVideos();

    const overlay = getOrCreateOverlay();

    let goal = 'Intentional watch';
    let elapsedMin = settings.intentGate?.recheckMinutes || 20;
    try {
      goal = sessionStorage.getItem(SESSION_GOAL_KEY) || 'Intentional watch';
      const start = Number(sessionStorage.getItem(SESSION_START_TIME_KEY));
      if (start) {
        elapsedMin = Math.max(1, Math.round((Date.now() - start) / 60000));
      }
    } catch (_) {}

    const checkinBadge = getMsg('intent_checkin_badge', null, 'Intention Check-in');
    const checkinTitle = getMsg('intent_checkin_title', null, 'Are you still on track?');
    const continueBtnText = getMsg('intent_checkin_btn_continue', null, 'Still on track — Continue');
    const closeBtnText = getMsg('intent_checkin_btn_close', null, 'Got distracted — Close Tab');

    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', checkinTitle);
    overlay.setAttribute('dir', typeof I18N !== 'undefined' ? I18N.getDirection() : 'ltr');

    overlay.innerHTML = `
      <div class="iyt-intent-card" id="iyt-checkin-card">
        <div class="iyt-ios-subtitle">${elapsedMin}m on YouTube</div>
        <h1 class="iyt-ios-title">${checkinTitle}</h1>

        <div class="iyt-checkin-goal-card" id="iyt-checkin-goal-box">
          <div class="iyt-checkin-goal-heading">Intention</div>
          <div class="iyt-checkin-goal-text" id="iyt-checkin-current-goal">“${escapeHtml(goal)}”</div>
        </div>

        <div class="iyt-checkin-edit-wrap" id="iyt-checkin-edit-wrap" style="display:none;margin-bottom:14px;">
          <input type="text" id="iyt-checkin-new-input" class="iyt-ios-search-input" placeholder="Update your intention…" maxlength="120" autocomplete="off" spellcheck="false" />
        </div>

        <div class="iyt-ios-actions">
          <button type="button" class="iyt-intent-btn-proceed" id="iyt-btn-checkin-continue">
            <span id="iyt-checkin-btn-label">${continueBtnText}</span>
          </button>
          <button type="button" class="iyt-checkin-btn-edit" id="iyt-btn-checkin-edit">Edit Intention</button>
          <button type="button" class="iyt-intent-btn-close" id="iyt-btn-checkin-close">${closeBtnText}</button>
        </div>
      </div>
    `;

    const continueBtn = overlay.querySelector('#iyt-btn-checkin-continue');
    const editBtn = overlay.querySelector('#iyt-btn-checkin-edit');
    const editWrap = overlay.querySelector('#iyt-checkin-edit-wrap');
    const newInput = overlay.querySelector('#iyt-checkin-new-input');
    const goalText = overlay.querySelector('#iyt-checkin-current-goal');
    const closeBtn = overlay.querySelector('#iyt-btn-checkin-close');

    let isEditing = false;
    editBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      isEditing = !isEditing;
      if (editWrap) editWrap.style.display = isEditing ? 'block' : 'none';
      if (isEditing && newInput) {
        newInput.value = goal;
        newInput.focus();
        editBtn.textContent = '✕ Cancel edit';
      } else if (editBtn) {
        editBtn.textContent = '✎ Change Intention';
      }
    });

    if (newInput) {
      newInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveAndContinue();
        }
      });
    }

    function saveAndContinue() {
      if (isEditing && newInput && newInput.value.trim().length > 0) {
        goal = newInput.value.trim();
        try { sessionStorage.setItem(SESSION_GOAL_KEY, goal); } catch (_) {}
      }
      hideGate();
      scheduleRecheck(settings);
    }

    continueBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      saveAndContinue();
    });

    closeBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      closeTab();
    });
  }

  function closeTab() {
    stopMediaLock();
    if (_countdownTimer) {
      clearInterval(_countdownTimer);
      _countdownTimer = null;
    }
    if (_recheckTimer) {
      clearTimeout(_recheckTimer);
      _recheckTimer = null;
    }
    Promise.resolve().then(() => {
      const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime;
      if (runtime?.sendMessage) return runtime.sendMessage({ type: 'IYT_CLOSE_TAB' });
      window.location.replace('about:blank');
    }).catch(() => window.location.replace('about:blank'));
  }

  function hideGate() {
    _intentActive = false;
    stopMediaLock();
    if (_countdownTimer) {
      clearInterval(_countdownTimer);
      _countdownTimer = null;
    }
    const html = document.documentElement;
    html.classList.remove('iyt-intent-gate-active');
    const overlay = document.getElementById('iyt-intent-gate-screen');
    if (overlay) {
      overlay.style.transition = 'opacity 180ms ease, transform 180ms ease';
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(0.98)';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        if (overlay.parentElement) overlay.remove();
      }, 180);
    }
  }

  // Initial check
  if (typeof StorageManager !== 'undefined' && StorageManager.getSettings) {
    StorageManager.getSettings().then(checkAndShowGate).catch(() => {});
  }

  // Observe storage updates (e.g. if toggled or changed from popup)
  if (typeof browser !== 'undefined' && browser.storage?.onChanged) {
    browser.storage.onChanged.addListener((changes) => {
      if (changes.settings?.newValue) {
        const newlyEnabled = changes.settings.newValue.intentGate?.enabled && !changes.settings.oldValue?.intentGate?.enabled;
        if (newlyEnabled) {
          try {
            sessionStorage.removeItem(SESSION_CLEARED_KEY);
            sessionStorage.removeItem(SESSION_CHECKIN_DUE_KEY);
          } catch (_) {}
        }
        checkAndShowGate(changes.settings.newValue);
      }
    });
  }

  // Also react to direct runtime messages from popup
  if (typeof browser !== 'undefined' && browser.runtime?.onMessage) {
    browser.runtime.onMessage.addListener((msg) => {
      if (msg && msg.type === 'IYT_APPLY_SETTINGS' && msg.settings) {
        if (msg.settings.intentGate?.enabled && !_intentActive) {
          try {
            sessionStorage.removeItem(SESSION_CLEARED_KEY);
            sessionStorage.removeItem(SESSION_CHECKIN_DUE_KEY);
          } catch (_) {}
        }
        checkAndShowGate(msg.settings);
      }
    });
  }
})();
