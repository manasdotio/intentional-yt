/**
 * Timer Overlay for YouTube Focus Guard (JS version)
 * Shows watch time and periodic reminders
 */

class TimerOverlay {
  constructor() {
    this.renderOverlay = false;
    this.overlay = null;
    this.timeElement = null;
    this.nextReminderElement = null;
    this.modeElement = null;
    this.topicElement = null;
    this.intervalId = null;
    this.sessionStart = Date.now(); // safe default; overwritten by loadSessionData
    this.currentWatchTime = 0;
    this.lastPlaybackTick = 0;
    this.reminderIntervals = [25, 15, 10, 5];
    this.currentReminderIndex = 0;
    this.isVisible = false;
    this.blockModalShown = false;
    this.storage = null;
    this.timeUtils = null;
    this.lastContextRefresh = 0;
    this.lastPersistedAt = 0;
    this.hasLoadedSessionData = false;
    this.pendingVideoSessionStart = false;
    this._sessionFresh = false; // true once startNewVideoSession() has been called
    this.boundPersistSessionState = () => {
      void this.persistSessionState(true);
    };
    this.init();
  }

  static getInstance() {
    if (!TimerOverlay.instance) {
      TimerOverlay.instance = new TimerOverlay();
    }
    return TimerOverlay.instance;
  }

  async init() {
    await this.waitForDependencies();
    
    this.storage = window.StorageManager.getInstance();
    this.timeUtils = window.TimeUtils.getInstance();
    
    this.createOverlay();
    await this.loadSessionData();
    this.setupPersistenceListeners();
    this.startTimer();

    // Auto-show on watch pages — works regardless of whether show() was called externally
    if (window.location.href.includes('/watch')) {
      this.show();
    }
  }

