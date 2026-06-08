/**
 * Recommendation Blocker for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Hides algorithmic recommendations and displays the Mindful Intent Portal.
 */

const isRecommendationBlockerHostSupported = (): boolean => {
  const hostname = window.location.hostname.toLowerCase();
  return hostname === 'www.youtube.com' || hostname === 'youtube.com';
};

class RecommendationBlocker {
  private static readonly navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  private static instance: RecommendationBlocker;
  private isEnabled = true;
  private blockingTimeouts: number[] = [];
  private readonly boundScheduleBlockingPasses = () => this.scheduleBlockingPasses();

  static getInstance(): RecommendationBlocker {
    if (!RecommendationBlocker.instance) {
      RecommendationBlocker.instance = new RecommendationBlocker();
    }
    return RecommendationBlocker.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.injectBlockingCSS();
    this.setupNavigationListeners();
    this.scheduleBlockingPasses();
  }

  private injectBlockingCSS(): void {
    if (document.getElementById('yfg-blocking-css')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'yfg-blocking-css';
    style.textContent = `
      /* Hide home feeds completely */
      ytd-rich-grid-renderer,
      ytd-browse[page-subtype="home"] #primary ytd-rich-grid-renderer,
      ytd-browse[page-subtype="home"] #contents,
      
      /* Hide sidebar recommendations on watch page */
      #related,
      ytd-watch-next-secondary-results-renderer,
      #secondary ytd-compact-video-renderer,
      ytd-item-section-renderer[section-identifier="related-items"],
      
      /* End screen cards and suggestions */
      .ytp-ce-element,
      .ytp-endscreen-content,
      ytd-endscreen-element-renderer,
      .ytp-suggestion-set,
      .ytp-autonav-endscreen-upnext-container,
      
      /* Shorts racks & menus */
      /* Shorts racks & menus */
      body.yfg-shorts-blocked ytd-reel-shelf-renderer,
      body.yfg-shorts-blocked ytd-rich-shelf-renderer[is-shorts],
      body.yfg-shorts-blocked [aria-label*="Shorts"],
      body.yfg-shorts-blocked [href*="/shorts/"],
      body.yfg-shorts-blocked ytd-guide-entry-renderer:has(a[href*="/shorts"]),
      body.yfg-shorts-blocked ytd-mini-guide-entry-renderer:has(a[href*="/shorts"]),
      
      /* Trending page links */
      ytd-browse[page-subtype="trending"],
      ytd-guide-entry-renderer[href="/feed/trending"] {
        display: none !important;
      }

      /* Home message styling container */
      .yfg-home-message {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 800px;
        margin: 40px auto;
        padding: 30px;
        min-height: 420px;
        box-sizing: border-box;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  private setupNavigationListeners(): void {
    for (const eventName of RecommendationBlocker.navigationEventNames) {
      document.addEventListener(eventName, this.boundScheduleBlockingPasses as EventListener);
    }
    window.addEventListener('popstate', this.boundScheduleBlockingPasses);
  }

  private scheduleBlockingPasses(): void {
    this.clearBlockingTimeouts();

    const delays = [0, 150, 600, 1500, 3000];
    for (const delay of delays) {
      const timeoutId = window.setTimeout(() => {
        void this.blockRecommendations();
      }, delay);
      this.blockingTimeouts.push(timeoutId);
    }
  }

  private clearBlockingTimeouts(): void {
    for (const timeoutId of this.blockingTimeouts) {
      window.clearTimeout(timeoutId);
    }
    this.blockingTimeouts = [];
  }

  private async blockRecommendations(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const storage = (window as any).StorageManager.getInstance();
    const settings = await storage.getSettings();
    const shortsBlocked = settings.shortsBlocked !== false;
    document.body.classList.toggle('yfg-shorts-blocked', shortsBlocked);

    this.blockHomeFeed();
    this.blockSidebarRecommendations();
    this.blockEndScreenRecommendations();
    this.blockShortsShelf(shortsBlocked);
    this.blockTrendingContent();
    this.disableAutoplay();
  }

  private blockHomeFeed(): void {
    if (this.isHomePage()) {
      const homeFeedSelectors = [
        'ytd-rich-grid-renderer',
        'ytd-browse[page-subtype="home"]',
        '[role="main"] ytd-rich-grid-renderer',
        '#primary ytd-rich-grid-renderer',
      ];

      for (const selector of homeFeedSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          this.hideElement(element as HTMLElement);
        });
      }
      void this.showHomePortal();
    } else {
      this.hidePortal();
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

  private blockSidebarRecommendations(): void {
    this.hideElementsBySelectors([
      '#related',
      'ytd-watch-next-secondary-results-renderer',
      '#secondary ytd-compact-video-renderer',
      '[data-content="related"]',
      'ytd-item-section-renderer[section-identifier="related-items"]',
    ]);
  }

  private blockEndScreenRecommendations(): void {
    this.hideElementsBySelectors([
      '.ytp-ce-element',
      '.ytp-endscreen-content',
      'ytd-endscreen-element-renderer',
      '.ytp-suggestion-set',
      '.ytp-autonav-endscreen-upnext-container',
    ]);
  }

  private blockShortsShelf(shortsBlocked: boolean): void {
    const selectors = [
      'ytd-reel-shelf-renderer',
      '[aria-label*="Shorts"]',
      'ytd-rich-shelf-renderer[is-shorts]',
      '[href*="/shorts/"]',
      'ytd-guide-entry-renderer:has(a[href*="/shorts"])',
      'ytd-mini-guide-entry-renderer:has(a[href*="/shorts"])',
    ];
    if (shortsBlocked) {
      this.hideElementsBySelectors(selectors);
    } else {
      this.showElementsBySelectors(selectors);
    }
  }

  private blockTrendingContent(): void {
    this.hideElementsBySelectors([
      '[href="/feed/trending"]',
      'ytd-browse[page-subtype="trending"]',
      '[aria-label*="Trending"]',
      'ytd-guide-entry-renderer[href="/feed/trending"]',
    ]);
  }

  private disableAutoplay(): void {
    const autoplayButton = document.querySelector('[data-tooltip-text*="autoplay" i]') as HTMLElement | null;
    if (autoplayButton && autoplayButton.getAttribute('aria-pressed') === 'true') {
      autoplayButton.click();
    }

    const video = document.querySelector('video');
    if (video) {
      video.removeAttribute('autoplay');
    }
  }

  private hideElementsBySelectors(selectors: string[]): void {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        this.hideElement(element as HTMLElement);
      });
    }
  }

  private hideElement(element: HTMLElement): void {
    if (!element || element.style.display === 'none') {
      return;
    }

    element.style.display = 'none';
    element.setAttribute('data-yfg-hidden', 'true');
  }

  private showElementsBySelectors(selectors: string[]): void {
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        this.showElement(element as HTMLElement);
      });
    }
  }

  private showElement(element: HTMLElement): void {
    if (element && element.getAttribute('data-yfg-hidden') === 'true') {
      element.style.display = '';
      element.removeAttribute('data-yfg-hidden');
    }
  }

  public async showPortal(): Promise<void> {
    if (!document.body || !this.isHomePage()) {
      return;
    }

    const existingMessage = document.querySelector('.yfg-home-message');
    if (existingMessage) {
      void this.updatePortalStats();
      return;
    }

    const storage = (window as any).StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    // Extract unique recent topics from history
    const recentIntentions = settings.intentionHistory
      ? [...new Set(settings.intentionHistory.map((h: any) => h.text))].slice(0, 5)
      : [];
    
    const todayWatch = settings.stats.todayWatchTime || 0;
    const todayIntentional = settings.stats.todayIntentionalTime || 0;
    const todayDrift = settings.stats.todayDriftTime || 0;
    const index = todayWatch > 0 
      ? Math.round((todayIntentional / todayWatch) * 100) 
      : 100;

    const messageContainer = document.createElement('div');
    messageContainer.className = 'yfg-home-message';
    
    let historyHTML = '';
    if (recentIntentions.length > 0) {
      historyHTML = `
        <div class="yfg-dashboard-recent" style="margin-top: 24px;">
          <div class="yfg-dashboard-recent-title" style="font-size: 11px; text-transform: uppercase; color: var(--yfg-color-text-muted); font-weight: 700; margin-bottom: 8px;">Resume Focus</div>
          <div class="yfg-dashboard-topics-list" style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${recentIntentions.map((topic: string) => `<span class="yfg-dashboard-topic-pill" data-topic="${topic}" style="padding: 6px 14px; font-size: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--yfg-color-border); border-radius: 99px; cursor: pointer; color: var(--yfg-color-text); transition: var(--yfg-transition);">${topic}</span>`).join('')}
          </div>
        </div>
      `;
    }

    const hasActive = settings.activeIntention ? true : false;

    messageContainer.innerHTML = `
      <div class="yfg-dashboard-layout" style="display: flex; gap: 32px; width: 100%; align-items: flex-start; justify-content: space-between;">
        <div class="yfg-dashboard-left" style="flex: 1; display: flex; flex-direction: column;">
          <h2 class="yfg-dashboard-greeting" style="font-size: 24px; font-weight: 700; margin: 0 0 16px;">Make YouTube Intentional</h2>
          
          <div class="yfg-portal-form-container" style="display: flex; flex-direction: column; gap: 12px;">
            ${hasActive ? `
              <div class="yfg-active-pill-box" style="padding: 16px; border-radius: var(--yfg-radius-md); background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.2); margin-bottom: 8px;">
                <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: var(--yfg-color-primary); font-weight: 700;">Active Intention:</p>
                <p style="margin: 4px 0 12px; font-size: 16px; font-weight: 600;">"${settings.activeIntention}"</p>
                <div style="display: flex; gap: 8px;">
                  <button class="yfg-btn yfg-btn-primary" id="yfg-resume-active-btn" style="min-height: 28px; padding: 4px 12px; font-size: 11px;">Resume Session</button>
                  <button class="yfg-btn yfg-btn-secondary" id="yfg-clear-active-btn" style="min-height: 28px; padding: 4px 12px; font-size: 11px;">Clear Intention</button>
                </div>
              </div>
            ` : ''}

            <div class="yfg-dashboard-search-box" style="position: relative; display: flex; align-items: center; width: 100%;">
              <input type="text" id="yfg-dashboard-search" class="yfg-dashboard-search-input" placeholder="What is your main intention for YouTube right now?" style="width: 100%; padding: 12px 16px; font-size: 14px; border-radius: 12px; background: rgba(10,12,16,0.85); border: 1px solid var(--yfg-color-border-strong); color: var(--yfg-color-text);" />
            </div>
            <button class="yfg-btn yfg-btn-primary" id="yfg-dash-submit-intent" style="width: fit-content; align-self: flex-start;">
              🎯 Set Intention & Search
            </button>
          </div>
          
          ${historyHTML}
        </div>
        
        <div class="yfg-dashboard-right" style="width: 200px; display: flex; flex-direction: column; align-items: center; text-align: center; border-left: 1px solid var(--yfg-color-border); padding-left: 32px;">
          <div class="yfg-dashboard-stats-label" style="font-size: 11px; text-transform: uppercase; color: var(--yfg-color-text-muted); font-weight: 700; margin-bottom: 12px;">Intentionality Index</div>
          <div class="yfg-progress-ring-container" style="position: relative; width: 90px; height: 90px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <svg class="yfg-progress-ring" width="90" height="90" style="transform: rotate(-90deg);">
              <defs>
                <linearGradient id="yfg-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#3b82f6" />
                  <stop offset="100%" stop-color="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle class="yfg-progress-ring-circle-bg" cx="45" cy="45" r="38" style="fill: none; stroke: rgba(255,255,255,0.03); stroke-width: 6;" />
              <circle class="yfg-progress-ring-circle-fill" cx="45" cy="45" r="38" style="fill: none; stroke: url(#yfg-ring-gradient); stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset 0.35s;" />
            </svg>
            <span class="yfg-progress-ring-text" id="yfg-dash-ring-text" style="position: absolute; font-size: 16px; font-weight: 700; color: var(--yfg-color-text);">${index}%</span>
          </div>
          <div class="yfg-dashboard-stats-summary" style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
            <div class="yfg-dashboard-stat-box" style="display: flex; justify-content: space-between; font-size: 13px;">
              <span class="yfg-dashboard-stat-lbl" style="color: var(--yfg-color-text-muted)">Intentional Time:</span>
              <span class="yfg-dashboard-stat-val" id="yfg-dash-stat-intentional" style="font-weight: 700; color: var(--yfg-color-success);">${Math.round(todayIntentional / 60)}m</span>
            </div>
            <div class="yfg-dashboard-stat-box" style="display: flex; justify-content: space-between; font-size: 13px;">
              <span class="yfg-dashboard-stat-lbl" style="color: var(--yfg-color-text-muted)">Drift/Aimless:</span>
              <span class="yfg-dashboard-stat-val" id="yfg-dash-stat-drift" style="font-weight: 700; color: var(--yfg-color-danger);">${Math.round(todayDrift / 60)}m</span>
            </div>
          </div>
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

    this.setProgressOffset(index);

    // Bind forms
    const searchInput = messageContainer.querySelector('#yfg-dashboard-search') as HTMLInputElement | null;
    const submitBtn = messageContainer.querySelector('#yfg-dash-submit-intent') as HTMLButtonElement | null;
    const resumeBtn = messageContainer.querySelector('#yfg-resume-active-btn') as HTMLButtonElement | null;
    const clearBtn = messageContainer.querySelector('#yfg-clear-active-btn') as HTMLButtonElement | null;

    const executeSearch = async (text: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;
      await storage.setIntention(cleanText);
      
      // Notify active session status to background UsageTracker
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: true }
      });
      
