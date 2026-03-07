/**
 * Topic Guard for YouTube Focus Guard
 * Handles research mode and prevents algorithm rabbit holes
 */

interface TopicData {
  keywords: string[];
  searchQuery: string;
  originalTitle: string;
  allowedTopics: string[];
  sessionStart: number;
  driftWarnings: number;
}

class TopicGuard {
  private static readonly allowOnceStorageKey = 'yfg-topic-guard-allow-once';
  private static readonly navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  private static instance: TopicGuard;
  private currentTopic: TopicData | null = null;
  private storage: any;
  private isResearchMode: boolean = false;
  private allowedChannels: string[] = [];
  private allowedChannelOverlay: HTMLElement | null = null;
  private channelActionButton: HTMLButtonElement | null = null;
  private boundHandleVideoClick = (event: Event) => this.handleVideoClick(event);
  private metadataRetryTimeout: number | null = null;
  private routeCheckTimeout: number | null = null;
  private activeWarningKey: string | null = null;
  private readonly boundHandleNavigationSignal = () => this.scheduleTopicCheck();

  static getInstance(): TopicGuard {
    if (!TopicGuard.instance) {
      TopicGuard.instance = new TopicGuard();
    }
    return TopicGuard.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.waitForDependencies();

    this.storage = (window as any).StorageManager.getInstance();
    this.setupMessageListener();
    await this.loadResearchState();
    this.setupTopicMonitoring();
  }

  private async waitForDependencies(): Promise<void> {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if ((window as any).StorageManager) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  private setupMessageListener(): void {
    if (!browser.runtime?.onMessage) {
      return;
    }

    browser.runtime.onMessage.addListener((message: any) => {
      if (!message?.type) {
        return undefined;
      }

      if (message.type === 'research-settings-updated') {
        return this.loadResearchState();
      }

      if (message.type === 'get-current-channel-name') {
        return Promise.resolve({
          channelName: this.extractCurrentChannelName() || ''
        });
      }

      return undefined;
    });
  }

  private async loadResearchState(): Promise<void> {
    const settings = await this.storage.getSettings();

    this.isResearchMode = settings.research.mode === 'research';
    this.allowedChannels = Array.isArray(settings.research.allowedChannels)
      ? settings.research.allowedChannels.map((channel: string) => this.normalizeChannelName(channel)).filter(Boolean)
      : [];

    if (this.isResearchMode && settings.research.currentTopic.length > 0) {
      this.currentTopic = {
        keywords: settings.research.currentTopic,
        searchQuery: this.extractSearchQuery(),
        originalTitle: document.title,
        allowedTopics: settings.research.currentTopic,
        sessionStart: settings.research.sessionStart,
        driftWarnings: 0
      };
    } else {
      this.currentTopic = null;
    }

    this.updateAllowedChannelOverlay();
    this.updateChannelActionButton();
  }

  async refreshResearchState(): Promise<void> {
    this.teardownTopicMonitoring();

    await this.loadResearchState();

    if (this.isResearchMode) {
      this.setupTopicMonitoring();
    } else {
      this.hideAllowedChannelOverlay();
    }
  }

  private teardownTopicMonitoring(): void {
    document.removeEventListener('click', this.boundHandleVideoClick, true);
    for (const eventName of TopicGuard.navigationEventNames) {
      document.removeEventListener(eventName, this.boundHandleNavigationSignal as EventListener);
    }
    window.removeEventListener('popstate', this.boundHandleNavigationSignal);

    if (this.metadataRetryTimeout !== null) {
      window.clearTimeout(this.metadataRetryTimeout);
      this.metadataRetryTimeout = null;
    }

    if (this.routeCheckTimeout !== null) {
      window.clearTimeout(this.routeCheckTimeout);
      this.routeCheckTimeout = null;
    }
  }

  private setupTopicMonitoring(): void {
    if (!this.isResearchMode) return;

    document.removeEventListener('click', this.boundHandleVideoClick, true);
    document.addEventListener('click', this.boundHandleVideoClick, true);
    for (const eventName of TopicGuard.navigationEventNames) {
      document.addEventListener(eventName, this.boundHandleNavigationSignal as EventListener);
    }
    window.addEventListener('popstate', this.boundHandleNavigationSignal);

    this.scheduleTopicCheck(1000);
  }

  private scheduleTopicCheck(delay: number = 250): void {
    if (this.routeCheckTimeout !== null) {
      window.clearTimeout(this.routeCheckTimeout);
    }

    this.routeCheckTimeout = window.setTimeout(() => {
      this.routeCheckTimeout = null;
      this.checkCurrentVideo();
    }, delay);
  }

  private handleVideoClick(event: Event): void {
    if (!this.isResearchMode || !this.currentTopic) return;

    const target = event.target as HTMLElement;
    const videoLink = this.findVideoLink(target);

    if (videoLink) {
      const videoTitle = this.extractVideoTitle(videoLink);
      const channelName = this.extractChannelNameFromLink(videoLink);
      const evaluation = this.evaluateVideoAccess(videoTitle, channelName);

      if (!evaluation.allowed) {
        event.preventDefault();
        event.stopPropagation();
        this.showTopicDriftWarning(videoTitle, videoLink.href);
      }
    }
  }

  private findVideoLink(element: HTMLElement): HTMLAnchorElement | null {
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      if (current.tagName === 'A' && current.getAttribute('href')?.includes('/watch')) {
        return current as HTMLAnchorElement;
      }
      current = current.parentElement;
    }

    return null;
  }

