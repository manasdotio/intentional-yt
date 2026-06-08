/**
 * YouTube Observer - Main content script coordinator
 * Observes page changes and coordinates all other content scripts
 */

const isYouTubeObserverHostSupported = (): boolean => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class YouTubeObserver {
  private static readonly navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  private static readonly activityPingIntervalMs = 15000;
  private static instance: YouTubeObserver;
  
  private currentVideoId: string | null = null;
  private currentUrl: string = '';
  private previousUrl: string = '';
  private isWatching: boolean = false;
  private watchFlexyObserver: MutationObserver | null = null;
  private observedWatchFlexy: Element | null = null;
  private navigationCheckTimeout: number | null = null;
  private lastActivityPingAt: number = 0;
  private _navigationInProgress = false;
  private _videoAbortController: AbortController | null = null;
  
  private readonly boundHandleBeforeUnload = () => {
    browser.runtime.sendMessage({
      type: 'page-unload',
      data: {}
    }).catch(() => {});
  };

  private readonly boundTrackActivity = () => this.trackActivity();
  
  private readonly boundHandleNavigationSignal = () => {
    this.attachWatchFlexyObserver();
    this.scheduleUrlChangeCheck();
  };

  private storage: any;
  private timeUtils: any;
  private recommendationBlocker: any;
  private timerOverlay: any;
  private topicGuard: any;
  
  static getInstance(): YouTubeObserver {
    if (!YouTubeObserver.instance) {
      YouTubeObserver.instance = new YouTubeObserver();
    }
    return YouTubeObserver.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.waitForDependencies();
    
    this.storage = (window as any).StorageManager.getInstance();
    this.timeUtils = (window as any).TimeUtils.getInstance();

    this.initializeComponents();
    this.setupEventListeners();
    this.observePageChanges();
    this.detectCurrentState();
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

  private setupEventListeners(): void {
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

  private observePageChanges(): void {
    for (const eventName of YouTubeObserver.navigationEventNames) {
      document.addEventListener(eventName, this.boundHandleNavigationSignal as EventListener);
    }

    this.attachWatchFlexyObserver();
    this.scheduleUrlChangeCheck();

    window.addEventListener('popstate', this.boundHandleNavigationSignal);
  }

  private attachWatchFlexyObserver(): void {
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

  private scheduleUrlChangeCheck(): void {
    if (this.navigationCheckTimeout !== null) {
      window.clearTimeout(this.navigationCheckTimeout);
    }

    this.navigationCheckTimeout = window.setTimeout(() => {
      this.navigationCheckTimeout = null;

      const nextUrl = window.location.href;
      if (nextUrl !== this.currentUrl) {
        void this.handleUrlChange(nextUrl);
      }
    }, 50);
  }

  private async handleUrlChange(nextUrl: string = window.location.href): Promise<void> {
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

  private async startVideoWatch(videoId: string): Promise<void> {
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

  private async checkVideoIntentionality(videoId: string, settings: any): Promise<boolean> {
    if (!settings.activeIntention) {
      return false;
    }
    if (this.topicGuard) {
      const allowed = await this.topicGuard.evaluateCurrentVideoAccess();
      return allowed;
    }
    return true;
  }

  private endVideoWatch(videoId: string): void {
    this.isWatching = false;
    this._videoAbortController?.abort();
    this._videoAbortController = null;
    
    browser.runtime.sendMessage({
      type: 'video-ended',
      data: { videoId: videoId }
    });
  }

  private setupVideoEventListeners(): void {
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

  private syncVideoPlaybackState(videoId: string | null): void {
    if (!videoId) {
      this.isWatching = false;
      return;
    }

    const video = document.querySelector('video') as HTMLVideoElement | null;
    const isActivelyPlaying = Boolean(video && !video.paused && !video.ended && video.readyState > 2);

    if (isActivelyPlaying && !this.isWatching) {
      this.isWatching = true;
      
      this.storage.getSettings().then((settings: any) => {
        return this.checkVideoIntentionality(videoId, settings);
      }).then((isIntentional: boolean) => {
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

  private async handleWatchPage(): Promise<void> {
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

  private handleSearchResultsPage(): void {
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

  private async handleNonWatchPage(): Promise<void> {
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

  private isHomePage(): boolean {
    const url = window.location.href;
    return (url === 'https://www.youtube.com/' ||
      url === 'https://youtube.com/' ||
      url.includes('youtube.com/?') ||
      url.includes('youtube.com/feed/subscriptions')) &&
      !url.includes('/watch') &&
      !url.includes('/results');
  }

  private trackActivity(): void {
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

  private handleBackgroundMessage(message: any): void {
    const { type } = message;
    
    switch (type) {
      case 'intent-updated':
        void this.handleUrlChange(window.location.href);
        break;
    }
  }

  private detectCurrentState(): void {
    this.currentUrl = window.location.href;
    this.previousUrl = document.referrer;
    this.currentVideoId = this.extractVideoId(this.currentUrl);
    
    if (this.currentVideoId && document.querySelector('video')) {
      void this.startVideoWatch(this.currentVideoId);
      this.handleWatchPage();
    } else {
      this.handleNonWatchPage();
    }
  }

  private initializeComponents(): void {
    if ((window as any).RecommendationBlocker) {
      this.recommendationBlocker = (window as any).RecommendationBlocker.getInstance();
    }
    
    if ((window as any).TimerOverlay) {
      this.timerOverlay = (window as any).TimerOverlay.getInstance();
    }
    
    if ((window as any).TopicGuard) {
      this.topicGuard = (window as any).TopicGuard.getInstance();
    }
  }

  private extractVideoId(url: string): string | null {
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