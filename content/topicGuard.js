/**
 * Topic Guard for YouTube Focus Guard (JS version)
 * Handles research mode and prevents algorithm rabbit holes
 */

class TopicGuard {
  static allowOnceStorageKey = 'yfg-topic-guard-allow-once';
  static navigationEventNames = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  static ignoredTopicWords = new Set([
    'a', 'an', 'and', 'are', 'for', 'from', 'how', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with',
    'youtube', 'video', 'videos', 'official', 'channel', 'watch', 'episode', 'live'
  ]);

  constructor() {
    this.currentTopic = null;
    this.storage = null;
    this.isResearchMode = false;
    this.allowedChannels = [];
    this.allowedChannelOverlay = null;
    this.channelActionButton = null;
    this.boundHandleVideoClick = (event) => this.handleVideoClick(event);
    this.metadataRetryTimeout = null;
    this.routeCheckTimeout = null;
    this.activeWarningKey = null;
    this.boundHandleNavigationSignal = () => this.scheduleTopicCheck();
    this.init();
  }

  static getInstance() {
    if (!TopicGuard.instance) {
      TopicGuard.instance = new TopicGuard();
    }
    return TopicGuard.instance;
  }

  async init() {
    await this.waitForDependencies();

    this.storage = window.StorageManager.getInstance();
    this.setupMessageListener();
    await this.loadResearchState();
    this.setupTopicMonitoring();
  }