  private extractVideoTitle(linkElement: HTMLElement): string {
    const ownTitle = linkElement.getAttribute('title') || linkElement.getAttribute('aria-label') || linkElement.textContent?.trim();
    if (ownTitle) {
      return ownTitle;
    }

    const titleElement = linkElement.querySelector('#video-title, .ytd-video-meta-block .style-scope, h3, [aria-label]');

    if (titleElement) {
      return titleElement.textContent?.trim() || titleElement.getAttribute('aria-label') || '';
    }

    return linkElement.textContent?.trim() || '';
  }

  private extractCurrentVideoTitle(): string {
    const watchTitle = document.querySelector('ytd-watch-metadata h1 yt-formatted-string, ytd-video-primary-info-renderer h1.title, h1.ytd-watch-metadata');
    const rawTitle = watchTitle?.textContent || document.title;
    return this.normalizePageTitle(rawTitle);
  }

  private normalizePageTitle(title: string): string {
    return (title || '').replace(/\s*-\s*YouTube$/i, '').trim();
  }

  private normalizeChannelName(channelName: string): string {
    return (channelName || '').toLowerCase().trim();
  }

  private extractCurrentChannelName(): string {
    return this.extractChannelNameFromRoot(document);
  }

  private getCurrentChannelAnchor(): HTMLAnchorElement | null {
    return document.querySelector('ytd-watch-metadata ytd-channel-name a, ytd-video-owner-renderer ytd-channel-name a, #owner #channel-name a, #channel-name a, #upload-info #channel-name a');
  }

  private extractChannelNameFromLink(linkElement: HTMLElement): string {
    const channelHost = linkElement.closest('ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-rich-grid-media, ytd-item-section-renderer');
    return this.extractChannelNameFromRoot((channelHost as ParentNode | null) || linkElement.parentElement || document);
  }

  private extractChannelNameFromRoot(root: ParentNode | null): string {
    if (!root || !(root as Element).querySelector) {
      return '';
    }

    const channelElement = (root as Element).querySelector('ytd-channel-name a, #owner #channel-name a, #channel-name a, #byline a, #upload-info #channel-name a, a[href^="/@"], a[href^="/channel/"]');
    const rawName = channelElement?.textContent?.trim() || channelElement?.getAttribute('aria-label') || '';
    return this.normalizeChannelName(rawName);
  }

  private scheduleMetadataRetry(): void {
    if (this.metadataRetryTimeout !== null || !window.location.href.includes('/watch')) {
      return;
    }

    this.metadataRetryTimeout = window.setTimeout(() => {
      this.metadataRetryTimeout = null;
      this.updateChannelActionButton();
      this.updateAllowedChannelOverlay();
      if (this.isResearchMode) {
        this.checkCurrentVideo();
      }
    }, 600);
  }

  private isAllowedChannel(channelName: string): boolean {
    if (!channelName || this.allowedChannels.length === 0) {
      return false;
    }

    return this.allowedChannels.includes(this.normalizeChannelName(channelName));
  }

  private evaluateVideoAccess(videoTitle: string, channelName: string): { allowed: boolean; reason: string; channelName: string } {
    // Trusted research channels bypass keyword matching to avoid false negatives.
    if (this.isAllowedChannel(channelName)) {
      return {
        allowed: true,
        reason: 'allowed-channel',
        channelName: this.normalizeChannelName(channelName)
      };
    }

    return {
      allowed: this.isVideoRelated(videoTitle),
      reason: 'topic-match',
      channelName: ''
    };
  }

  private getVideoAccessKey(videoUrl: string): string {
    try {
      const parsedUrl = new URL(videoUrl, window.location.origin);
      return parsedUrl.searchParams.get('v') || parsedUrl.href;
    } catch {
      return videoUrl;
    }
  }

