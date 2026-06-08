/**
 * Usage Tracker for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Tracks watch time statistics in the background.
 */

class UsageTracker {
  static instance;
  sessions = new Map();
  
  static getInstance() {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  constructor() {
    this.setupMessageHandling();
  }

  setupMessageHandling() {
    browser.tabs?.onRemoved?.addListener((tabId) => {
      this.endSession(tabId);
    });

    browser.runtime.onMessage.addListener((message, sender) => {
      if (sender.tab?.id) {
        this.handleContentMessage(message, sender.tab.id);
      }
      return false;
    });
  }

  async handleContentMessage(message, tabId) {
    const { type, data } = message;
    
    switch (type) {
      case 'session-start':
        await this.startSession(tabId, data.isIntentional);
        break;
        
      case 'video-started':
        await this.trackVideoStart(tabId, data.videoId, data.isIntentional);
        break;
        
      case 'video-paused':
        await this.trackVideoPause(tabId, data.videoId);
        break;
        
      case 'video-ended':
        await this.trackVideoEnd(tabId, data.videoId);
        break;
        
      case 'page-unload':
        await this.endSession(tabId);
        break;
        
      case 'intent-status-changed':
        await this.updateIntentStatus(tabId, data.isIntentional);
        break;
        
      case 'activity':
        this.updateLastActivity(tabId);
        break;
    }
  }

  async startSession(tabId, isIntentional = true) {
    const now = Date.now();
    const session = {
      startTime: now,
      isIntentional: isIntentional,
      videoStartTimes: new Map(),
      totalWatchTime: 0,
      lastActivity: now
    };
    
    this.sessions.set(tabId, session);
  }

  async trackVideoStart(tabId, videoId, isIntentional = true) {
    let session = this.sessions.get(tabId);
    if (!session) {
      await this.startSession(tabId, isIntentional);
      session = this.sessions.get(tabId);
    }

    if (!videoId) return;
    
    // If there was a previous playing video, pause it first
    for (const [vId, _] of session.videoStartTimes) {
      if (vId !== videoId) {
        await this.trackVideoPause(tabId, vId);
      }
    }

    session.isIntentional = isIntentional;
    session.videoStartTimes.set(videoId, Date.now());
    session.lastActivity = Date.now();
  }

  async trackVideoPause(tabId, videoId) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    const startTime = session.videoStartTimes.get(videoId);
    if (startTime) {
      const watchTimeMs = Date.now() - startTime;
      session.totalWatchTime += watchTimeMs;
      session.videoStartTimes.delete(videoId);
      
      const seconds = Math.floor(watchTimeMs / 1000);
      if (seconds > 0) {
        const storage = StorageManager.getInstance();
        await storage.updateWatchTime(seconds, session.isIntentional);
      }
    }
    
    session.lastActivity = Date.now();
  }

  async trackVideoEnd(tabId, videoId) {
    await this.trackVideoPause(tabId, videoId);
  }

  async endSession(tabId) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    // Track any remaining watch time for active videos
    for (const [videoId, startTime] of session.videoStartTimes) {
      const watchTimeMs = Date.now() - startTime;
      const seconds = Math.floor(watchTimeMs / 1000);
      if (seconds > 0) {
        const storage = StorageManager.getInstance();
        await storage.updateWatchTime(seconds, session.isIntentional);
      }
    }
    
    this.sessions.delete(tabId);
  }

  async updateIntentStatus(tabId, isIntentional) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    // If a video is playing, first save current accumulated time under the old status
    for (const [videoId, startTime] of session.videoStartTimes) {
      const watchTimeMs = Date.now() - startTime;
      const seconds = Math.floor(watchTimeMs / 1000);
      if (seconds > 0) {
        const storage = StorageManager.getInstance();
        await storage.updateWatchTime(seconds, session.isIntentional);
      }
      // Reset video start time to now so that subsequent watch time is recorded under new status
      session.videoStartTimes.set(videoId, Date.now());
    }

    session.isIntentional = isIntentional;
  }

  updateLastActivity(tabId) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }
}

// Initialize usage tracker when background script loads  
const usageTracker = UsageTracker.getInstance();