/**
 * YouTube Observer - Main content script coordinator
 * Observes page changes and coordinates all other content scripts
 */

class YouTubeObserver {
  private static readonly navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  private static instance: YouTubeObserver;
  private currentVideoId: string | null = null;
  private currentUrl: string = '';
  private previousUrl: string = '';
  private isWatching: boolean = false;
  private watchFlexyObserver: MutationObserver | null = null;
  private observedWatchFlexy: Element | null = null;
  private navigationCheckTimeout: number | null = null;
  private researchPromptPromise: Promise<'research' | 'entertainment'> | null = null;
  private _navigationInProgress = false;
  private _videoAbortController: AbortController | null = null;
  private readonly boundHandleBeforeUnload = () => {
    browser.runtime.sendMessage({
      type: 'page-unload',
      data: {}
    }).catch(() => {});
  };
  private readonly boundTrackSearchNavigation = (event: Event) => this.trackSearchNavigation(event);
  private readonly boundTrackActivity = () => this.trackActivity();
  private readonly boundHandleNavigationSignal = () => {
    this.attachWatchFlexyObserver();
    this.scheduleUrlChangeCheck();
  };
  private storage: any;
  private timeUtils: any;
  private recommendationBlocker: any;
  private browsingMode: any;
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
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleBackgroundMessage(message);
    });

    // Page unload - end session
    window.addEventListener('beforeunload', this.boundHandleBeforeUnload);

    // User activity tracking
    document.addEventListener('click', this.boundTrackSearchNavigation, true);
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
    const previousUrl = this.currentUrl;
    this.previousUrl = previousUrl;
    this.currentUrl = nextUrl;
    this.updateSearchNavigationState(previousUrl, nextUrl);

    if (nextUrl.includes('/watch')) {
      void this.handleWatchPage();
    }

    const newVideoId = this.extractVideoId(nextUrl);
    
    if (newVideoId !== this.currentVideoId) {
      // Video changed
      if (this.currentVideoId && this.isWatching) {
        this.endVideoWatch(this.currentVideoId);
      }
      
      this.currentVideoId = newVideoId;
      
      if (newVideoId) {
        await this.startVideoWatch(newVideoId);
      }
    }

    // Handle different page types
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

  private async startVideoWatch(videoId: string): Promise<void> {
    this.isWatching = false;

    if (this.timerOverlay) {
      this.timerOverlay.startNewVideoSession();
    }

    const mode = await this.resolveWatchMode();
    
    browser.runtime.sendMessage({
      type: 'session-start',
      data: { mode: mode }
    });

    this.setupVideoEventListeners();
    this.syncVideoPlaybackState(videoId);
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
    
    video.addEventListener('play', () => {
      if (videoId && !this.isWatching) {
        this.isWatching = true;
        browser.runtime.sendMessage({
          type: 'video-started',
          data: { videoId: videoId }
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
      browser.runtime.sendMessage({
        type: 'video-started',
        data: { videoId }
      });
      return;
    }

    if (!isActivelyPlaying) {
      this.isWatching = false;
    }
  }

  private async resolveWatchMode(): Promise<'research' | 'entertainment'> {
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

  private cameFromSearch(): boolean {
    return sessionStorage.getItem('yt-from-search') === 'true';
  }

  private showResearchModePrompt(): Promise<'research' | 'entertainment'> {
    if (this.researchPromptPromise) {
      return this.researchPromptPromise;
    }

    if (document.querySelector('.yfg-research-modal')) {
      return this.researchPromptPromise ?? Promise.resolve('entertainment');
    }

    this.researchPromptPromise = new Promise((resolve) => {
      const modal = this.createResearchModeModal(resolve);
      document.body.appendChild(modal);
    });

    return this.researchPromptPromise;
  }

  private createResearchModeModal(resolveMode: (mode: 'research' | 'entertainment') => void): HTMLElement {
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
      const target = e.target as HTMLElement;
      const mode = target.getAttribute('data-mode');

      if (mode) {
        const selectedMode = mode as 'research' | 'entertainment';
        await this.setSessionMode(selectedMode);
        this.researchPromptPromise = null;
        resolveMode(selectedMode);
        modal.remove();
      }
    });

    return modal;
  }

  private async setSessionMode(mode: 'research' | 'entertainment'): Promise<void> {
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

    if (this.topicGuard?.refreshResearchState) {
      await this.topicGuard.refreshResearchState();
    }

    if (window.location.href.includes('/watch')) {
      if (mode === 'research') {
        this.timerOverlay?.hide();
      } else {
        this.timerOverlay?.show();
      }
    }

    browser.runtime.sendMessage({
      type: 'mode-change',
      data: { mode: mode }
    });
  }

  private trackSearchNavigation(event: Event): void {
    const target = event.target as HTMLElement | null;
    const videoLink = target?.closest?.('a[href*="/watch"]') as HTMLAnchorElement | null;

    if (videoLink && window.location.pathname === '/results') {
      sessionStorage.setItem('yt-from-search', 'true');
    }
  }

  private updateSearchNavigationState(previousUrl: string, nextUrl: string): void {
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

  private extractTopicFromPage(): string[] {
    const title = document.title;
    const searchQuery = new URLSearchParams(window.location.search).get('search_query') || sessionStorage.getItem('yt-last-search-query');
    const ignoredWords = new Set(['youtube', 'video', 'official', 'channel', 'watch', 'episode', 'live']);
    
    const keywords: string[] = [];
    
    if (searchQuery) {
      keywords.push(...searchQuery.toLowerCase().split(/\s+/));
    }
    
    if (title) {
      // Extract meaningful keywords from title
      const titleWords = title.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !ignoredWords.has(word));
      keywords.push(...titleWords);
    }
    
    return [...new Set(keywords.map((word) => word.trim()).filter((word) => word && !ignoredWords.has(word)))];
  }

  private handleShortsPage(): void {
    // Shorts are handled by the scheduler in background
    // This is just for additional UI feedback if needed
  }

  private async handleWatchPage(): Promise<void> {
    if (!this.timerOverlay) {
      return;
    }

    const settings = await this.storage.getSettings();
    if (settings.browsingMode && settings.browsingMode.active) {
      this.timerOverlay.hide();
      return;
    }

    if (settings.research.mode === 'research') {
      this.timerOverlay.hide();
      return;
    }

    this.timerOverlay.show();
  }

  private handleHomePage(): void {
    // Hide timer overlay on home page
    if (this.timerOverlay) {
      this.timerOverlay.hide();
    }
  }

  private handleNonWatchPage(): void {
    this.handleHomePage();
  }

  private trackActivity(): void {
    browser.runtime.sendMessage({
      type: 'activity',
      data: { timestamp: Date.now() }
    });
  }

  private handleBackgroundMessage(message: any): void {
    const { type, data } = message;
    
    switch (type) {
      case 'mode-change':
        void this.applyExternalModeChange(data.mode);
        break;
        
      case 'show-timer-modal':
        if (this.timerOverlay) {
          this.timerOverlay.showModal(data.watchTime);
        }
        break;
    }
  }

  private async applyExternalModeChange(mode: 'research' | 'entertainment'): Promise<void> {
    if (this.currentVideoId) {
      sessionStorage.setItem('yt-mode-video-id', this.currentVideoId);
    }

    if (window.location.href.includes('/watch')) {
      if (mode === 'research') {
        this.timerOverlay?.hide();
      } else {
        this.timerOverlay?.show();
      }
    }

    if (this.topicGuard?.refreshResearchState) {
      await this.topicGuard.refreshResearchState();
    }

    if (mode !== 'research') {
      sessionStorage.removeItem('yt-from-search');
    }
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
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
    // Initialize recommendation blocker
    if ((window as any).RecommendationBlocker) {
      this.recommendationBlocker = (window as any).RecommendationBlocker.getInstance();
    }

    if ((window as any).BrowsingModeController) {
      this.browsingMode = (window as any).BrowsingModeController.getInstance();
    }
    
    // Initialize timer overlay  
    if ((window as any).TimerOverlay) {
      this.timerOverlay = (window as any).TimerOverlay.getInstance();
    }
    
    // Initialize topic guard
    if ((window as any).TopicGuard) {
      this.topicGuard = (window as any).TopicGuard.getInstance();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    YouTubeObserver.getInstance();
  });
} else {
  YouTubeObserver.getInstance();
}