  private markVideoAllowedOnce(videoUrl: string): void {
    sessionStorage.setItem(TopicGuard.allowOnceStorageKey, this.getVideoAccessKey(videoUrl));
  }

  private consumeAllowedVideo(videoUrl: string): boolean {
    const storedValue = sessionStorage.getItem(TopicGuard.allowOnceStorageKey);
    const currentValue = this.getVideoAccessKey(videoUrl);

    if (storedValue && storedValue === currentValue) {
      sessionStorage.removeItem(TopicGuard.allowOnceStorageKey);
      return true;
    }

    return false;
  }

  private isVideoRelated(videoTitle: string): boolean {
    if (!this.currentTopic || !videoTitle) return true;

    const titleWords = this.normalizeText(videoTitle);
    const topicKeywords = this.currentTopic.keywords.map((word) => this.normalizeText(word));

    const directMatches = topicKeywords.filter((keyword) =>
      titleWords.includes(keyword)
    ).length;

    if (directMatches >= 1) {
      return true;
    }

    const semanticScore = this.calculateSemanticSimilarity(titleWords, topicKeywords);
    return semanticScore > 0.3;
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private calculateSemanticSimilarity(titleWords: string, keywords: string[]): number {
    const titleWordList = titleWords.split(' ').filter((word) => word.length > 2);
    let matches = 0;

    for (const word of titleWordList) {
      for (const keyword of keywords) {
        if (word.includes(keyword) || keyword.includes(word)) {
          matches++;
          break;
        }
      }
    }

    return titleWordList.length > 0 ? matches / titleWordList.length : 0;
  }

  private ensureAllowedChannelOverlay(): HTMLElement {
    if (this.allowedChannelOverlay) {
      return this.allowedChannelOverlay;
    }

    const overlay = document.createElement('div');
    overlay.className = 'yfg-timer-overlay yfg-allowed-channel-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div class="yfg-timer-content yfg-allowed-channel-content">
        <div class="yfg-timer-title">Research Allowlist</div>
        <div class="yfg-allowed-channel-text" id="yfg-allowed-channel-text"></div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.allowedChannelOverlay = overlay;
    return overlay;
  }

  private ensureChannelActionButton(): HTMLButtonElement {
    if (this.channelActionButton) {
      return this.channelActionButton;
    }

    const button = document.createElement('button');
    button.className = 'yfg-channel-allowlist-btn';
    button.type = 'button';
    button.addEventListener('click', (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void this.handleAddCurrentChannel();
    });
    this.channelActionButton = button;
    return button;
  }

  private attachChannelActionButton(anchor: HTMLAnchorElement): void {
    if (!anchor.parentElement) {
      this.removeChannelActionButton();
      return;
    }

    const button = this.ensureChannelActionButton();
    button.dataset.channel = this.extractCurrentChannelName();
    if (button.parentNode !== anchor.parentElement) {
      anchor.parentElement.appendChild(button);
    }
  }

  private removeChannelActionButton(): void {
    if (this.channelActionButton?.parentNode) {
      this.channelActionButton.remove();
    }
  }

  private async handleAddCurrentChannel(): Promise<void> {
    const channelName = this.channelActionButton?.dataset.channel || this.extractCurrentChannelName();
    const normalizedChannel = this.normalizeChannelName(channelName);
    if (!normalizedChannel || this.isAllowedChannel(normalizedChannel)) {
      this.updateChannelActionButton();
      return;
    }

    if (this.channelActionButton) {
      this.channelActionButton.disabled = true;
      this.channelActionButton.classList.add('is-added');
      this.channelActionButton.textContent = 'Adding...';
    }

    const nextChannels = [...this.allowedChannels, normalizedChannel];
    await this.storage.updateResearchSettings({ allowedChannels: nextChannels });
    this.allowedChannels = [...new Set(nextChannels)];
    this.updateAllowedChannelOverlay();
    this.updateChannelActionButton();
  }

  private updateChannelActionButton(): void {
    if (!window.location.href.includes('/watch')) {
      this.removeChannelActionButton();
      return;
    }

    const anchor = this.getCurrentChannelAnchor();
    const channelName = this.extractCurrentChannelName();
    const normalizedChannel = this.normalizeChannelName(channelName);
    if (!anchor || !normalizedChannel) {
      this.removeChannelActionButton();
      this.scheduleMetadataRetry();
      return;
    }

    if (this.isAllowedChannel(normalizedChannel)) {
      this.removeChannelActionButton();
      return;
    }

    this.attachChannelActionButton(anchor);

    const button = this.ensureChannelActionButton();
    button.textContent = 'Add to Allowlist';
    button.disabled = false;
    button.classList.remove('is-added');
    button.title = `Add ${normalizedChannel} to the Research allowlist`;
  }

  private attachAllowedChannelOverlay(): void {
    const overlay = this.ensureAllowedChannelOverlay();
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');

    if (player && overlay.parentNode !== player) {
      overlay.classList.add('yfg-allowed-channel-overlay-player');
      player.appendChild(overlay);
    } else if (!player && overlay.parentNode !== document.body) {
      overlay.classList.remove('yfg-allowed-channel-overlay-player');
      document.body.appendChild(overlay);
    }
  }

  private showAllowedChannelOverlay(channelName: string): void {
    const normalizedChannel = this.normalizeChannelName(channelName);
    if (!normalizedChannel) {
      this.hideAllowedChannelOverlay();
      return;
    }

    const overlay = this.ensureAllowedChannelOverlay();
    const textElement = overlay.querySelector('#yfg-allowed-channel-text') as HTMLElement | null;
    if (textElement) {
      textElement.textContent = `Allowed Channel: ${normalizedChannel}`;
    }

    this.attachAllowedChannelOverlay();
    overlay.style.display = 'block';
  }

  private hideAllowedChannelOverlay(): void {
    if (this.allowedChannelOverlay) {
      this.allowedChannelOverlay.style.display = 'none';
    }
  }

  private updateAllowedChannelOverlay(): void {
    if (!this.isResearchMode || !this.currentTopic || !window.location.href.includes('/watch')) {
      this.hideAllowedChannelOverlay();
      return;
    }

    const channelName = this.extractCurrentChannelName();
    if (!channelName) {
      this.hideAllowedChannelOverlay();
      this.scheduleMetadataRetry();
      return;
    }

    if (this.isAllowedChannel(channelName)) {
      this.showAllowedChannelOverlay(channelName);
      return;
    }

    this.hideAllowedChannelOverlay();
  }

  private showTopicDriftWarning(videoTitle: string, videoUrl: string): void {
    if (!this.currentTopic) return;

    const warningKey = `${videoUrl}|${videoTitle}`;
    if (this.activeWarningKey === warningKey || document.querySelector('.yfg-drift-warning-modal')) {
      return;
    }
    this.activeWarningKey = warningKey;

    this.currentTopic.driftWarnings++;

    const modal = document.createElement('div');
    modal.className = 'yfg-drift-warning-modal';

    const isSecondWarning = this.currentTopic.driftWarnings >= 2;

    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>🚨 Topic Drift Detected</h3>
        <div class="yfg-drift-info">
          <p><strong>Current research topic:</strong></p>
          <div class="yfg-topic-tags">
            ${this.currentTopic.keywords.map((keyword) =>
              `<span class="yfg-topic-tag">${keyword}</span>`
            ).join('')}
          </div>
        </div>
        <div class="yfg-drift-video">
          <p><strong>Clicked video:</strong></p>
          <p class="yfg-video-title">"${videoTitle}"</p>
          <p class="yfg-drift-explanation">This video appears unrelated to your research topic.</p>
        </div>

        ${isSecondWarning ? `
          <div class="yfg-drift-limit">
            <p><strong>⚠️ Second drift detected</strong></p>
            <p>Continuing will end your research session.</p>
          </div>
        ` : ''}

        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-secondary" data-action="cancel">
            Stay on Topic
          </button>
          ${isSecondWarning ? `
            <button class="yfg-btn yfg-btn-danger" data-action="continue">
              End Research Session
            </button>
          ` : `
            <button class="yfg-btn yfg-btn-warning" data-action="continue">
              Allow Once
            </button>
          `}
        </div>

        <div class="yfg-drift-tips">
          💡 <strong>Tip:</strong> Use search to find videos related to your research topic
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'cancel') {
        this.activeWarningKey = null;
        modal.remove();
      } else if (action === 'continue') {
        this.activeWarningKey = null;
        modal.remove();

        if (isSecondWarning) {
          this.endResearchSession();
        } else {
          this.markVideoAllowedOnce(videoUrl);
          if (window.location.href !== videoUrl) {
            window.location.href = videoUrl;
          }
        }
      }
    });

    document.body.appendChild(modal);
  }

  private async endResearchSession(): Promise<void> {
    await this.storage.updateResearchSettings({
      mode: 'entertainment',
      currentTopic: [],
      sessionStart: 0
    });

    this.isResearchMode = false;
    this.currentTopic = null;
    this.hideAllowedChannelOverlay();
    this.removeChannelActionButton();

    const modal = document.createElement('div');
    modal.className = 'yfg-session-ended-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>📚 Research Session Ended</h3>
        <p>Your research session has ended due to topic drift.</p>
        <p>You are now in <strong>Entertainment Mode</strong> with a ${await this.getEntertainmentLimit()} minute daily limit.</p>
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-primary" data-action="continue">
            Continue Watching
          </button>
          <button class="yfg-btn yfg-btn-secondary" data-action="new-research">
            Start New Research
          </button>
        </div>
      </div>
    `;

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'continue') {
        modal.remove();
      } else if (action === 'new-research') {
        modal.remove();
        this.showResearchPrompt();
      }
    });

    document.body.appendChild(modal);

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  private async getEntertainmentLimit(): Promise<number> {
    const settings = await this.storage.getSettings();
    return settings.entertainment.dailyLimit;
  }

  private showResearchPrompt(): void {
    const modal = document.createElement('div');
    modal.className = 'yfg-research-prompt-modal';
    modal.innerHTML = `
      <div class="yfg-modal-content">
        <h3>🔬 Start New Research Session</h3>
        <p>What would you like to research?</p>
        <input type="text" class="yfg-research-input" placeholder="Enter research topic..." />
        <div class="yfg-modal-buttons">
          <button class="yfg-btn yfg-btn-primary" data-action="start-research">
            Start Research
          </button>
          <button class="yfg-btn yfg-btn-secondary" data-action="cancel">
            Cancel
          </button>
        </div>
      </div>
    `;

    const input = modal.querySelector('.yfg-research-input') as HTMLInputElement;

    modal.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const action = target.getAttribute('data-action');

      if (action === 'start-research') {
        const topic = input.value.trim();
        if (topic) {
          this.startNewResearchSession(topic);
          modal.remove();
        }
      } else if (action === 'cancel') {
        modal.remove();
      }
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const topic = input.value.trim();
        if (topic) {
          this.startNewResearchSession(topic);
          modal.remove();
        }
      }
    });

    document.body.appendChild(modal);
    input.focus();
  }

  private async startNewResearchSession(topic: string): Promise<void> {
    const keywords = topic.toLowerCase().split(/\s+/).filter((word) => word.length > 2);

    await this.storage.updateResearchSettings({
      mode: 'research',
      currentTopic: keywords,
      sessionStart: Date.now()
    });

    this.isResearchMode = true;
    this.currentTopic = {
      keywords: keywords,
      searchQuery: topic,
      originalTitle: topic,
      allowedTopics: keywords,
      sessionStart: Date.now(),
      driftWarnings: 0
    };

    this.activeWarningKey = null;
    this.setupTopicMonitoring();

    window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
  }

  private checkCurrentVideo(): void {
    if (!this.isResearchMode) {
      this.updateChannelActionButton();
      this.hideAllowedChannelOverlay();
      return;
    }

    this.updateChannelActionButton();
    if (!this.currentTopic) return;

    const videoTitle = this.extractCurrentVideoTitle();
    if (window.location.href.includes('/watch')) {
      const channelName = this.extractCurrentChannelName();
      if (!videoTitle || !channelName) {
        this.scheduleMetadataRetry();
        return;
      }

      if (this.consumeAllowedVideo(window.location.href)) {
        this.updateAllowedChannelOverlay();
        return;
      }

      const evaluation = this.evaluateVideoAccess(videoTitle, channelName);
      if (!evaluation.allowed) {
        this.hideAllowedChannelOverlay();
        this.showTopicDriftWarning(videoTitle, window.location.href);
        return;
      }

      this.updateAllowedChannelOverlay();
    } else {
      this.hideAllowedChannelOverlay();
      this.removeChannelActionButton();
    }
  }

  private extractSearchQuery(): string {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('search_query') || '';
  }

  async setResearchMode(mode: 'research' | 'entertainment', topic?: string): Promise<void> {
    if (mode === 'research') {
      this.isResearchMode = true;
      if (topic) {
        await this.startNewResearchSession(topic);
      }
    } else {
      this.isResearchMode = false;
      this.currentTopic = null;
      this.hideAllowedChannelOverlay();
      this.activeWarningKey = null;
      this.teardownTopicMonitoring();
      this.updateChannelActionButton();
    }
  }

  getCurrentTopic(): string[] {
    return this.currentTopic ? this.currentTopic.keywords : [];
  }

  isInResearchMode(): boolean {
    return this.isResearchMode;
  }

  destroy(): void {
    this.teardownTopicMonitoring();
    this.hideAllowedChannelOverlay();
    this.removeChannelActionButton();
  }
}

(window as any).TopicGuard = TopicGuard;