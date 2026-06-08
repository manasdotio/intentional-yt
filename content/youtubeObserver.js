/**
 * YouTube Observer - Main content script coordinator
 * Observes page changes and coordinates all other content scripts
 */

const isYouTubeObserverHostSupported = () => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class YouTubeObserver {
  static navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  static activityPingIntervalMs = 15000;
  static instance;
  
  currentVideoId = null;
  currentUrl = '';
  previousUrl = '';
  isWatching = false;
  watchFlexyObserver = null;
  observedWatchFlexy = null;
  navigationCheckTimeout = null;
  lastActivityPingAt = 0;
  _navigationInProgress = false;
  _videoAbortController = null;
  
  boundHandleBeforeUnload = () => {
    browser.runtime.sendMessage({
      type: 'page-unload',
      data: {}
    }).catch(() => {});
  };

  boundTrackActivity = () => this.trackActivity();
  
  boundHandleNavigationSignal = () => {
    this.attachWatchFlexyObserver();
    this.scheduleUrlChangeCheck();
  };

  storage;
  timeUtils;
  recommendationBlocker;
  timerOverlay;
  topicGuard;
  
  static getInstance() {
    if (!YouTubeObserver.instance) {
      YouTubeObserver.instance = new YouTubeObserver();
    }
    return YouTubeObserver.instance;
  }

  constructor() {
    this.init();
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
    // Listen for background messages
    browser.runtime.onMessage.addListener((message) => {
      this.handleBackgroundMessage(message);
    });

    // Page unload - end session
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);

    // User activity tracking
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

    this.watchFlexyObserver?.disconnect();
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
    if (this._navigationInProgress) return;
    this._navigationInProgress = true;
    
    try {
      // Immediately block/redirect Shorts
      if (nextUrl.includes('/shorts/')) {
        window.location.href = 'https://www.youtube.com/';
        return;
      }

      const previousUrl = this.currentUrl;
      this.previousUrl = previousUrl;
      this.currentUrl = nextUrl;

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

      // Route layout updates
      if (nextUrl.includes('/watch')) {
        await this.handleWatchPage();
      } else if (nextUrl.includes('/results')) {
        this.handleSearchResultsPage();
      } else {
        await this.handleNonWatchPage();
      }
    } finally {
      this._navigationInProgress = false;
    }
  }

  async startVideoWatch(videoId) {
    this.isWatching = false;

    if (this.timerOverlay) {
      this.timerOverlay.startNewVideoSession();
    }

    const settings = await this.storage.getSettings();
    const isIntentional = await this.checkVideoIntentionality(videoId, settings);

    browser.runtime.sendMessage({
      type: 'session-start',
      data: { isIntentional: isIntentional }
    });

    this.setupVideoEventListeners();
    this.syncVideoPlaybackState(videoId);
  }

  async checkVideoIntentionality(videoId, settings) {
    if (!settings.activeIntention) {
      return false;
    }
    if (this.topicGuard) {
      const allowed = await this.topicGuard.evaluateCurrentVideoAccess();
      return allowed;
    }
    return true;
  }

  endVideoWatch(videoId) {
    this.isWatching = false;
    this._videoAbortController?.abort();
    this._videoAbortController = null;
    
    browser.runtime.sendMessage({
      type: 'video-ended',
      data: { videoId: videoId }
    });
  }

  setupVideoEventListeners() {
    const video = document.querySelector('video');
    if (!video) return;

    this._videoAbortController?.abort();
    this._videoAbortController = new AbortController();
    const { signal } = this._videoAbortController;

    const videoId = this.currentVideoId;
    
    video.addEventListener('play', async () => {
      if (videoId && !this.isWatching) {
        this.isWatching = true;
        const settings = await this.storage.getSettings();
        const isIntentional = await this.checkVideoIntentionality(videoId, settings);

        browser.runtime.sendMessage({
          type: 'video-started',
          data: { videoId: videoId, isIntentional: isIntentional }
        });
      }
    }, { signal });

    video.addEventListener('pause', () => {
      if (videoId && this.isWatching) {
        this.isWatching = false;
        browser.runtime.sendMessage({
          type: 'video-paused',
          data: { videoId: videoId }
        });
      }
    }, { signal });

    video.addEventListener('ended', () => {
      if (videoId) {
        this.isWatching = false;
        browser.runtime.sendMessage({
          type: 'video-ended',
          data: { videoId: videoId }
        });
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
      
      this.storage.getSettings().then((settings) => {
        return this.checkVideoIntentionality(videoId, settings);
      }).then((isIntentional) => {
        browser.runtime.sendMessage({
          type: 'video-started',
          data: { videoId, isIntentional }
        });
      });
      return;
    }

    if (!isActivelyPlaying) {
      this.isWatching = false;
    }
  }

  async handleWatchPage() {
    if (this.recommendationBlocker) {
      this.recommendationBlocker.hidePortal();
    }

    const settings = await this.storage.getSettings();

    // Trigger drift check-in and portal overlay logic
    if (this.topicGuard) {
      this.topicGuard.checkCurrentVideo();
    }

    if (this.timerOverlay) {
      this.timerOverlay.setTrackingEnabled(true);
      if (settings.activeIntention) {
        this.timerOverlay.show();
      } else {
        this.timerOverlay.hide();
      }
    }
  }

  handleSearchResultsPage() {
    if (this.recommendationBlocker) {
      this.recommendationBlocker.hidePortal();
    }
    if (this.topicGuard) {
      this.topicGuard.hideCheckInOverlays();
    }
    if (this.timerOverlay) {
      this.timerOverlay.setTrackingEnabled(false);
      this.timerOverlay.show(); // keeps active intention visible
    }
  }

  async handleNonWatchPage() {
    if (this.timerOverlay) {
      this.timerOverlay.setTrackingEnabled(false);
      this.timerOverlay.hide();
    }
    if (this.topicGuard) {
      this.topicGuard.hideCheckInOverlays();
    }

    // Render Mindful Portal on homepage
    if (this.recommendationBlocker && this.isHomePage()) {
      await this.recommendationBlocker.showPortal();
    }
  }

  isHomePage() {
    const url = window.location.href;
    return (url === 'https://www.youtube.com/' ||
      url === 'https://youtube.com/' ||
      url.includes('youtube.com/?') ||
      url.includes('youtube.com/feed/subscriptions')) &&
      !url.includes('/watch') &&
      !url.includes('/results');
  }

  trackActivity() {
    const now = Date.now();
    if ((now - this.lastActivityPingAt) < YouTubeObserver.activityPingIntervalMs) {
      return;
    }

    this.lastActivityPingAt = now;
    browser.runtime.sendMessage({
      type: 'activity',
      data: { timestamp: now }
    }).catch(() => {});
  }

  handleBackgroundMessage(message) {
    const { type } = message;
    
    switch (type) {
      case 'intent-updated':
        this.handleUrlChange(window.location.href);
        break;
    }
  }

  detectCurrentState() {
    this.currentUrl = window.location.href;
    this.previousUrl = document.referrer;
    this.currentVideoId = this.extractVideoId(this.currentUrl);
    
    if (this.currentVideoId && document.querySelector('video')) {
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
    
    if (window.TimerOverlay) {
      this.timerOverlay = window.TimerOverlay.getInstance();
    }
    
    if (window.TopicGuard) {
      this.topicGuard = window.TopicGuard.getInstance();
    }
  }

  extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
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