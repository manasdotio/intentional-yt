/**
 * Recommendation Blocker for YouTube Focus Guard (JS version)
 * Hides algorithmic recommendations and distracting elements.
 */

const isRecommendationBlockerHostSupported = () => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class RecommendationBlocker {
  static navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];

  static getInstance() {
    if (!RecommendationBlocker.instance) {
      RecommendationBlocker.instance = new RecommendationBlocker();
    }
    return RecommendationBlocker.instance;
  }

  constructor() {
    this.isEnabled = true;
    this.blockingTimeouts = [];
    this.boundScheduleBlockingPasses = () => this.scheduleBlockingPasses();
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.injectBlockingCSS();
    this.setupNavigationListeners();
    this.scheduleBlockingPasses();
  }

  async loadSettings() {
    this.isEnabled = true;
  }

  injectBlockingCSS() {
    if (document.getElementById('yfg-blocking-css')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'yfg-blocking-css';
    style.textContent = `
      #related,
      ytd-watch-next-secondary-results-renderer,
      #secondary ytd-compact-video-renderer,
      ytd-item-section-renderer[section-identifier="related-items"],
      .ytp-ce-element,
      .ytp-endscreen-content,
      ytd-endscreen-element-renderer,
      .ytp-suggestion-set,
      .ytp-autonav-endscreen-upnext-container,
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-browse[page-subtype="trending"],
      ytd-guide-entry-renderer[href="/feed/trending"] {
        display: none !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  setupNavigationListeners() {
    for (const eventName of RecommendationBlocker.navigationEventNames) {
      document.addEventListener(eventName, this.boundScheduleBlockingPasses);
    }

    window.addEventListener('popstate', this.boundScheduleBlockingPasses);
  }

  scheduleBlockingPasses() {
    this.clearBlockingTimeouts();

    const delays = [0, 150, 600, 1500];
    for (const delay of delays) {
      const timeoutId = window.setTimeout(() => {
        this.blockRecommendations();
      }, delay);
      this.blockingTimeouts.push(timeoutId);
    }
  }

  clearBlockingTimeouts() {
    for (const timeoutId of this.blockingTimeouts) {
      window.clearTimeout(timeoutId);
    }
    this.blockingTimeouts = [];
  }

  blockRecommendations() {
    if (!this.isEnabled) {
      return;
    }

    this.blockHomeFeed();
    this.blockSidebarRecommendations();
    this.blockEndScreenRecommendations();
    this.blockShortsShelf();
    this.blockTrendingContent();
    this.disableAutoplay();
  }

  blockHomeFeed() {
    const homeFeedSelectors = [
      'ytd-rich-grid-renderer',
      'ytd-browse[page-subtype="home"]',
      '[role="main"] ytd-rich-grid-renderer',
      '#primary ytd-rich-grid-renderer',
    ];

    for (const selector of homeFeedSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        if (this.isHomePage()) {
          this.hideElement(element);
        }
      });
    }

    this.showHomeMessage();
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

  blockSidebarRecommendations() {
    this.hideElementsBySelectors([
      '#related',
      'ytd-watch-next-secondary-results-renderer',
      '#secondary ytd-compact-video-renderer',
      '[data-content="related"]',
      'ytd-item-section-renderer[section-identifier="related-items"]',
    ]);
  }

  blockEndScreenRecommendations() {
    this.hideElementsBySelectors([
      '.ytp-ce-element',
      '.ytp-endscreen-content',
      'ytd-endscreen-element-renderer',
      '.ytp-suggestion-set',
      '.ytp-autonav-endscreen-upnext-container',
    ]);
  }

  blockShortsShelf() {
    this.hideElementsBySelectors([
      'ytd-reel-shelf-renderer',
      '[aria-label*="Shorts"]',
      'ytd-rich-shelf-renderer[is-shorts]',
      '[href*="/shorts/"]',
    ]);
  }

  blockTrendingContent() {
    this.hideElementsBySelectors([
      '[href="/feed/trending"]',
      'ytd-browse[page-subtype="trending"]',
      '[aria-label*="Trending"]',
      'ytd-guide-entry-renderer[href="/feed/trending"]',
    ]);
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

  hideElementsBySelectors(selectors) {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        this.hideElement(element);
      });
    }
  }

  hideElement(element) {
    if (!element || element.style.display === 'none') {
      return;
    }

    element.style.display = 'none';
    element.setAttribute('data-yfg-hidden', 'true');
  }

  showHomeMessage() {
    if (!document.body || !this.isHomePage()) {
      return;
    }

    const existingMessage = document.querySelector('.yfg-home-message');
    if (existingMessage) {
      return;
    }

    const messageContainer = document.createElement('div');
    messageContainer.className = 'yfg-home-message';
    messageContainer.innerHTML = `
      <div class="yfg-home-content">
        <h2>YouTube Focus Mode</h2>
        <p>Home feed hidden to prevent distraction</p>
        <div class="yfg-home-actions">
          <a href="/results?search_query=" class="yfg-btn yfg-btn-primary">Search for content</a>
          <a href="/feed/subscriptions" class="yfg-btn yfg-btn-secondary">View subscriptions</a>
        </div>
      </div>
    `;

    const mainContainer = document.querySelector('#primary') ||
      document.querySelector('[role="main"]') ||
      document.querySelector('#contents');

    if (mainContainer) {
      mainContainer.insertBefore(messageContainer, mainContainer.firstChild);
    } else {
      document.body.appendChild(messageContainer);
    }
  }

  enable() {
    this.isEnabled = true;
    this.blockRecommendations();
  }

  disable() {
    this.isEnabled = false;
    this.showHiddenElements();
  }

  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  showHiddenElements() {
    const hiddenElements = document.querySelectorAll('[data-yfg-hidden="true"]');
    hiddenElements.forEach((element) => {
      element.style.display = '';
      element.removeAttribute('data-yfg-hidden');
    });

    const homeMessage = document.querySelector('.yfg-home-message');
    if (homeMessage) {
      homeMessage.remove();
    }
  }

  destroy() {
    this.clearBlockingTimeouts();
    this.showHiddenElements();
  }
}

window.RecommendationBlocker = RecommendationBlocker;
if (isRecommendationBlockerHostSupported()) {
  RecommendationBlocker.getInstance();
}