      window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanText)}`;
    };

    if (submitBtn && searchInput) {
      submitBtn.addEventListener('click', () => void executeSearch(searchInput.value));
    }
    if (searchInput) {
      searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          void executeSearch(searchInput.value);
        }
      });
    }

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        if (settings.activeIntention) {
          window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(settings.activeIntention)}`;
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        await storage.setIntention("");
        await browser.runtime.sendMessage({
          type: 'intent-status-changed',
          data: { isIntentional: false }
        });
        this.hidePortal();
        await this.showPortal();
      });
    }

    // Bind history pills
    const pills = messageContainer.querySelectorAll('.yfg-dashboard-topic-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        const topic = pill.getAttribute('data-topic');
        if (topic) {
          void executeSearch(topic);
        }
      });
    });
  }

  private async updatePortalStats(): Promise<void> {
    const ringText = document.getElementById('yfg-dash-ring-text');
    const intentionalStat = document.getElementById('yfg-dash-stat-intentional');
    const driftStat = document.getElementById('yfg-dash-stat-drift');
    if (!ringText || !intentionalStat || !driftStat) return;

    const storage = (window as any).StorageManager.getInstance();
    const settings = await storage.getSettings();
    const todayWatch = settings.stats.todayWatchTime || 0;
    const todayIntentional = settings.stats.todayIntentionalTime || 0;
    const todayDrift = settings.stats.todayDriftTime || 0;
    
    const index = todayWatch > 0 
      ? Math.round((todayIntentional / todayWatch) * 100) 
      : 100;

    ringText.textContent = `${index}%`;
    intentionalStat.textContent = `${Math.round(todayIntentional / 60)}m`;
    driftStat.textContent = `${Math.round(todayDrift / 60)}m`;
    this.setProgressOffset(index);
  }

  private setProgressOffset(percent: number): void {
    const circle = document.querySelector('.yfg-progress-ring-circle-fill') as SVGCircleElement | null;
    if (!circle) return;
    const radius = 38;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset.toString();
  }

  public hidePortal(): void {
    const homeMessage = document.querySelector('.yfg-home-message');
    if (homeMessage) {
      homeMessage.remove();
    }
  }

  destroy(): void {
    this.clearBlockingTimeouts();
    this.hidePortal();
  }
}

(window as any).RecommendationBlocker = RecommendationBlocker;
if (isRecommendationBlockerHostSupported()) {
  RecommendationBlocker.getInstance();
}
