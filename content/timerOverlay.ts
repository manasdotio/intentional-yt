/**
 * Timer Overlay for YouTube Focus Guard
 * Shows watch time and periodic reminders
 */

class TimerOverlay {
  private static instance: TimerOverlay;
  private readonly renderOverlay: boolean = false;
  private overlay: HTMLElement | null = null;
  private timeElement: HTMLElement | null = null;
  private nextReminderElement: HTMLElement | null = null;
  private modeElement: HTMLElement | null = null;
  private topicElement: HTMLElement | null = null;
  private intervalId: number | null = null;
  private sessionStart: number = Date.now();
  private currentWatchTime: number = 0;
  private lastPlaybackTick: number = 0;
  private reminderIntervals: number[] = [25, 15, 10, 5];
  private currentReminderIndex: number = 0;
  private isVisible: boolean = false;
  private blockModalShown: boolean = false;
  private storage: any;
  private timeUtils: any;
  private lastContextRefresh: number = 0;
  private lastPersistedAt: number = 0;
  private hasLoadedSessionData: boolean = false;
  private pendingVideoSessionStart: boolean = false;
  private _sessionFresh: boolean = false;
  private readonly boundPersistSessionState = () => {
    void this.persistSessionState(true);
  };
  
  static getInstance(): TimerOverlay {
    if (!TimerOverlay.instance) {
      TimerOverlay.instance = new TimerOverlay();
    }
    return TimerOverlay.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.waitForDependencies();
    
    this.storage = (window as any).StorageManager.getInstance();
    this.timeUtils = (window as any).TimeUtils.getInstance();
    
    this.createOverlay();
    await this.loadSessionData();
    this.setupPersistenceListeners();
    this.startTimer();

    if (window.location.href.includes('/watch')) {
      this.show();
    }
  }

  private async waitForDependencies(): Promise<void> {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if ((window as any).StorageManager && (window as any).TimeUtils) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  private createOverlay(): void {
    if (!this.renderOverlay) {
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'yfg-timer-overlay';
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

    hideTimerBtn?.addEventListener('click', () => {
      this.hide();
    });

    document.body.appendChild(this.overlay);

    this.timeElement = this.overlay.querySelector('#yfg-watch-time') as HTMLElement | null;
    this.nextReminderElement = this.overlay.querySelector('#yfg-next-reminder') as HTMLElement | null;
    this.modeElement = this.overlay.querySelector('#yfg-overlay-mode') as HTMLElement | null;
    this.topicElement = this.overlay.querySelector('#yfg-overlay-topic') as HTMLElement | null;

    if (this.isVisible) {
      this.overlay.style.display = 'block';
    }
  }

  private setupPersistenceListeners(): void {
    window.addEventListener('pagehide', this.boundPersistSessionState);
    window.addEventListener('beforeunload', this.boundPersistSessionState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        void this.persistSessionState(true);
      }
    });
  }

  private async loadSessionData(): Promise<void> {
    if (this._sessionFresh) {
      this.hasLoadedSessionData = true;
      return;
    }

    const settings = await this.storage.getSettings();
    const storedStart = settings.watchTimer.sessionStart || 0;
    const storedIndex = settings.watchTimer.currentInterval || 0;
    const storedWatchTime = settings.watchTimer.currentWatchTime || 0;

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

  private startTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      try {
        this.updateTimer();
        this.checkReminders();
      } catch (error) {
        console.error('[YFG] timer tick error:', error);
      }
    }, 1000) as any;
  }

  private updateTimer(): void {
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
      void this.refreshOverlayContext();
    }

    if (this.renderOverlay && this.timeElement) {
      this.timeElement.textContent = this.timeUtils.formatTime(this.currentWatchTime);
    }

    if (this.renderOverlay) {
      this.updateNextReminderDisplay();
    }
  }

  private syncPlaybackTime(): void {
    const video = document.querySelector('video') as HTMLVideoElement | null;
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

  private async persistSessionState(force: boolean = false): Promise<void> {
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
        totalToday: 0,
      }
    });
  }

  private updateNextReminderDisplay(): void {
    if (!this.nextReminderElement) return;

    if (this.currentReminderIndex >= this.reminderIntervals.length) {
      this.nextReminderElement.textContent = 'Session limit reached';
      return;
    }

    let cumulativeThreshold = 0;
    for (let index = 0; index <= this.currentReminderIndex; index++) {
      cumulativeThreshold += this.reminderIntervals[index];
    }

    const sessionMinutes = Math.floor(this.currentWatchTime / 60);
    const minutesUntilReminder = Math.max(0, cumulativeThreshold - sessionMinutes);

    if (minutesUntilReminder === 0) {
      this.nextReminderElement.textContent = 'Next reminder: now';
    } else {
      this.nextReminderElement.textContent = `Next reminder: ${minutesUntilReminder}m`;
    }
  }

  private async refreshOverlayContext(): Promise<void> {
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

  private attachOverlayToPlayer(): void {
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

  private checkReminders(): void {
    if (this.blockModalShown || !this.isVisible || !this.timeUtils || !window.location.href.includes('/watch')) return;

    const sessionMinutes = Math.floor(this.currentWatchTime / 60);

    if (this.currentReminderIndex < this.reminderIntervals.length) {
      let cumulativeThreshold = 0;
      for (let index = 0; index <= this.currentReminderIndex; index++) {
        cumulativeThreshold += this.reminderIntervals[index];
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

  private showReminderModal(watchTime: number): void {
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
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      
      if (action === 'continue') {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
    
    // Auto-remove after 30 seconds if no action
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 30000);
  }

  private showBlockModal(): void {
    if (document.querySelector('.yfg-block-modal')) {
      return;
    }

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
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');
      
      if (action === 'break') {
        this.forceBreak();
      }
    });

    document.body.appendChild(modal);
  }

  private forceBreak(): void {
    window.location.href = browser.runtime.getURL('ui/blocked.html?reason=session-limit');
  }

  private applyVideoSessionStart(): void {
    this._sessionFresh = true;
    if (this.currentWatchTime <= 0 && this.currentReminderIndex === 0) {
      this.sessionStart = Date.now();
    }
    this.lastPlaybackTick = 0;
    this.blockModalShown = false;
    void this.persistSessionState(true);
  }

  public startNewVideoSession(): void {
    if (!this.hasLoadedSessionData) {
      this.pendingVideoSessionStart = true;
      return;
    }

    this.applyVideoSessionStart();
  }

  show(): void {
    this.isVisible = true;
    if (this.renderOverlay && this.overlay) {
      this.attachOverlayToPlayer();
      if (!this.overlay.parentNode) {
        document.body.appendChild(this.overlay);
      }
      this.overlay.style.display = 'block';
    }
  }

  hide(): void {
    if (this.renderOverlay && this.overlay) {
      this.overlay.style.display = 'none';
    }

    this.isVisible = false;
  }

  showModal(watchTime: number): void {
    this.showReminderModal(watchTime);
  }

  destroy(): void {
    void this.persistSessionState(true);

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
  }
}

// Make available globally
(window as any).TimerOverlay = TimerOverlay;