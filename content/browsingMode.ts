/**
 * Browsing Mode for YouTube Focus Guard
 * Adds a deliberate pause on the home page and enforces a short browsing timer.
 */

class BrowsingModeController {
  private static readonly navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  private static instance: BrowsingModeController;
  private storage: any;
  private timeUtils: any;
  private overlay: HTMLElement | null = null;
  private timeElement: HTMLElement | null = null;
  private metaElement: HTMLElement | null = null;
  private intervalId: number | null = null;
  private navigationCheckTimeout: number | null = null;
  private currentUrl = '';
  private expiryModalOpen = false;
  private readonly boundScheduleRouteCheck = () => this.scheduleRouteCheck();

  static getInstance(): BrowsingModeController {
    if (!BrowsingModeController.instance) {
      BrowsingModeController.instance = new BrowsingModeController();
    }
    return BrowsingModeController.instance;
  }

  constructor() {
    void this.init();
  }

  private async init(): Promise<void> {
    await this.waitForDependencies();
    this.storage = (window as any).StorageManager.getInstance();
    this.timeUtils = (window as any).TimeUtils.getInstance();
    this.createOverlay();
    this.setupMessaging();
    this.observeNavigation();
    this.startTicker();
    this.currentUrl = window.location.href;
    await this.handleRouteChange(this.currentUrl);
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

  private setupMessaging(): void {
    browser.runtime?.onMessage?.addListener((message: any) => {
      if (message?.type === 'stop-browsing') {
        void this.stopBrowsingSession();
      }
    });
  }

  private observeNavigation(): void {
    for (const eventName of BrowsingModeController.navigationEventNames) {
      document.addEventListener(eventName, this.boundScheduleRouteCheck as EventListener);
    }

    window.addEventListener('popstate', this.boundScheduleRouteCheck);
    this.scheduleRouteCheck();
  }

  private scheduleRouteCheck(): void {
    if (this.navigationCheckTimeout !== null) {
      window.clearTimeout(this.navigationCheckTimeout);
    }

    this.navigationCheckTimeout = window.setTimeout(() => {
      this.navigationCheckTimeout = null;
      const nextUrl = window.location.href;
      if (nextUrl !== this.currentUrl) {
        void this.handleRouteChange(nextUrl);
      } else {
        void this.updateOverlayVisibility();
      }
    }, 50);
  }

  private async handleRouteChange(nextUrl: string): Promise<void> {
    this.currentUrl = nextUrl;

    if (!this.isHomePage(nextUrl)) {
      sessionStorage.removeItem('yfg-home-intent-resolved');
    }

    const settings = await this.storage.getSettings();

    if (settings.browsingMode.cooldownUntil && settings.browsingMode.cooldownUntil > Date.now()) {
      this.redirectToBrowsingCooldown();
      return;
    }

    if (this.shouldPromptForIntent(settings, nextUrl)) {
      this.showIntentPrompt();
    }

    await this.updateOverlayVisibility();
    this.disableAutoplay();
  }

  private isHomePage(url: string = window.location.href): boolean {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/' && !parsed.searchParams.has('v') && !parsed.searchParams.has('search_query');
    } catch {
      return false;
    }
  }

