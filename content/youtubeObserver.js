/**
 * YouTube Observer - Main content script coordinator (JS version)
 * Observes page changes and coordinates all other content scripts
 */

const isYouTubeObserverHostSupported = () => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class YouTubeObserver {
  static navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  static activityPingIntervalMs = 15000;

  constructor() {
    this.currentVideoId = null;
    this.currentUrl = '';
    this.previousUrl = '';
    this.isWatching = false;
    this.watchFlexyObserver = null;
    this.observedWatchFlexy = null;
    this.navigationCheckTimeout = null;
    this.researchPromptPromise = null;
    this.lastActivityPingAt = 0;
    this._navigationInProgress = false;
    this._videoAbortController = null;
    this.boundHandleBeforeUnload = () => {
      browser.runtime.sendMessage({
        type: 'page-unload',
        data: {}
      }).catch(() => {});
    };
    this.boundTrackSearchNavigation = (event) => this.trackSearchNavigation(event);
    this.boundTrackActivity = () => this.trackActivity();
    this.boundHandleNavigationSignal = () => {
      this.attachWatchFlexyObserver();
      this.scheduleUrlChangeCheck();
    };
    this.storage = null;
    this.timeUtils = null;
    this.recommendationBlocker = null;
    this.browsingMode = null;
    this.timerOverlay = null;
    this.topicGuard = null;
    this.init();
  }

  static getInstance() {
    if (!YouTubeObserver.instance) {
      YouTubeObserver.instance = new YouTubeObserver();
    }
    return YouTubeObserver.instance;
  }

  async init() {
    await this.waitForDependencies();
    
    this.storage = window.StorageManager.getInstance();
    this.timeUtils = window.TimeUtils.getInstance();
    
    this.initializeComponents();
    this.setupEventListeners();
    this.observePageChanges();
    this.detectCurrentState();
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

  setupEventListeners() {
    if (browser.runtime.onMessage) {
      browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        this.handleBackgroundMessage(message);
      });
    }

    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);

    document.addEventListener('click', this.boundTrackSearchNavigation, true);
    document.addEventListener('click', this.boundTrackActivity);
    document.addEventListener('keypress', this.boundTrackActivity);
    document.addEventListener('scroll', this.boundTrackActivity, { passive: true });
  }

  observePageChanges() {
    for (const eventName of YouTubeObserver.navigationEventNames) {
      document.addEventListener(eventName, this.boundHandleNavigationSignal);
    }

    this.attachWatchFlexyObserver();
    this.scheduleUrlChangeCheck();

    window.addEventListener('popstate', this.boundHandleNavigationSignal);
  }

  attachWatchFlexyObserver() {
    const watchFlexy = document.querySelector('ytd-watch-flexy');

    if (watchFlexy === this.observedWatchFlexy) {
      return;
    }

    if (this.watchFlexyObserver) {
      this.watchFlexyObserver.disconnect();
    }
    this.observedWatchFlexy = watchFlexy;

    if (!watchFlexy) {
      this.scheduleUrlChangeCheck();
      return;
    }

    this.watchFlexyObserver = new MutationObserver(() => {
      this.scheduleUrlChangeCheck();
    });

    this.watchFlexyObserver.observe(watchFlexy, {
      attributes: true,
      attributeFilter: ['video-id', 'hidden']
    });

    this.scheduleUrlChangeCheck();
  }

  scheduleUrlChangeCheck() {
    if (this.navigationCheckTimeout !== null) {
      window.clearTimeout(this.navigationCheckTimeout);
    }

    this.navigationCheckTimeout = window.setTimeout(() => {
      this.navigationCheckTimeout = null;
      const nextUrl = window.location.href;

      if (nextUrl !== this.currentUrl) {
        this.handleUrlChange(nextUrl);
      }
    }, 50);
  }

  async handleUrlChange(nextUrl = window.location.href) {
    // Guard against concurrent runs — yt-navigate-finish and detectCurrentState
    // can both fire on page load, launching two async chains simultaneously.
    if (this._navigationInProgress) return;
    this._navigationInProgress = true;
    try {
      const previousUrl = this.currentUrl;
      this.previousUrl = previousUrl;
      this.currentUrl = nextUrl;
      this.updateSearchNavigationState(previousUrl, nextUrl);

      if (nextUrl.includes('/watch')) {
        this.handleWatchPage();
      }

      const newVideoId = this.extractVideoId(nextUrl);

      if (newVideoId !== this.currentVideoId) {
        if (this.currentVideoId && this.isWatching) {
          this.endVideoWatch(this.currentVideoId);
        }

        this.currentVideoId = newVideoId;

        if (newVideoId) {
          await this.startVideoWatch(newVideoId);
        }
      }

      if (nextUrl.includes('/shorts/')) {
        this.handleShortsPage();
      } else if (nextUrl.includes('/watch')) {
        // Already handled above so the timer shows immediately.
      } else {
        this.handleNonWatchPage();
      }
    } finally {
      this._navigationInProgress = false;
    }
  }

  async startVideoWatch(videoId) {
    this.isWatching = false;

    // Reset timer for each new video
    if (this.timerOverlay) {
      this.timerOverlay.startNewVideoSession();
    }

    const mode = await this.resolveWatchMode();
    
    browser.runtime.sendMessage({
      type: 'session-start',
      data: { mode: mode }
    }).catch(() => {});

    this.setupVideoEventListeners();
    this.syncVideoPlaybackState(videoId);
  }

  endVideoWatch(videoId) {
    this.isWatching = false;
    if (this._videoAbortController) {
      this._videoAbortController.abort();
      this._videoAbortController = null;
    }
    
    browser.runtime.sendMessage({
      type: 'video-ended',
      data: { videoId: videoId }
    }).catch(() => {});
  }

  setupVideoEventListeners() {
    const video = document.querySelector('video');
    if (!video) return;

    // Abort previous listeners before attaching new ones.
    // YouTube reuses the same <video> element across SPA navigations, so without
    // this, every video navigation stacks another set of listeners permanently.
    if (this._videoAbortController) {
      this._videoAbortController.abort();
    }
    this._videoAbortController = new AbortController();
    const { signal } = this._videoAbortController;
    const videoId = this.currentVideoId;

    video.addEventListener('play', () => {
      if (videoId && !this.isWatching) {
        this.isWatching = true;
        browser.runtime.sendMessage({ type: 'video-started', data: { videoId } }).catch(() => {});
      }
    }, { signal });

    video.addEventListener('pause', () => {
      if (videoId && this.isWatching) {
        this.isWatching = false;
        browser.runtime.sendMessage({ type: 'video-paused', data: { videoId } }).catch(() => {});
      }
    }, { signal });

    video.addEventListener('ended', () => {
      if (videoId) {
        this.isWatching = false;
        browser.runtime.sendMessage({ type: 'video-ended', data: { videoId } }).catch(() => {});
      }
    }, { signal });
  }

  syncVideoPlaybackState(videoId) {
    if (!videoId) {
      this.isWatching = false;
      return;
    }

    const video = document.querySelector('video');
    const isActivelyPlaying = Boolean(video && !video.paused && !video.ended && video.readyState > 2);

    if (isActivelyPlaying && !this.isWatching) {
      this.isWatching = true;
      browser.runtime.sendMessage({ type: 'video-started', data: { videoId } }).catch(() => {});
      return;
    }

    if (!isActivelyPlaying) {
      this.isWatching = false;
    }
  }

  async resolveWatchMode() {
    const settings = await this.storage.getSettings();
    const resolvedVideoId = sessionStorage.getItem('yt-mode-video-id');
    const pendingWatchMode = sessionStorage.getItem('yfg-pending-watch-mode');
    const hasActiveResearchTopic = settings.research.mode === 'research' && settings.research.currentTopic.length > 0;
    const needsResearchTopic = settings.research.mode === 'research' && settings.research.currentTopic.length === 0;

    if (settings.browsingMode && settings.browsingMode.active) {
      return 'entertainment';
    }

    if (this.currentVideoId && pendingWatchMode === 'entertainment') {
      sessionStorage.setItem('yt-mode-video-id', this.currentVideoId);
      sessionStorage.removeItem('yt-from-search');
      sessionStorage.removeItem('yfg-pending-watch-mode');
      return 'entertainment';
    }

    if (hasActiveResearchTopic) {
      return 'research';
    }

    if (this.currentVideoId && needsResearchTopic && resolvedVideoId !== this.currentVideoId) {
      return this.showResearchModePrompt();
    }

    if (this.currentVideoId && this.cameFromSearch() && resolvedVideoId !== this.currentVideoId) {
      return this.showResearchModePrompt();
    }

    if (settings.research.mode) {
      return settings.research.mode;
    }

    return 'entertainment';
  }

  cameFromSearch() {
    return sessionStorage.getItem('yt-from-search') === 'true';
  }

  showResearchModePrompt() {
    if (this.researchPromptPromise) {
      return this.researchPromptPromise;
    }

    if (document.querySelector('.yfg-research-modal')) {
      return this.researchPromptPromise || Promise.resolve('entertainment');
    }

    this.researchPromptPromise = new Promise((resolve) => {
      const modal = this.createResearchModeModal(resolve);
      document.body.appendChild(modal);
    });

    return this.researchPromptPromise;
  }

  createResearchModeModal(resolveMode) {
    const modal = document.createElement('div');
    modal.className = 'yfg-research-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>What are you here for?</h3>
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-research" data-mode="research">Research</button>
          <button class="yfg-btn yfg-btn-entertainment" data-mode="entertainment">Entertainment</button>
        </div>
      </div>
    `;

    modal.addEventListener('click', async (e) => {
      const target = e.target;
      const mode = target.getAttribute('data-mode');

      if (mode) {
        await this.setSessionMode(mode);
        this.researchPromptPromise = null;
        resolveMode(mode);
        modal.remove();
      }
    });

    return modal;
  }

  async setSessionMode(mode) {
    await this.storage.saveSettings({
      research: {
        mode: mode,
        currentTopic: mode === 'research' ? this.extractTopicFromPage() : [],
        sessionStart: Date.now()
      }
    });

    if (this.currentVideoId) {
      sessionStorage.setItem('yt-mode-video-id', this.currentVideoId);
    }

    sessionStorage.removeItem('yt-from-search');

    if (this.topicGuard && this.topicGuard.refreshResearchState) {
      await this.topicGuard.refreshResearchState();
    }

    if (window.location.href.includes('/watch')) {
      if (mode === 'research') {
        this.timerOverlay && this.timerOverlay.hide();
      } else {
        this.timerOverlay && this.timerOverlay.show();
      }
    }

    browser.runtime.sendMessage({
      type: 'mode-change',
      data: { mode: mode }
    }).catch(() => {});
  }

  trackSearchNavigation(event) {
    const target = event.target;
    const videoLink = target && target.closest ? target.closest('a[href*="/watch"]') : null;

    if (videoLink && window.location.pathname === '/results') {
      sessionStorage.setItem('yt-from-search', 'true');
    }
  }

  updateSearchNavigationState(previousUrl, nextUrl) {
    if (nextUrl.includes('/results')) {
      const searchQuery = new URL(nextUrl).searchParams.get('search_query');
      sessionStorage.setItem('yt-from-search', 'true');
      if (searchQuery) {
        sessionStorage.setItem('yt-last-search-query', searchQuery);
      }
      sessionStorage.removeItem('yt-mode-video-id');
      return;
    }

    if (nextUrl.includes('/watch') && previousUrl.includes('/results')) {
      sessionStorage.setItem('yt-from-search', 'true');
      sessionStorage.removeItem('yt-mode-video-id');
      return;
    }

    if (!nextUrl.includes('/watch') && !nextUrl.includes('/results')) {
      sessionStorage.removeItem('yt-from-search');
      sessionStorage.removeItem('yt-mode-video-id');
      sessionStorage.removeItem('yt-last-search-query');
    }
  }

  extractTopicFromPage() {
    const title = document.title;
    const searchQuery = new URLSearchParams(window.location.search).get('search_query') || sessionStorage.getItem('yt-last-search-query');
    const ignoredWords = new Set(['youtube', 'video', 'official', 'channel', 'watch', 'episode', 'live']);
    
    const keywords = [];
    
    if (searchQuery) {
      keywords.push(...searchQuery.toLowerCase().split(/\s+/));
    }
    
    if (title) {
      const titleWords = title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !ignoredWords.has(word));
      keywords.push(...titleWords);
    }
    
    return [...new Set(keywords.map((word) => word.trim()).filter((word) => word && !ignoredWords.has(word)))];
  }

  handleShortsPage() {
    // Handled by scheduler
  }

  async handleWatchPage() {
    if (!this.timerOverlay) {
      return;
    }

    const settings = await this.storage.getSettings();
    if (settings.browsingMode && settings.browsingMode.active) {
      if (this.timerOverlay && this.timerOverlay.setTrackingEnabled) {
        this.timerOverlay.setTrackingEnabled(false);
      }
      this.timerOverlay.hide();
      return;
    }

    if (settings.research.mode === 'research') {
      if (this.timerOverlay && this.timerOverlay.setTrackingEnabled) {
        this.timerOverlay.setTrackingEnabled(false);
      }
      this.timerOverlay.hide();
      return;
    }

    if (this.timerOverlay && this.timerOverlay.setTrackingEnabled) {
      this.timerOverlay.setTrackingEnabled(true);
    }
    this.timerOverlay.show();
  }

  handleHomePage() {
    if (this.timerOverlay) {
      if (this.timerOverlay.setTrackingEnabled) {
        this.timerOverlay.setTrackingEnabled(false);
      }
      this.timerOverlay.hide();
    }
  }

  handleNonWatchPage() {
    this.handleHomePage();
  }

  trackActivity() {
    const now = Date.now();
    if ((now - this.lastActivityPingAt) < YouTubeObserver.activityPingIntervalMs) return;
    this.lastActivityPingAt = now;
    browser.runtime.sendMessage({
      type: 'activity',
      data: { timestamp: now }
    }).catch(() => {});
  }

  handleBackgroundMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'mode-change':
        this.applyExternalModeChange(data.mode);
        break;
        
      case 'show-timer-modal':
        if (this.timerOverlay) {
          this.timerOverlay.showModal(data.watchTime);
        }
        break;
    }
  }

  async applyExternalModeChange(mode) {
    if (this.currentVideoId) {
      sessionStorage.setItem('yt-mode-video-id', this.currentVideoId);
    }

    if (window.location.href.includes('/watch')) {
      if (mode === 'research') {
        if (this.timerOverlay && this.timerOverlay.setTrackingEnabled) {
          this.timerOverlay.setTrackingEnabled(false);
        }
        this.timerOverlay && this.timerOverlay.hide();
      } else {
        if (this.timerOverlay && this.timerOverlay.setTrackingEnabled) {
          this.timerOverlay.setTrackingEnabled(true);
        }
        this.timerOverlay && this.timerOverlay.show();
      }
    }

    if (this.topicGuard && this.topicGuard.refreshResearchState) {
      await this.topicGuard.refreshResearchState();
    }

    if (mode !== 'research') {
      sessionStorage.removeItem('yt-from-search');
    }
  }

  extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  detectCurrentState() {
    this.currentUrl = window.location.href;
    this.previousUrl = document.referrer;
    this.currentVideoId = this.extractVideoId(this.currentUrl);

    if (this.currentVideoId) {
      this.startVideoWatch(this.currentVideoId);
      this.handleWatchPage();
    } else {
      this.handleNonWatchPage();
    }
  }

  initializeComponents() {
    if (window.RecommendationBlocker) {
      this.recommendationBlocker = window.RecommendationBlocker.getInstance();
    }

    if (window.BrowsingModeController) {
      this.browsingMode = window.BrowsingModeController.getInstance();
    }
    
    if (window.TimerOverlay) {
      this.timerOverlay = window.TimerOverlay.getInstance();
    }
    
    if (window.TopicGuard) {
      this.topicGuard = window.TopicGuard.getInstance();
    }
  }
}

// Initialize when DOM is ready
if (isYouTubeObserverHostSupported()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      YouTubeObserver.getInstance();
    });
  } else {
    YouTubeObserver.getInstance();
  }
}