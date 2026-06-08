/**
 * Topic Guard for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Enforces intention focus on watch pages and handles drift check-ins.
 */

class TopicGuard {
  static allowOnceStorageKey = 'yfg-topic-guard-allow-once';
  static ignoredTopicWords = new Set([
    'a', 'an', 'and', 'are', 'for', 'from', 'how', 'in', 'into', 'of', 'on', 'or', 'the', 'to', 'with',
    'youtube', 'video', 'videos', 'official', 'channel', 'watch', 'episode', 'live'
  ]);
  static instance;
  
  storage;
  metadataRetryTimeout = null;
  activeOverlay = null;
  currentVideoId = null;

  static getInstance() {
    if (!TopicGuard.instance) {
      TopicGuard.instance = new TopicGuard();
    }
    return TopicGuard.instance;
  }

  constructor() {
    this.init();
  }

  async init() {
    this.storage = window.StorageManager.getInstance();
  }

  hideCheckInOverlays() {
    if (this.activeOverlay) {
      this.activeOverlay.remove();
      this.activeOverlay = null;
    }
  }

  async evaluateCurrentVideoAccess() {
    const settings = await this.storage.getSettings();
    if (!settings.activeIntention) return false;

    const videoTitle = this.extractCurrentVideoTitle();
    const channelName = this.extractCurrentChannelName();
    
    if (!videoTitle) {
      return true; // Let it bypass if metadata not loaded yet
    }

    if (this.consumeAllowedVideo(window.location.href)) {
      return true;
    }

    const keywords = settings.activeIntention.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    return this.isTitleRelated(videoTitle, keywords) || this.normalizeText(channelName).includes(this.normalizeText(settings.activeIntention));
  }

