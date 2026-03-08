/**
 * Browsing Mode for YouTube Focus Guard (JS version)
 * Adds a deliberate pause on the home page and enforces a short browsing timer.
 */

const isBrowsingModeHostSupported = () => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class BrowsingModeController {
  static navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];

  static getInstance() {
    if (!BrowsingModeController.instance) {
      BrowsingModeController.instance = new BrowsingModeController();
    }
    return BrowsingModeController.instance;
  }

  constructor() {
    this.storage = null;
    this.timeUtils = null;
    this.overlay = null;
    this.timeElement = null;
    this.metaElement = null;
    this.intervalId = null;
    this.navigationCheckTimeout = null;
    this.currentUrl = '';
    this.expiryModalOpen = false;
    this.boundScheduleRouteCheck = () => this.scheduleRouteCheck();
    this.init();
  }

  async init() {
    await this.waitForDependencies();
    this.storage = window.StorageManager.getInstance();
    this.timeUtils = window.TimeUtils.getInstance();
    this.createOverlay();
    this.setupMessaging();
    this.observeNavigation();
    this.currentUrl = window.location.href;
    this.handleRouteChange(this.currentUrl);
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

  setupMessaging() {
    if (!browser.runtime || !browser.runtime.onMessage) {
      return;
    }

    browser.runtime.onMessage.addListener((message) => {
      if (!message || !message.type) {
        return;
      }

      if (message.type === 'stop-browsing') {
        this.stopBrowsingSession();
      }
    });
  }

  observeNavigation() {
    for (const eventName of BrowsingModeController.navigationEventNames) {
      document.addEventListener(eventName, this.boundScheduleRouteCheck);
    }

    window.addEventListener('popstate', this.boundScheduleRouteCheck);
    this.scheduleRouteCheck();
  }

  scheduleRouteCheck() {
    if (this.navigationCheckTimeout !== null) {
      window.clearTimeout(this.navigationCheckTimeout);
    }

    this.navigationCheckTimeout = window.setTimeout(() => {
      this.navigationCheckTimeout = null;
      const nextUrl = window.location.href;
      if (nextUrl !== this.currentUrl) {
        this.handleRouteChange(nextUrl);
      } else {
        this.updateOverlayVisibility();
      }
    }, 50);
  }

  async handleRouteChange(nextUrl) {
    this.currentUrl = nextUrl;

    if (!this.isHomePage(nextUrl)) {
      sessionStorage.removeItem('yfg-home-intent-resolved');
    }

    const settings = await this.storage.getSettings();
    this.syncTickerState(settings);

    if (settings.browsingMode.cooldownUntil && settings.browsingMode.cooldownUntil > Date.now()) {
      this.redirectToBrowsingCooldown();
      return;
    }

    if (this.shouldPromptForIntent(settings, nextUrl)) {
      this.showIntentPrompt();
    }

    this.updateOverlayVisibility();
    this.disableAutoplay();
  }

  isHomePage(url = window.location.href) {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/' && !parsed.searchParams.has('v') && !parsed.searchParams.has('search_query');
    } catch {
      return false;
    }
  }

  isWatchPage(url = window.location.href) {
    try {
      const parsed = new URL(url);
      return parsed.pathname === '/watch' && parsed.searchParams.has('v');
    } catch {
      return false;
    }
  }

  shouldPromptForIntent(settings, nextUrl) {
    if (!settings.extensionEnabled) {
      return false;
    }

    if (!this.isHomePage(nextUrl)) {
      return false;
    }

    if (settings.browsingMode.active) {
      return false;
    }

    if (settings.browsingMode.cooldownUntil && settings.browsingMode.cooldownUntil > Date.now()) {
      return false;
    }

    if (document.querySelector('.yfg-intent-modal') || document.querySelector('.yfg-browsing-warning-modal')) {
      return false;
    }

    return sessionStorage.getItem('yfg-home-intent-resolved') !== 'true';
  }

  createOverlay() {
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

    this.timeElement = this.overlay.querySelector('#yfg-browsing-time-left');
    this.metaElement = this.overlay.querySelector('#yfg-browsing-meta');
    document.body.appendChild(this.overlay);
  }

  startTicker() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, 1000);
  }

  stopTicker() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  syncTickerState(settings) {
    if (settings.browsingMode.active) {
      this.startTicker();
      return;
    }

    this.stopTicker();
  }

  async tick() {
    const settings = await this.storage.getSettings();
    const browsingMode = settings.browsingMode;

    if (browsingMode.cooldownUntil && browsingMode.cooldownUntil > Date.now()) {
      this.stopTicker();
      this.hideOverlay();
      return;
    }

    if (!browsingMode.active) {
      this.stopTicker();
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

    this.updateOverlayVisibility();
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
      this.showExpiryModal();
    }
  }

  getTimeLeftMs(browsingMode) {
    return browsingMode.startTime + browsingMode.duration - Date.now();
  }

  attachOverlayToPlayer() {
    if (!this.overlay) {
      return;
    }

    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (player && this.overlay.parentNode !== player) {
      this.overlay.classList.add('yfg-browsing-overlay-player');
      player.appendChild(this.overlay);
    } else if (!player && this.overlay.parentNode !== document.body) {
      this.overlay.classList.remove('yfg-browsing-overlay-player');
      document.body.appendChild(this.overlay);
    }
  }

  async updateOverlayVisibility() {
    const settings = await this.storage.getSettings();
    if (settings.browsingMode.active && this.isWatchPage()) {
      this.attachOverlayToPlayer();
      this.showOverlay();
      return;
    }

    this.hideOverlay();
  }

  showOverlay() {
    if (!this.overlay) {
      return;
    }

    this.overlay.style.display = 'block';
  }

  hideOverlay() {
    if (!this.overlay) {
      return;
    }

    this.overlay.style.display = 'none';
  }

  showIntentPrompt() {
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

    modal.addEventListener('click', async (event) => {
      const target = event.target;
      const intent = target && target.getAttribute ? target.getAttribute('data-intent') : null;
      if (!intent) {
        return;
      }

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
      await this.storage.updateBrowsingMode({
        active: false,
        startTime: 0,
        duration: 15 * 60 * 1000,
        extensionsUsed: 0,
      });

      await this.storage.saveSettings({
        research: {
          mode: intent,
          currentTopic: intent === 'research' ? (await this.storage.getSettings()).research.currentTopic : [],
          sessionStart: Date.now(),
        }
      });
    });

    document.body.appendChild(modal);
  }

  showBrowsingWarning() {
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

    modal.addEventListener('click', async (event) => {
      const target = event.target;
      const action = target && target.getAttribute ? target.getAttribute('data-action') : null;
      if (!action) {
        return;
      }

      if (action === 'continue') {
        await this.startBrowsingSession();
      }

      modal.remove();
    });

    document.body.appendChild(modal);
  }

  async startBrowsingSession() {
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

    this.startTicker();
    this.expiryModalOpen = false;
    this.updateOverlayVisibility();
    this.disableAutoplay();
  }

  async stopBrowsingSession() {
    this.expiryModalOpen = false;
    await this.storage.updateBrowsingMode({
      active: false,
      startTime: 0,
      duration: 15 * 60 * 1000,
      extensionsUsed: 0,
    });
    this.stopTicker();
    this.hideOverlay();
  }

  async showExpiryModal() {
    if (document.querySelector('.yfg-browsing-expiry-modal')) {
      return;
    }

    this.expiryModalOpen = true;
    this.hideOverlay();
    const settings = await this.storage.getSettings();
    const canExtend = settings.browsingMode.extensionsUsed < 2;

    const modal = document.createElement('div');
    modal.className = 'yfg-browsing-expiry-modal';

    const content = document.createElement('div');
    content.className = 'yfg-modal-content';

    const title = document.createElement('h3');
    title.textContent = 'You\'ve been browsing for a while.';

    const message = document.createElement('p');
    message.textContent = canExtend
      ? 'Choose whether to stop now or continue for 10 more minutes.'
      : 'You have used both extensions. Continuing will start a 30 minute cooldown.';

    const buttons = document.createElement('div');
    buttons.className = 'yfg-modal-buttons';

    const stopButton = document.createElement('button');
    stopButton.className = 'yfg-btn yfg-btn-secondary';
    stopButton.type = 'button';
    stopButton.dataset.action = 'stop';
    stopButton.textContent = 'Stop Browsing';

    const extendButton = document.createElement('button');
    extendButton.className = 'yfg-btn yfg-btn-warning';
    extendButton.type = 'button';
    extendButton.dataset.action = 'extend';
    extendButton.textContent = 'Continue 10 minutes';

    buttons.append(stopButton, extendButton);
    content.append(title, message, buttons);
    modal.appendChild(content);

    modal.addEventListener('click', async (event) => {
      const target = event.target;
      const action = target && target.getAttribute ? target.getAttribute('data-action') : null;
      if (!action) {
        return;
      }

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
      this.updateOverlayVisibility();
    });

    document.body.appendChild(modal);
  }

  async activateBrowsingCooldown() {
    const cooldownUntil = Date.now() + (30 * 60 * 1000);
    await this.storage.updateBrowsingMode({
      active: false,
      startTime: 0,
      duration: 15 * 60 * 1000,
      extensionsUsed: 2,
      cooldownUntil,
    });
    await this.storage.setBlocked('browsing-cooldown');
    this.stopTicker();
    this.redirectToBrowsingCooldown();
  }

  redirectToBrowsingCooldown() {
    window.location.href = browser.runtime.getURL('ui/blocked.html?reason=browsing-cooldown');
  }

  disableAutoplay() {
    const autoplayButton = document.querySelector('[data-tooltip-text*="autoplay" i]');
    if (autoplayButton && autoplayButton.getAttribute('aria-pressed') === 'true') {
      autoplayButton.click();
    }

    const video = document.querySelector('video');
    if (video) {
      video.removeAttribute('autoplay');
    }
  }
}

window.BrowsingModeController = BrowsingModeController;
if (isBrowsingModeHostSupported()) {
  BrowsingModeController.getInstance();
}