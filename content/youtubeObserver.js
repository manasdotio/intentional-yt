/**
 * YouTube Route Observer for Intentional YT
 * Coordinates blockers, timers, and redirects across YouTube SPA updates.
 */

class YouTubeObserver {
  static instance;

  static getInstance() {
    if (!YouTubeObserver.instance) {
      YouTubeObserver.instance = new YouTubeObserver();
    }
    return YouTubeObserver.instance;
  }

  constructor() {
    this.currentUrl = window.location.href;
    this.currentVideoId = this.extractVideoId(this.currentUrl);
    this.init();
  }

  /**
   * Bind event listeners for routing and storage changes.
   */
  init() {
    this.setupListeners();
    this.handleRouteChange();
  }

  setupListeners() {
    // Listen to standard YouTube Polymer SPA navigation events
    document.addEventListener('yt-navigate-finish', () => this.handleRouteChange());
    document.addEventListener('yt-page-data-updated', () => this.handleRouteChange());
    window.addEventListener('popstate', () => this.handleRouteChange());

    // Fallback URL checker to capture transitions missed by events
    setInterval(() => {
      if (window.location.href !== this.currentUrl) {
        this.handleRouteChange();
      }
    }, 500);

    // Apply storage updates immediately on user toggle inside popup
    browser.storage.onChanged.addListener(async (changes) => {
      if (changes.settings) {
        const settings = changes.settings.newValue;
        if (settings) {
          this.applySettingsState(settings);
          // Also check watch limit immediately if we are on /watch
          if (window.location.pathname === '/watch' && typeof TimerToast !== 'undefined') {
            TimerToast.checkWatchLimit();
          }
        }
      }
    });
  }

  /**
   * Extract video ID parameter from YouTube URLs.
   */
  extractVideoId(url) {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('v');
    } catch (error) {
      return null;
    }
  }

  /**
   * Evaluate route changes and invoke appropriate features.
   */
  async handleRouteChange() {
    const nextUrl = window.location.href;
    this.currentUrl = nextUrl;

    const newVideoId = this.extractVideoId(nextUrl);
    const videoIdChanged = newVideoId !== this.currentVideoId;
    this.currentVideoId = newVideoId;

    const settings = await StorageManager.getSettings();

    // Force redirect to homepage if blockShorts is active and user accesses a Shorts page
    if (settings.extensionEnabled && settings.blockShorts && window.location.pathname.startsWith('/shorts/')) {
      window.location.replace('https://www.youtube.com/');
      return;
    }

    // Refresh active settings based on route
    this.applySettingsState(settings, videoIdChanged);
  }

  /**
   * Toggle blockers and session timers based on configuration and current route.
   */
  applySettingsState(settings, forceVideoReset = false) {
    if (!settings.extensionEnabled) {
      Blocker.removeCSS();
      TimerToast.stopTimer();
      return;
    }

    // Always inject blocker CSS when extension is enabled, since all blocker/toggles rules are in blocker.css
    Blocker.injectCSS();

    // Toggle classes on html based on settings
    Blocker.updateToggles(settings);

    // Handle watch vs non-watch paths
    if (window.location.pathname === '/watch') {
      if (settings.blockAutoplay) {
        Blocker.disableAutoplay();
      }

      if (forceVideoReset) {
        TimerToast.startTimer();
      } else {
        // Safe check to start tracking if not actively running
        TimerToast.startTimer();
      }
    } else {
      TimerToast.stopTimer();
    }
  }
}

// Start observing if we are on a YouTube page
if (window.location.hostname.endsWith('youtube.com')) {
  YouTubeObserver.getInstance();
}