  private isWatchPage(url: string = window.location.href): boolean {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/watch' && parsed.searchParams.has('v');
    } catch {
      return false;
    }
  }

  private shouldPromptForIntent(settings: any, nextUrl: string): boolean {
    if (!settings.extensionEnabled) return false;
    if (!this.isHomePage(nextUrl)) return false;
    if (settings.browsingMode.active) return false;
    if (settings.browsingMode.cooldownUntil && settings.browsingMode.cooldownUntil > Date.now()) return false;
    if (document.querySelector('.yfg-intent-modal') || document.querySelector('.yfg-browsing-warning-modal')) return false;
    return sessionStorage.getItem('yfg-home-intent-resolved') !== 'true';
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'yfg-timer-overlay yfg-browsing-overlay';
    this.overlay.style.display = 'none';
    this.overlay.innerHTML = `
      <div class="yfg-timer-content yfg-browsing-overlay-content">
        <div class="yfg-timer-title">Browsing Mode</div>
        <div class="yfg-timer-time yfg-browsing-time" id="yfg-browsing-time-left">15:00</div>
        <div class="yfg-timer-next yfg-browsing-meta" id="yfg-browsing-meta">Extensions left: 2</div>
      </div>
    `;

    this.timeElement = this.overlay.querySelector('#yfg-browsing-time-left') as HTMLElement | null;
    this.metaElement = this.overlay.querySelector('#yfg-browsing-meta') as HTMLElement | null;
    document.body.appendChild(this.overlay);
  }

  private startTicker(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      void this.tick();
    }, 1000);
  }

  private async tick(): Promise<void> {
    const settings = await this.storage.getSettings();
    const browsingMode = settings.browsingMode;

    if (browsingMode.cooldownUntil && browsingMode.cooldownUntil > Date.now()) {
      this.hideOverlay();
      return;
    }

    if (!browsingMode.active) {
      this.hideOverlay();
      return;
    }

    if (this.expiryModalOpen) {
      if (this.timeElement) {
        this.timeElement.textContent = '00:00';
      }
      if (this.metaElement) {
        this.metaElement.textContent = 'Awaiting your decision';
      }
      this.hideOverlay();
      return;
    }

    await this.updateOverlayVisibility();
    this.disableAutoplay();

    const timeLeftMs = this.getTimeLeftMs(browsingMode);
    const timeLeftSeconds = Math.max(0, Math.ceil(timeLeftMs / 1000));

    if (this.timeElement) {
      this.timeElement.textContent = this.timeUtils.formatTime(timeLeftSeconds);
    }

    if (this.metaElement) {
      const remainingExtensions = Math.max(0, 2 - browsingMode.extensionsUsed);
      this.metaElement.textContent = `Extensions left: ${remainingExtensions}`;
    }

    if (timeLeftMs <= 0 && !this.expiryModalOpen) {
      await this.showExpiryModal();
    }
  }

  private getTimeLeftMs(browsingMode: { startTime: number; duration: number }): number {
    return browsingMode.startTime + browsingMode.duration - Date.now();
  }

  private attachOverlayToPlayer(): void {
    if (!this.overlay) return;

    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (player && this.overlay.parentNode !== player) {
      this.overlay.classList.add('yfg-browsing-overlay-player');
      player.appendChild(this.overlay);
    } else if (!player && this.overlay.parentNode !== document.body) {
      this.overlay.classList.remove('yfg-browsing-overlay-player');
      document.body.appendChild(this.overlay);
    }
  }

  private async updateOverlayVisibility(): Promise<void> {
    const settings = await this.storage.getSettings();
    if (settings.browsingMode.active && this.isWatchPage()) {
      this.attachOverlayToPlayer();
      this.showOverlay();
      return;
    }

    this.hideOverlay();
  }

  private showOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'block';
    }
  }

  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
  }

  private showIntentPrompt(): void {
    const modal = document.createElement('div');
    modal.className = 'yfg-intent-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>What are you here for?</h3>
        <p>Choose an intention before YouTube takes over your attention.</p>
        <div class="yfg-modal-buttons yfg-intent-buttons">
          <button class="yfg-btn yfg-btn-primary" data-intent="research">Research</button>
          <button class="yfg-btn yfg-btn-secondary" data-intent="entertainment">Entertainment</button>
          <button class="yfg-btn yfg-btn-warning" data-intent="browsing">Just browsing</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement | null;
      const intent = target?.getAttribute('data-intent');
      if (!intent) return;

      modal.remove();

      if (intent === 'browsing') {
        sessionStorage.removeItem('yfg-pending-watch-mode');
        this.showBrowsingWarning();
        return;
      }

      sessionStorage.setItem('yfg-home-intent-resolved', 'true');
      if (intent === 'entertainment') {
        sessionStorage.setItem('yfg-pending-watch-mode', 'entertainment');
        sessionStorage.removeItem('yt-from-search');
        sessionStorage.removeItem('yt-mode-video-id');
      } else {
        sessionStorage.removeItem('yfg-pending-watch-mode');
      }
      const settings = await this.storage.getSettings();
      await this.storage.updateBrowsingMode({
        active: false,
        startTime: 0,
        duration: 15 * 60 * 1000,
        extensionsUsed: 0,
      });
      await this.storage.saveSettings({
        research: {
          mode: intent,
          currentTopic: intent === 'research' ? settings.research.currentTopic : [],
          sessionStart: Date.now(),
        }
      });
    });

    document.body.appendChild(modal);
  }

  private showBrowsingWarning(): void {
    if (document.querySelector('.yfg-browsing-warning-modal')) {
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'yfg-browsing-warning-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>Reminder</h3>
        <p>Browsing usually turns into binge watching.</p>
        <p>Continue anyway?</p>
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-secondary" data-action="cancel">Go Back</button>
          <button class="yfg-btn yfg-btn-warning" data-action="continue">Continue</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.getAttribute('data-action');
      if (!action) return;

      if (action === 'continue') {
        await this.startBrowsingSession();
      }

      modal.remove();
    });

    document.body.appendChild(modal);
  }

  private async startBrowsingSession(): Promise<void> {
    sessionStorage.setItem('yfg-home-intent-resolved', 'true');
    sessionStorage.removeItem('yfg-pending-watch-mode');
    await this.storage.saveSettings({
      research: {
        mode: 'entertainment',
        currentTopic: [],
        sessionStart: Date.now(),
      }
    });
    await this.storage.updateBrowsingMode({
      active: true,
      startTime: Date.now(),
      duration: 15 * 60 * 1000,
      extensionsUsed: 0,
      cooldownUntil: 0,
    });

    this.expiryModalOpen = false;
    await this.updateOverlayVisibility();
    this.disableAutoplay();
  }

  private async stopBrowsingSession(): Promise<void> {
    this.expiryModalOpen = false;
    await this.storage.updateBrowsingMode({
      active: false,
      startTime: 0,
      duration: 15 * 60 * 1000,
      extensionsUsed: 0,
    });
    this.hideOverlay();
  }

  private async showExpiryModal(): Promise<void> {
    if (document.querySelector('.yfg-browsing-expiry-modal')) {
      return;
    }

    this.expiryModalOpen = true;
    this.hideOverlay();
    const settings = await this.storage.getSettings();
    const canExtend = settings.browsingMode.extensionsUsed < 2;

    const modal = document.createElement('div');
    modal.className = 'yfg-browsing-expiry-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>You've been browsing for a while.</h3>
        <p>${canExtend ? 'Choose whether to stop now or continue for 10 more minutes.' : 'You have used both extensions. Continuing will start a 30 minute cooldown.'}</p>
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-secondary" data-action="stop">Stop Browsing</button>
          <button class="yfg-btn yfg-btn-warning" data-action="extend">Continue 10 minutes</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', async (event: Event) => {
      const target = event.target as HTMLElement | null;
      const action = target?.getAttribute('data-action');
      if (!action) return;

      if (action === 'stop') {
        await this.stopBrowsingSession();
      } else if (action === 'extend') {
        const latestSettings = await this.storage.getSettings();
        if (latestSettings.browsingMode.extensionsUsed < 2) {
          await this.storage.updateBrowsingMode({
            startTime: Date.now(),
            duration: 10 * 60 * 1000,
            extensionsUsed: latestSettings.browsingMode.extensionsUsed + 1,
          });
        } else {
          await this.activateBrowsingCooldown();
        }
      }

      modal.remove();
      this.expiryModalOpen = false;
      await this.updateOverlayVisibility();
    });

    document.body.appendChild(modal);
  }

  private async activateBrowsingCooldown(): Promise<void> {
    const cooldownUntil = Date.now() + (30 * 60 * 1000);
    await this.storage.updateBrowsingMode({
      active: false,
      startTime: 0,
      duration: 15 * 60 * 1000,
      extensionsUsed: 2,
      cooldownUntil,
    });
    await this.storage.setBlocked('browsing-cooldown');
    this.redirectToBrowsingCooldown();
  }

  private redirectToBrowsingCooldown(): void {
    window.location.href = browser.runtime.getURL('ui/blocked.html?reason=browsing-cooldown');
  }

  private disableAutoplay(): void {
    const autoplayButton = document.querySelector('[data-tooltip-text*="autoplay" i]') as HTMLElement | null;
    if (autoplayButton?.getAttribute('aria-pressed') === 'true') {
      autoplayButton.click();
    }

    const video = document.querySelector('video');
    if (video) {
      video.removeAttribute('autoplay');
    }
  }
}

(window as any).BrowsingModeController = BrowsingModeController;
BrowsingModeController.getInstance();