  async checkCurrentVideo() {
    if (!window.location.href.includes('/watch')) {
      this.hideCheckInOverlays();
      return;
    }

    const videoId = this.extractVideoId(window.location.href);
    if (videoId !== this.currentVideoId) {
      this.currentVideoId = videoId;
      this.hideCheckInOverlays();
    }

    const settings = await this.storage.getSettings();

    // 1. If NO active intention, force setting one via watch-page Intent Portal overlay
    if (!settings.activeIntention) {
      this.showWatchPagePortal();
      return;
    }

    // 2. If active intention exists, check if video is related
    const videoTitle = this.extractCurrentVideoTitle();
    const channelName = this.extractCurrentChannelName();

    if (!videoTitle) {
      this.scheduleMetadataRetry();
      return;
    }

    if (this.consumeAllowedVideo(window.location.href)) {
      this.hideCheckInOverlays();
      // Notify background that we are in intentional state
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: true }
      });
      return;
    }

    const keywords = settings.activeIntention.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const isRelated = this.isTitleRelated(videoTitle, keywords) || 
                      this.normalizeText(channelName).includes(this.normalizeText(settings.activeIntention));

    if (!isRelated) {
      // Pause video and show Drift Check-in
      const video = document.querySelector('video');
      if (video && !video.paused) {
        video.pause();
      }
      this.showDriftCheckIn(videoTitle, settings.activeIntention);
      
      // Notify background that we have drifted
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: false }
      });
    } else {
      this.hideCheckInOverlays();
      // Notify background that we are intentional
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: true }
      });
    }
  }

  showWatchPagePortal() {
    if (document.getElementById('yfg-watch-portal-overlay')) {
      return;
    }

    const video = document.querySelector('video');
    if (video && !video.paused) {
      video.pause();
    }

    this.hideCheckInOverlays();

    const overlay = document.createElement('div');
    overlay.id = 'yfg-watch-portal-overlay';
    overlay.className = 'yfg-modal-overlay yfg-modal-page';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(11, 13, 18, 0.95);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483640;
      color: #fff;
    `;

    overlay.innerHTML = `
      <div class="yfg-modal-content" style="padding: 30px; text-align: center; max-width: 420px; display: flex; flex-direction: column; gap: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0;">🎯 What is your intention?</h3>
        <p style="font-size: 13px; color: var(--yfg-color-text-muted); margin: 0;">Please enter your focus for this session before playing this video.</p>
        <input type="text" id="yfg-watch-portal-input" class="input-field" placeholder="E.g., CSS layout tutorial..." style="width: 100%;" />
        <button class="yfg-btn yfg-btn-primary" id="yfg-watch-portal-submit" style="width: 100%;">Confirm & Watch</button>
      </div>
    `;

    this.attachOverlayToVideoPlayer(overlay);
    this.activeOverlay = overlay;

    const input = overlay.querySelector('#yfg-watch-portal-input');
    const submit = overlay.querySelector('#yfg-watch-portal-submit');

    const saveIntention = async () => {
      const text = input.value.trim();
      if (text) {
        await this.storage.setIntention(text);
        overlay.remove();
        this.activeOverlay = null;
        if (video) {
          video.play();
        }
        await this.checkCurrentVideo();
      }
    };

    submit?.addEventListener('click', () => saveIntention());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveIntention();
    });
  }

  showDriftCheckIn(videoTitle, activeIntention) {
    if (document.getElementById('yfg-drift-checkin-overlay')) {
      return;
    }

    this.hideCheckInOverlays();

    const overlay = document.createElement('div');
    overlay.id = 'yfg-drift-checkin-overlay';
    overlay.className = 'yfg-modal-overlay yfg-modal-page';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(11, 13, 18, 0.95);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483640;
      color: #fff;
    `;

    overlay.innerHTML = `
      <div class="yfg-modal-content" style="padding: 30px; text-align: left; max-width: 450px; display: flex; flex-direction: column; gap: 16px;">
        <h3 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--yfg-color-warning);">🚨 Focus Drift Detector</h3>
        
        <div style="padding: 10px; border-radius: var(--yfg-radius-sm); background: rgba(255,255,255,0.02); border: 1px solid var(--yfg-color-border);">
          <span style="font-size: 11px; text-transform: uppercase; color: var(--yfg-color-text-muted); font-weight: bold;">Your Active Focus:</span>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600;">"${activeIntention}"</p>
        </div>

        <div style="padding: 10px; border-radius: var(--yfg-radius-sm); background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.15);">
          <span style="font-size: 11px; text-transform: uppercase; color: var(--yfg-color-text-muted); font-weight: bold;">Clicked Video:</span>
          <p style="margin: 4px 0 0; font-size: 13px; font-style: italic;">"${videoTitle}"</p>
        </div>

        <p style="font-size: 13px; color: var(--yfg-color-text-muted); margin: 0;">This video does not seem to match your intention. How would you like to proceed?</p>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button class="yfg-btn yfg-btn-primary" id="yfg-drift-back-btn" style="width: 100%;">🔙 Go Back to Search Results</button>
          <div style="display: flex; gap: 8px;">
            <button class="yfg-btn yfg-btn-secondary" id="yfg-drift-update-btn" style="flex: 1;">Update Intention</button>
            <button class="yfg-btn yfg-btn-secondary" id="yfg-drift-bypass-btn" style="flex: 1; border-color: rgba(239, 68, 68, 0.3) !important;">Reveal & Watch</button>
          </div>
        </div>

        <div id="yfg-drift-update-box" style="display: none; flex-direction: column; gap: 8px; margin-top: 4px;">
          <input type="text" id="yfg-drift-update-input" class="input-field" placeholder="Enter new intention..." style="padding: 8px 12px; font-size: 13px;" />
          <button class="yfg-btn yfg-btn-primary" id="yfg-drift-update-submit" style="width: fit-content; align-self: flex-end;">Save & Watch</button>
        </div>
      </div>
    `;

    this.attachOverlayToVideoPlayer(overlay);
    this.activeOverlay = overlay;

    const backBtn = overlay.querySelector('#yfg-drift-back-btn');
    const updateBtn = overlay.querySelector('#yfg-drift-update-btn');
    const bypassBtn = overlay.querySelector('#yfg-drift-bypass-btn');
    const updateBox = overlay.querySelector('#yfg-drift-update-box');
    const updateInput = overlay.querySelector('#yfg-drift-update-input');
    const updateSubmit = overlay.querySelector('#yfg-drift-update-submit');

    backBtn?.addEventListener('click', () => {
      overlay.remove();
      this.activeOverlay = null;
      window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(activeIntention)}`;
    });

    updateBtn?.addEventListener('click', () => {
      updateBox.style.display = 'flex';
      updateInput.focus();
    });

    const triggerUpdate = async () => {
      const newIntent = updateInput.value.trim();
      if (newIntent) {
        await this.storage.setIntention(newIntent);
        overlay.remove();
        this.activeOverlay = null;
        
        await browser.runtime.sendMessage({
          type: 'intent-status-changed',
          data: { isIntentional: true }
        });

        const video = document.querySelector('video');
        if (video) video.play();
        await this.checkCurrentVideo();
      }
    };

    updateSubmit?.addEventListener('click', () => triggerUpdate());
    updateInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') triggerUpdate();
    });

    bypassBtn?.addEventListener('click', async () => {
      // Mark as bypassed/allowed once
      this.markVideoAllowedOnce(window.location.href);
      overlay.remove();
      this.activeOverlay = null;
      
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: false }
      });

      const video = document.querySelector('video');
      if (video) video.play();
    });
  }

  attachOverlayToVideoPlayer(overlay) {
    const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
    if (player) {
      player.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }
  }

  isTitleRelated(title, keywords) {
    const titleLower = title.toLowerCase();
    const titleNormalized = this.normalizeText(titleLower);
    const titleTokens = titleNormalized.split(' ').filter(w => w.length > 2);
    
    let matches = 0;
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower.includes(' ')) {
        if (titleLower.includes(kwLower)) {
          return true;
        }
      }
      
      if (titleTokens.includes(kwLower) || titleLower.includes(kwLower)) {
        matches++;
      }
    }

    return matches > 0;
  }

  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  scheduleMetadataRetry() {
    if (this.metadataRetryTimeout !== null || !window.location.href.includes('/watch')) {
      return;
    }

    this.metadataRetryTimeout = window.setTimeout(() => {
      this.metadataRetryTimeout = null;
      this.checkCurrentVideo();
    }, 600);
  }

  getWatchTitleElement() {
    return document.querySelector('ytd-watch-metadata h1 yt-formatted-string, ytd-video-primary-info-renderer h1.title, h1.ytd-watch-metadata');
  }

  extractCurrentVideoTitle() {
    const watchTitle = this.getWatchTitleElement();
    const rawWatchTitle = watchTitle?.textContent?.trim();

    if (window.location.href.includes('/watch')) {
      return rawWatchTitle ? this.normalizePageTitle(rawWatchTitle) : '';
    }
    return '';
  }

  normalizePageTitle(title) {
    return (title || '').replace(/\s*-\s*YouTube$/i, '').trim();
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

    if (!channelElement) return [];
    return [channelElement.textContent?.trim() || ''];
  }

  extractChannelNameFromRoot(root) {
    return this.extractChannelCandidatesFromRoot(root)[0] || '';
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

  extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  destroy() {
    this.hideCheckInOverlays();
  }
}

window.TopicGuard = TopicGuard;