  async waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (window.StorageManager) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  setupMessageListener() {
    if (!browser.runtime || !browser.runtime.onMessage) {
      return;
    }

    browser.runtime.onMessage.addListener((message) => {
      if (!message || !message.type) {
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

  async loadResearchState() {
    const settings = await this.storage.getSettings();

    this.isResearchMode = settings.research.mode === 'research';
    this.allowedChannels = Array.isArray(settings.research.allowedChannels)
      ? settings.research.allowedChannels.map((channel) => this.normalizeChannelName(channel)).filter(Boolean)
      : [];

    if (this.isResearchMode && settings.research.currentTopic.length > 0) {
      const fallbackSearchQuery = settings.research.currentTopic.join(' ');
      this.currentTopic = {
        keywords: settings.research.currentTopic,
        searchQuery: this.extractSearchQuery() || fallbackSearchQuery,
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

  async refreshResearchState() {
    this.teardownTopicMonitoring();

    await this.loadResearchState();

    if (this.isResearchMode) {
      this.setupTopicMonitoring();
    } else {
      this.hideAllowedChannelOverlay();
    }
  }

  teardownTopicMonitoring() {
    document.removeEventListener('click', this.boundHandleVideoClick, true);
    for (const eventName of TopicGuard.navigationEventNames) {
      document.removeEventListener(eventName, this.boundHandleNavigationSignal);
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

  setupTopicMonitoring() {
    if (!this.isResearchMode) return;

    document.removeEventListener('click', this.boundHandleVideoClick, true);
    document.addEventListener('click', this.boundHandleVideoClick, true);
    for (const eventName of TopicGuard.navigationEventNames) {
      document.addEventListener(eventName, this.boundHandleNavigationSignal);
    }
    window.addEventListener('popstate', this.boundHandleNavigationSignal);

    this.scheduleTopicCheck(1000);
  }

  scheduleTopicCheck(delay = 250) {
    if (this.routeCheckTimeout !== null) {
      window.clearTimeout(this.routeCheckTimeout);
    }

    this.routeCheckTimeout = window.setTimeout(() => {
      this.routeCheckTimeout = null;
      this.checkCurrentVideo();
    }, delay);
  }

  handleVideoClick(event) {
    if (!this.isResearchMode || !this.currentTopic) return;

    const target = event.target;
    const videoLink = this.findVideoLink(target);

    if (videoLink) {
      const videoTitle = this.extractVideoTitle(videoLink);
      const channelName = this.extractChannelNameFromLink(videoLink);
      const channelHost = videoLink.closest('ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-rich-grid-media, ytd-item-section-renderer');
      const channelCandidates = this.extractChannelCandidatesFromRoot(channelHost || videoLink.parentElement || document);

      if (!channelName && channelCandidates.length === 0) {
        return;
      }

      const evaluation = this.evaluateVideoAccess(videoTitle, channelName, channelCandidates);

      if (!evaluation.allowed) {
        event.preventDefault();
        event.stopPropagation();
        this.showTopicDriftWarning(videoTitle, videoLink.href);
      }
    }
  }

  findVideoLink(element) {
    let current = element;

    while (current && current !== document.body) {
      if (current.tagName === 'A' && current.getAttribute('href') &&
          current.getAttribute('href').includes('/watch')) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  getVideoCardRoot(linkElement) {
    return linkElement.closest(
      'ytd-compact-video-renderer, ' +
      'ytd-rich-item-renderer, ' +
      'ytd-video-renderer, ' +
      'ytd-grid-video-renderer, ' +
      'ytd-playlist-video-renderer, ' +
      'ytd-rich-grid-media, ' +
      'ytd-item-section-renderer, ' +
      'ytd-reel-item-renderer'
    ) || linkElement.parentElement;
  }

  isLikelyVideoTitle(value) {
    const trimmedValue = (value || '').trim();
    if (!trimmedValue) {
      return false;
    }

    const normalizedValue = trimmedValue.replace(/\s+/g, ' ');
    if (/^(?:(?:\d+:)?\d{1,2}:\d{2}\s*)+(?:now playing)?$/i.test(normalizedValue)) {
      return false;
    }

    if (/^(?:now playing|live|shorts?)$/i.test(normalizedValue)) {
      return false;
    }

    return /[a-z]{2,}/i.test(normalizedValue);
  }

  readTitleCandidate(element) {
    if (!element) {
      return '';
    }

    const textCandidate = element.textContent ? element.textContent.trim() : '';
    if (this.isLikelyVideoTitle(textCandidate)) {
      return textCandidate;
    }

    const titleCandidate = element.getAttribute('title') || '';
    if (this.isLikelyVideoTitle(titleCandidate)) {
      return titleCandidate;
    }

    const ariaCandidate = element.getAttribute('aria-label') || '';
    if (this.isLikelyVideoTitle(ariaCandidate)) {
      return ariaCandidate;
    }

    return '';
  }

  extractVideoTitle(linkElement) {
    const searchRoots = [this.getVideoCardRoot(linkElement), linkElement];
    const titleSelectors = [
      '#video-title',
      '#video-title-link',
      'a#video-title-link',
      'yt-formatted-string#video-title',
      'h3 a',
      'h3'
    ];

    for (const root of searchRoots) {
      if (!root || !root.querySelector) {
        continue;
      }

      for (const selector of titleSelectors) {
        const candidate = this.readTitleCandidate(root.querySelector(selector));
        if (candidate) {
          return candidate;
        }
      }
    }

    const ownTitle = this.readTitleCandidate(linkElement);
    if (ownTitle) {
      return ownTitle;
    }

    const cardRoot = this.getVideoCardRoot(linkElement);
    if (cardRoot && cardRoot.querySelector) {
      const fallbackTitle = this.readTitleCandidate(cardRoot.querySelector('.ytd-video-meta-block .style-scope, [title], [aria-label]'));
      if (fallbackTitle) {
        return fallbackTitle;
      }
    }

    return '';
  }

  getWatchTitleElement() {
    return document.querySelector('ytd-watch-metadata h1 yt-formatted-string, ytd-video-primary-info-renderer h1.title, h1.ytd-watch-metadata');
  }

  extractCurrentVideoTitle() {
    const watchTitle = this.getWatchTitleElement();
    const rawWatchTitle = watchTitle && watchTitle.textContent ? watchTitle.textContent.trim() : '';

    if (window.location.href.includes('/watch')) {
      return rawWatchTitle ? this.normalizePageTitle(rawWatchTitle) : '';
    }

    const rawTitle = rawWatchTitle || document.title;
    return this.normalizePageTitle(rawTitle);
  }

  normalizePageTitle(title) {
    return (title || '').replace(/\s*-\s*YouTube$/i, '').trim();
  }

  normalizeChannelName(channelName) {
    return (channelName || '').toLowerCase().trim().replace(/^@+/, '').replace(/\s+/g, ' ');
  }

  extractChannelCandidates(channelElement) {
    if (!channelElement) {
      return [];
    }

    const candidates = new Set();
    const addCandidate = (value) => {
      const normalized = this.normalizeChannelName(value);
      if (normalized) {
        candidates.add(normalized);
      }
    };

    addCandidate((channelElement.textContent || '').trim());
    addCandidate((channelElement.getAttribute('aria-label') || '')
      .replace(/\s*subscribers?.*$/i, '')
      .replace(/\s*videos?.*$/i, '')
      .trim());

    const href = channelElement.getAttribute('href') || '';
    const hrefMatch = href.match(/^\/(?:@|channel\/|c\/|user\/)([^/?#]+)/i);
    if (hrefMatch && hrefMatch[1]) {
      addCandidate(hrefMatch[1]);
    }

    return [...candidates];
  }

  extractChannelCandidatesFromRoot(root) {
    if (!root || !root.querySelector) {
      return [];
    }

    const channelElement = root.querySelector(
      'ytd-channel-name a, ' +
      '#owner #channel-name a, ' +
      '#channel-name a, ' +
      '#byline a, ' +
      '#upload-info #channel-name a, ' +
      'a[href^="/@"], ' +
      'a[href^="/channel/"], ' +
      'a[href^="/c/"], ' +
      'a[href^="/user/"]'
    );

    return this.extractChannelCandidates(channelElement);
  }

  extractCurrentChannelName() {
    const watchOwnerRoot = this.getWatchPageOwnerRoot();
    if (watchOwnerRoot) {
      return this.extractChannelNameFromRoot(watchOwnerRoot);
    }

    return '';
  }

  getWatchPageOwnerRoot() {
    return document.querySelector(
      'ytd-watch-metadata #owner, ' +
      'ytd-watch-metadata ytd-video-owner-renderer, ' +
      'ytd-watch-flexy #owner, ' +
      'ytd-watch-flexy ytd-video-owner-renderer, ' +
      '#above-the-fold #owner, ' +
      '#upload-info'
    );
  }

  getCurrentChannelAnchor() {
    const watchOwnerRoot = this.getWatchPageOwnerRoot();
    if (!watchOwnerRoot) {
      return null;
    }

    return watchOwnerRoot.querySelector(
      'ytd-watch-metadata ytd-channel-name a, ' +
      'ytd-video-owner-renderer ytd-channel-name a, ' +
      '#owner #channel-name a, ' +
      '#channel-name a, ' +
      '#upload-info #channel-name a, ' +
      'a[href^="/@"], ' +
      'a[href^="/channel/"], ' +
      'a[href^="/c/"], ' +
      'a[href^="/user/"], ' +
      'a.yt-simple-endpoint.yt-formatted-string[href^="/@"], ' +
      'a.yt-simple-endpoint.yt-formatted-string[href^="/channel/"]'
    );
  }

  getChannelActionHost(anchor) {
    const anchorElement = anchor || this.getCurrentChannelAnchor();
    if (!anchorElement) {
      return this.getWatchPageOwnerRoot();
    }

    return anchorElement.closest('ytd-channel-name, ytd-video-owner-renderer, #channel-name, #owner, #upload-info');
  }

  extractChannelNameFromLink(linkElement) {
    const channelHost = linkElement.closest('ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer, ytd-rich-grid-media, ytd-item-section-renderer');
    return this.extractChannelNameFromRoot(channelHost || linkElement.parentElement || document);
  }

  extractChannelNameFromRoot(root) {
    return this.extractChannelCandidatesFromRoot(root)[0] || '';
  }

  scheduleMetadataRetry() {
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

  isAllowedChannel(channelName) {
    if (!channelName || this.allowedChannels.length === 0) {
      return false;
    }

    return this.allowedChannels.includes(this.normalizeChannelName(channelName));
  }

  isAnyAllowedChannel(channelCandidates) {
    if (!Array.isArray(channelCandidates) || channelCandidates.length === 0 || this.allowedChannels.length === 0) {
      return false;
    }

    return channelCandidates.some((candidate) => this.allowedChannels.includes(this.normalizeChannelName(candidate)));
  }

  evaluateVideoAccess(videoTitle, channelName, channelCandidates = []) {
    // Trusted research channels bypass keyword matching to avoid false negatives.
    if (this.isAllowedChannel(channelName) || this.isAnyAllowedChannel(channelCandidates)) {
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

  getVideoAccessKey(videoUrl) {
    try {
      const parsedUrl = new URL(videoUrl, window.location.origin);
      return parsedUrl.searchParams.get('v') || parsedUrl.href;
    } catch {
      return videoUrl;
    }
  }

  markVideoAllowedOnce(videoUrl) {
    sessionStorage.setItem(TopicGuard.allowOnceStorageKey, this.getVideoAccessKey(videoUrl));
  }

  consumeAllowedVideo(videoUrl) {
    const storedValue = sessionStorage.getItem(TopicGuard.allowOnceStorageKey);
    const currentValue = this.getVideoAccessKey(videoUrl);

    if (storedValue && storedValue === currentValue) {
      sessionStorage.removeItem(TopicGuard.allowOnceStorageKey);
      return true;
    }

    return false;
  }

  isVideoRelated(videoTitle) {
    if (!this.currentTopic || !videoTitle) return true;

    const titleWords = this.normalizeText(videoTitle);
    const titleTokens = this.tokenizeText(videoTitle);
    const topicKeywords = this.expandTopicKeywords(this.currentTopic.keywords);

    if (topicKeywords.length === 0) {
      return true;
    }

    const normalizedTopicPhrase = this.normalizeText(this.currentTopic.keywords.join(' '));
    if (normalizedTopicPhrase && titleWords.includes(normalizedTopicPhrase)) {
      return true;
    }

    const directMatches = topicKeywords.filter((keyword) => titleTokens.includes(keyword)).length;
    const keywordCoverage = this.calculateKeywordCoverage(titleTokens, topicKeywords);

    const minimumMatchCount = topicKeywords.length === 1 ? 1 : Math.min(2, topicKeywords.length);
    if (directMatches >= minimumMatchCount) {
      return true;
    }

    if (directMatches >= 1 && keywordCoverage >= 0.4) {
      return true;
    }

    const semanticScore = this.calculateSemanticSimilarity(titleTokens, topicKeywords);
    return semanticScore >= 0.6 || keywordCoverage >= 0.55;
  }

  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  tokenizeText(text) {
    return [...new Set(this.normalizeText(text)
      .split(' ')
      .map((word) => this.normalizeTopicToken(word))
      .filter(Boolean))];
  }

  expandTopicKeywords(keywords) {
    const expandedKeywords = [];

    for (const keyword of keywords || []) {
      expandedKeywords.push(...this.tokenizeText(keyword));
    }

    return [...new Set(expandedKeywords)];
  }

  normalizeTopicToken(word) {
    let normalizedWord = (word || '').toLowerCase().trim();

    if (!normalizedWord || normalizedWord.length <= 2 || TopicGuard.ignoredTopicWords.has(normalizedWord)) {
      return '';
    }

    if (normalizedWord.endsWith('ies') && normalizedWord.length > 4) {
      normalizedWord = `${normalizedWord.slice(0, -3)}y`;
    } else if (normalizedWord.endsWith('es') && normalizedWord.length > 4) {
      normalizedWord = normalizedWord.slice(0, -2);
    } else if (normalizedWord.endsWith('s') && normalizedWord.length > 3 && !normalizedWord.endsWith('ss')) {
      normalizedWord = normalizedWord.slice(0, -1);
    }

    if (normalizedWord.length <= 2 || TopicGuard.ignoredTopicWords.has(normalizedWord)) {
      return '';
    }

    return normalizedWord;
  }

  calculateSemanticSimilarity(titleWords, keywords) {
    if (keywords.length === 0) {
      return 0;
    }

    let matches = 0;

    for (const keyword of keywords) {
      const keywordMatched = titleWords.some((word) => {
        if (word === keyword) {
          return true;
        }

        if (keyword.length < 4 || word.length < 4) {
          return false;
        }

        return word.includes(keyword) || keyword.includes(word);
      });

      if (keywordMatched) {
        matches++;
      }
    }

    return matches / keywords.length;
  }

  calculateKeywordCoverage(titleWords, keywords) {
    if (keywords.length === 0) {
      return 0;
    }

    const totalWeight = keywords.reduce((sum, keyword) => sum + keyword.length, 0);
    if (totalWeight === 0) {
      return 0;
    }

    const matchedWeight = keywords.reduce((sum, keyword) => {
      const keywordMatched = titleWords.some((word) => word === keyword || (keyword.length >= 4 && word.length >= 4 && (word.includes(keyword) || keyword.includes(word))));
      return sum + (keywordMatched ? keyword.length : 0);
    }, 0);

    return matchedWeight / totalWeight;
  }

  ensureAllowedChannelOverlay() {
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

  ensureChannelActionButton() {
    if (this.channelActionButton) {
      return this.channelActionButton;
    }

    const button = document.createElement('button');
    button.className = 'yfg-channel-allowlist-btn';
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.handleAddCurrentChannel();
    });
    this.channelActionButton = button;
    return button;
  }

  attachChannelActionButton(anchor) {
    const host = this.getChannelActionHost(anchor);
    const button = this.ensureChannelActionButton();
    button.dataset.channel = this.extractCurrentChannelName();
    button.classList.remove('is-floating');

    if (!host) {
      if (button.parentNode !== document.body) {
        document.body.appendChild(button);
      }
      button.classList.add('is-floating');
      return;
    }

    if ((anchor === null || anchor === void 0 ? void 0 : anchor.parentElement) && button.previousElementSibling !== anchor) {
      anchor.insertAdjacentElement('afterend', button);
      return;
    }

    if (button.parentNode !== host) {
      host.appendChild(button);
    }
  }

  removeChannelActionButton() {
    if (this.channelActionButton && this.channelActionButton.parentNode) {
      this.channelActionButton.remove();
    }
  }

  async handleAddCurrentChannel() {
    const channelName = (this.channelActionButton && this.channelActionButton.dataset.channel) || this.extractCurrentChannelName();
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

  updateChannelActionButton() {
    this.removeChannelActionButton();
  }

  attachAllowedChannelOverlay() {
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

  showAllowedChannelOverlay(channelName) {
    const normalizedChannel = this.normalizeChannelName(channelName);
    if (!normalizedChannel) {
      this.hideAllowedChannelOverlay();
      return;
    }

    const overlay = this.ensureAllowedChannelOverlay();
    const textElement = overlay.querySelector('#yfg-allowed-channel-text');
    if (textElement) {
      textElement.textContent = `Allowed Channel: ${normalizedChannel}`;
    }

    this.attachAllowedChannelOverlay();
    overlay.style.display = 'block';
  }

  hideAllowedChannelOverlay() {
    if (this.allowedChannelOverlay) {
      this.allowedChannelOverlay.style.display = 'none';
    }
  }

  updateAllowedChannelOverlay() {
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

  showTopicDriftWarning(videoTitle, videoUrl) {
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
    const readableTopic = this.currentTopic.searchQuery || this.currentTopic.keywords.join(', ');

    const content = document.createElement('div');
    content.className = 'yfg-modal-content';

    const title = document.createElement('h3');
    title.textContent = '🚨 Topic Drift Detected';

    const driftInfo = document.createElement('div');
    driftInfo.className = 'yfg-drift-info';
    const currentTopicLabel = document.createElement('p');
    const currentTopicStrong = document.createElement('strong');
    currentTopicStrong.textContent = 'Current research topic:';
    currentTopicLabel.appendChild(currentTopicStrong);
    const currentTopicValue = document.createElement('p');
    currentTopicValue.className = 'yfg-video-title';
    currentTopicValue.textContent = `"${readableTopic}"`;
    const topicTags = document.createElement('div');
    topicTags.className = 'yfg-topic-tags';
    for (const keyword of this.currentTopic.keywords) {
      const tag = document.createElement('span');
      tag.className = 'yfg-topic-tag';
      tag.textContent = keyword;
      topicTags.appendChild(tag);
    }
    driftInfo.append(currentTopicLabel, currentTopicValue, topicTags);

    const driftVideo = document.createElement('div');
    driftVideo.className = 'yfg-drift-video';
    const clickedLabel = document.createElement('p');
    const clickedStrong = document.createElement('strong');
    clickedStrong.textContent = 'Clicked video:';
    clickedLabel.appendChild(clickedStrong);
    const clickedValue = document.createElement('p');
    clickedValue.className = 'yfg-video-title';
    clickedValue.textContent = `"${videoTitle}"`;
    const explanation = document.createElement('p');
    explanation.className = 'yfg-drift-explanation';
    explanation.textContent = 'This video appears unrelated to your research topic.';
    driftVideo.append(clickedLabel, clickedValue, explanation);

    const buttons = document.createElement('div');
    buttons.className = 'yfg-modal-buttons';
    const cancelButton = document.createElement('button');
    cancelButton.className = 'yfg-btn yfg-btn-secondary';
    cancelButton.type = 'button';
    cancelButton.dataset.action = 'cancel';
    cancelButton.textContent = 'Stay on Topic';
    const continueButton = document.createElement('button');
    continueButton.className = `yfg-btn ${isSecondWarning ? 'yfg-btn-danger' : 'yfg-btn-warning'}`;
    continueButton.type = 'button';
    continueButton.dataset.action = 'continue';
    continueButton.textContent = isSecondWarning ? 'End Research Session' : 'Allow Once';
    buttons.append(cancelButton, continueButton);

    const tip = document.createElement('div');
    tip.className = 'yfg-drift-tips';
    const tipStrong = document.createElement('strong');
    tipStrong.textContent = 'Tip:';
    tip.append('💡 ', tipStrong, ' Use search to find videos related to your research topic');

    content.append(title, driftInfo, driftVideo);

    if (isSecondWarning) {
      const driftLimit = document.createElement('div');
      driftLimit.className = 'yfg-drift-limit';
      const warningLine = document.createElement('p');
      const warningStrong = document.createElement('strong');
      warningStrong.textContent = '⚠️ Second drift detected';
      warningLine.appendChild(warningStrong);
      const warningDetail = document.createElement('p');
      warningDetail.textContent = 'Continuing will end your research session.';
      driftLimit.append(warningLine, warningDetail);
      content.appendChild(driftLimit);
    }

    content.append(buttons, tip);
    modal.appendChild(content);

    modal.addEventListener('click', (e) => {
      const target = e.target;
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

  async endResearchSession() {
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
    const entertainmentLimit = await this.getEntertainmentLimit();
    const content = document.createElement('div');
    content.className = 'yfg-modal-content';
    const title = document.createElement('h3');
    title.textContent = '📚 Research Session Ended';
    const summary = document.createElement('p');
    summary.textContent = 'Your research session has ended due to topic drift.';
    const limitMessage = document.createElement('p');
    limitMessage.append('You are now in ');
    const modeStrong = document.createElement('strong');
    modeStrong.textContent = 'Entertainment Mode';
    limitMessage.append(modeStrong, ` with a ${entertainmentLimit} minute daily limit.`);
    const buttons = document.createElement('div');
    buttons.className = 'yfg-modal-buttons';
    const continueButton = document.createElement('button');
    continueButton.className = 'yfg-btn yfg-btn-primary';
    continueButton.type = 'button';
    continueButton.dataset.action = 'continue';
    continueButton.textContent = 'Continue Watching';
    const researchButton = document.createElement('button');
    researchButton.className = 'yfg-btn yfg-btn-secondary';
    researchButton.type = 'button';
    researchButton.dataset.action = 'new-research';
    researchButton.textContent = 'Start New Research';
    buttons.append(continueButton, researchButton);
    content.append(title, summary, limitMessage, buttons);
    modal.appendChild(content);

    modal.addEventListener('click', (e) => {
      const target = e.target;
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

  async getEntertainmentLimit() {
    const settings = await this.storage.getSettings();
    return settings.entertainment.dailyLimit;
  }

  showResearchPrompt() {
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

    const input = modal.querySelector('.yfg-research-input');

    modal.addEventListener('click', (e) => {
      const target = e.target;
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

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const topic = input.value.trim();
          if (topic) {
            this.startNewResearchSession(topic);
            modal.remove();
          }
        }
      });
    }

    document.body.appendChild(modal);
    if (input) input.focus();
  }

  async startNewResearchSession(topic) {
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

  checkCurrentVideo() {
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
      const channelCandidates = this.extractChannelCandidatesFromRoot(this.getWatchPageOwnerRoot());
      if (!videoTitle) {
        this.scheduleMetadataRetry();
        return;
      }

      if (this.consumeAllowedVideo(window.location.href)) {
        this.updateAllowedChannelOverlay();
        return;
      }

      const evaluation = this.evaluateVideoAccess(videoTitle, channelName, channelCandidates);
      if (!evaluation.allowed) {
        this.hideAllowedChannelOverlay();
        if (!channelName && channelCandidates.length === 0) {
          this.scheduleMetadataRetry();
        }
        this.showTopicDriftWarning(videoTitle, window.location.href);
        return;
      }

      if (!channelName && channelCandidates.length === 0) {
        this.scheduleMetadataRetry();
      }
      this.updateAllowedChannelOverlay();
    } else {
      this.hideAllowedChannelOverlay();
      this.removeChannelActionButton();
    }
  }

  extractSearchQuery() {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('search_query') || '';
  }

  async setResearchMode(mode, topic) {
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

  getCurrentTopic() {
    return this.currentTopic ? this.currentTopic.keywords : [];
  }

  isInResearchMode() {
    return this.isResearchMode;
  }

  destroy() {
    this.teardownTopicMonitoring();
    this.hideAllowedChannelOverlay();
    this.removeChannelActionButton();
  }
}

window.TopicGuard = TopicGuard;