  async waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (window.StorageManager && window.TimeUtils) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  createOverlay() {
    if (!this.renderOverlay) {
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'yfg-timer-overlay';
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="yfg-timer-content">
        <div class="yfg-timer-header-row">
          <div class="yfg-timer-title">Watching</div>
          <div class="yfg-timer-time" id="yfg-watch-time">00:00</div>
        </div>
        <div class="yfg-timer-meta-row">
          <span class="yfg-timer-chip" id="yfg-overlay-mode">Entertainment</span>
          <span class="yfg-timer-next" id="yfg-next-reminder">Next reminder: --</span>
        </div>
        <div class="yfg-timer-topic" id="yfg-overlay-topic">No active topic</div>
        <div class="yfg-timer-controls">
          <button class="yfg-timer-btn" id="yfg-hide-timer" title="Hide timer">
            ➖
          </button>
        </div>
      </div>
    `;

    const hideTimerBtn = this.overlay.querySelector('#yfg-hide-timer');

    if (hideTimerBtn) {
      hideTimerBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    document.body.appendChild(this.overlay);

    // Cache element references to avoid querySelector every second
    this.timeElement = this.overlay.querySelector('#yfg-watch-time');
    this.nextReminderElement = this.overlay.querySelector('#yfg-next-reminder');
    this.modeElement = this.overlay.querySelector('#yfg-overlay-mode');
    this.topicElement = this.overlay.querySelector('#yfg-overlay-topic');

    // If show() was called before the overlay was created (async race), display now
    if (this.isVisible) {
      this.overlay.style.display = 'block';
    }
  }

  setupPersistenceListeners() {
    window.addEventListener('pagehide', this.boundPersistSessionState);
    window.addEventListener('beforeunload', this.boundPersistSessionState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void this.persistSessionState(true);
      }
    });
  }

  async loadSessionData() {
    // If a fresh session was already started by startNewVideoSession(), don't overwrite it
    if (this._sessionFresh) {
      this.hasLoadedSessionData = true;
      return;
    }

    const settings = await this.storage.getSettings();
    const storedStart = settings.watchTimer.sessionStart || 0;
    const storedIndex = settings.watchTimer.currentInterval || 0;
    const storedWatchTime = settings.watchTimer.currentWatchTime || 0;

    // Reset session if stored start is stale (>2 hours old) or missing
    const twoHoursMs = 2 * 60 * 60 * 1000;
    if (!storedStart || (Date.now() - storedStart) > twoHoursMs) {
      this.sessionStart = Date.now();
      this.currentReminderIndex = 0;
      this.currentWatchTime = 0;
    } else {
      this.sessionStart = storedStart;
      this.currentReminderIndex = storedIndex;
      this.currentWatchTime = storedWatchTime;
    }

    this.reminderIntervals = settings.watchTimer.reminderIntervals || [25, 15, 10, 5];
    this.lastPersistedAt = Date.now();
    this.hasLoadedSessionData = true;

    if (this.pendingVideoSessionStart) {
      this.pendingVideoSessionStart = false;
      this.applyVideoSessionStart();
    }
  }

  startTimer() {
    // Prevent duplicate intervals if startTimer is called more than once
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      try {
        this.updateTimer();
        this.checkReminders();
      } catch (e) {
        console.error('[YFG] timer tick error:', e);
      }
    }, 1000);
  }

  updateTimer() {
    if (!this.timeUtils) return;

    if (!window.location.href.includes('/watch')) {
      this.lastPlaybackTick = 0;
      return;
    }

    if (this.renderOverlay && this.isVisible) {
      this.attachOverlayToPlayer();
    }

    if (this.renderOverlay && this.isVisible && this.overlay && !this.overlay.parentNode) {
      document.body.appendChild(this.overlay);
      this.overlay.style.display = 'block';
    }

    this.syncPlaybackTime();

    if (this.renderOverlay && this.isVisible && Date.now() - this.lastContextRefresh > 2000) {
      this.lastContextRefresh = Date.now();
      this.refreshOverlayContext();
    }

    if (this.renderOverlay && this.timeElement) {
      this.timeElement.textContent = this.timeUtils.formatTime(this.currentWatchTime);
    }

    if (this.renderOverlay) {
      this.updateNextReminderDisplay();
    }
  }

  syncPlaybackTime() {
    const video = document.querySelector('video');
    const isActivelyPlaying = Boolean(video && !video.paused && !video.ended && video.readyState > 2);

    if (!isActivelyPlaying) {
      this.lastPlaybackTick = 0;
      return;
    }

    const now = Date.now();
    if (!this.lastPlaybackTick) {
      this.lastPlaybackTick = now;
      return;
    }

    const elapsedSeconds = Math.floor((now - this.lastPlaybackTick) / 1000);
    if (elapsedSeconds <= 0) {
      return;
    }

    this.currentWatchTime += elapsedSeconds;
    this.lastPlaybackTick += elapsedSeconds * 1000;

    if ((now - this.lastPersistedAt) >= 5000) {
      void this.persistSessionState();
    }
  }

  async persistSessionState(force = false) {
    if (!this.storage) {
      return;
    }

    const now = Date.now();
    if (!force && now - this.lastPersistedAt < 5000) {
      return;
    }

    this.lastPersistedAt = now;
    await this.storage.saveSettings({
      watchTimer: {
        currentInterval: this.currentReminderIndex,
        sessionStart: this.sessionStart,
        currentWatchTime: this.currentWatchTime,
        reminderIntervals: this.reminderIntervals,
        enabled: true,
        totalToday: 0
      }
    });
  }

  updateNextReminderDisplay() {
    if (!this.nextReminderElement) return;

    if (this.currentReminderIndex >= this.reminderIntervals.length) {
      this.nextReminderElement.textContent = 'Session limit reached';
      return;
    }

    // Cumulative threshold for the next reminder
    let cumulativeThreshold = 0;
    for (let i = 0; i <= this.currentReminderIndex; i++) {
      cumulativeThreshold += this.reminderIntervals[i];
    }

    const sessionMinutes = Math.floor(this.currentWatchTime / 60);
    const minutesUntilReminder = Math.max(0, cumulativeThreshold - sessionMinutes);

    if (minutesUntilReminder === 0) {
      this.nextReminderElement.textContent = 'Next reminder: now';
    } else {
      this.nextReminderElement.textContent = `Next reminder: ${minutesUntilReminder}m`;
    }
  }

  async refreshOverlayContext() {
    if (!this.storage) {
      return;
    }

    const settings = await this.storage.getSettings();
    const currentTopic = Array.isArray(settings.research.currentTopic) ? settings.research.currentTopic : [];

    if (this.modeElement) {
      this.modeElement.textContent = settings.research.mode === 'research' ? 'Research' : 'Entertainment';
      this.modeElement.classList.toggle('is-research', settings.research.mode === 'research');
    }

    if (this.topicElement) {
      if (settings.research.mode === 'research' && currentTopic.length > 0) {
        const topicText = currentTopic.join(', ');
        this.topicElement.textContent = topicText.length > 42 ? `${topicText.slice(0, 39)}...` : topicText;
      } else {
        this.topicElement.textContent = 'No active topic';
      }
    }
  }

  attachOverlayToPlayer() {
    if (!this.renderOverlay || !this.overlay) {
      return;
    }

    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (player && this.overlay.parentNode !== player) {
      this.overlay.classList.add('yfg-timer-overlay-player');
      player.appendChild(this.overlay);
    } else if (!player && this.overlay.parentNode !== document.body) {
      this.overlay.classList.remove('yfg-timer-overlay-player');
      document.body.appendChild(this.overlay);
    }
  }

  checkReminders() {
    // Guard: once block modal is shown, stop checking until session resets
    if (this.blockModalShown || !this.isVisible || !this.timeUtils || !window.location.href.includes('/watch')) return;

    const sessionMinutes = Math.floor(this.currentWatchTime / 60);

    if (this.currentReminderIndex < this.reminderIntervals.length) {
      // Use cumulative thresholds so reminders fire at 25, 40, 50, 55 min (not all at once)
      let cumulativeThreshold = 0;
      for (let i = 0; i <= this.currentReminderIndex; i++) {
        cumulativeThreshold += this.reminderIntervals[i];
      }

      if (sessionMinutes >= cumulativeThreshold) {
        this.showReminderModal(sessionMinutes);
        this.currentReminderIndex++;
        void this.persistSessionState(true);
      }
    } else {
      this.blockModalShown = true;
      this.showBlockModal();
    }
  }

  showReminderModal(watchTime) {
    const modal = document.createElement('div');
    modal.className = 'yfg-reminder-modal';
    
    const nextInterval = this.currentReminderIndex < this.reminderIntervals.length ? 
                        this.reminderIntervals[this.currentReminderIndex] : 0;
    
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>⏰ Watch Time Reminder</h3>
        <p>You have been watching for <strong>${watchTime} minutes</strong>.</p>
        <div class="yfg-modal-buttons">
          ${nextInterval ? `
            <button class="yfg-btn yfg-btn-primary" data-action="continue">
              Continue (${nextInterval} min limit)
            </button>
          ` : ''}
        </div>
        <div class="yfg-modal-tip">
          💡 Regular breaks help maintain focus and prevent eye strain
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      const target = e.target;
      const action = target.getAttribute('data-action');
      
      if (action === 'continue') {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  }

  showBlockModal() {
    // Prevent duplicate block modals
    if (document.querySelector('.yfg-block-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'yfg-block-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>🛑 Session Limit Reached</h3>
        <p>You have reached the maximum continuous watch time.</p>
        <p>Take a break to reset your session.</p>
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-primary" data-action="break">
            Take 5-Minute Break
          </button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      const target = e.target;
      const action = target.getAttribute('data-action');
      
      if (action === 'break') {
        this.forceBreak();
      }
    });

    document.body.appendChild(modal);
  }

  forceBreak() {
    window.location.href = browser.runtime.getURL('ui/blocked.html?reason=session-limit');
  }

  // Called by YouTubeObserver when navigating to a new video
  applyVideoSessionStart() {
    this._sessionFresh = true;
    if (this.currentWatchTime <= 0 && this.currentReminderIndex === 0) {
      this.sessionStart = Date.now();
    }
    this.lastPlaybackTick = 0;
    this.blockModalShown = false;
    void this.persistSessionState(true);
  }

  startNewVideoSession() {
    if (!this.hasLoadedSessionData) {
      this.pendingVideoSessionStart = true;
      return;
    }

    this.applyVideoSessionStart();
  }

  show() {
    this.isVisible = true;
    if (this.renderOverlay && this.overlay) {
      this.attachOverlayToPlayer();
      if (!this.overlay.parentNode) {
        document.body.appendChild(this.overlay);
      }
      this.overlay.style.display = 'block';
    }
  }

  hide() {
    if (this.renderOverlay && this.overlay) {
      this.overlay.style.display = 'none';
    }

    this.isVisible = false;
  }

  showModal(watchTime) {
    this.showReminderModal(watchTime);
  }

  destroy() {
    void this.persistSessionState(true);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
  }
}

window.TimerOverlay = TimerOverlay;