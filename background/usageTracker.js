/**
 * Usage Tracker for YouTube Focus Guard (JS version)
 * Tracks watch time, research vs entertainment sessions, and statistics
 */

class UsageTracker {
  constructor() {
    this.sessions = new Map();
    this.intervalId = null;
    this.setupMessageHandling();
  }

  static getInstance() {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  static get periodicCheckIntervalMs() {
    return 30000;
  }

  setupMessageHandling() {
    if (browser.tabs && browser.tabs.onRemoved) {
      browser.tabs.onRemoved.addListener((tabId) => {
        void this.endSession(tabId);
      });
    }

    if (browser.runtime.onMessage) {
      browser.runtime.onMessage.addListener((message, sender) => {
        if (message && message.type === 'get-session-stats') {
          return Promise.resolve(this.getSerializableSessionStats(message.data && message.data.tabId));
        }

        if (sender.tab && sender.tab.id) {
          void this.handleContentMessage(message, sender.tab.id);
        }

        return false;
      });
    }
  }

  async handleContentMessage(message, tabId) {
    const { type, data } = message;
    
    switch (type) {
      case 'session-start':
        await this.startSession(tabId, data.mode);
        break;
        
      case 'video-started':
        await this.trackVideoStart(tabId, data.videoId);
        break;
        
      case 'video-paused':
        await this.trackVideoPause(tabId, data.videoId);
        break;
        
      case 'video-resumed':
        await this.trackVideoResume(tabId, data.videoId);
        break;
        
      case 'video-ended':
        await this.trackVideoEnd(tabId, data.videoId);
        break;
        
      case 'page-unload':
        await this.endSession(tabId);
        break;
        
      case 'mode-change':
        await this.updateSessionMode(tabId, data.mode);
        break;
        
      case 'activity':
        this.updateLastActivity(tabId);
        break;
    }
  }

  async startSession(tabId, mode) {
    const existingSession = this.sessions.get(tabId);
    const now = Date.now();
    const storage = window.StorageManager.getInstance();
    const settings = await storage.getSettings();
    const storedWatchTimeSeconds = settings.watchTimer.currentWatchTime || 0;
    const storedSessionStart = settings.watchTimer.sessionStart || 0;
    const canRestoreStoredSession = !existingSession && storedSessionStart > 0 && (now - storedSessionStart) <= (2 * 60 * 60 * 1000);
    const session = existingSession || {
      startTime: canRestoreStoredSession ? storedSessionStart : now,
      mode: mode,
      videoStartTimes: new Map(),
      totalWatchTime: canRestoreStoredSession ? storedWatchTimeSeconds * 1000 : 0,
      pausedTime: 0,
      lastActivity: now
    };

    session.mode = mode;
    session.lastActivity = now;
    
    this.sessions.set(tabId, session);
    this.ensureTrackingState();
    
    await storage.saveSettings({
      research: {
        mode: mode,
        currentTopic: mode === 'research' ? settings.research.currentTopic : [],
        sessionStart: session.startTime
      },
      watchTimer: {
        enabled: true,
        reminderIntervals: settings.watchTimer.reminderIntervals || [25, 15, 10, 5],
        currentInterval: settings.watchTimer.currentInterval || 0,
        sessionStart: existingSession ? (settings.watchTimer.sessionStart || session.startTime) : session.startTime,
        currentWatchTime: this.getCurrentWatchTimeSeconds(session, now),
        totalToday: 0
      }
    });
  }

  async trackVideoStart(tabId, videoId) {
    const session = this.sessions.get(tabId);
    if (!session) return;

    if (!videoId) return;
    if (session.videoStartTimes.has(videoId)) {
      session.lastActivity = Date.now();
      return;
    }
    
    session.videoStartTimes.set(videoId, Date.now());
    session.lastActivity = Date.now();
  }

  async trackVideoPause(tabId, videoId) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    const startTime = session.videoStartTimes.get(videoId);
    if (startTime) {
      const watchTime = Date.now() - startTime;
      session.totalWatchTime += watchTime;
      session.videoStartTimes.delete(videoId);
      
      await this.saveWatchTime(session, Math.floor(watchTime / 1000));
    }
    
    session.lastActivity = Date.now();
  }

  async trackVideoResume(tabId, videoId) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    if (!videoId) return;
    
    session.videoStartTimes.set(videoId, Date.now());
    session.lastActivity = Date.now();
  }

  async trackVideoEnd(tabId, videoId) {
    await this.trackVideoPause(tabId, videoId);
  }

  async endSession(tabId) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    for (const [videoId, startTime] of session.videoStartTimes) {
      const watchTime = Date.now() - startTime;
      session.totalWatchTime += watchTime;
      await this.saveWatchTime(session, Math.floor(watchTime / 1000));
    }
    
    this.sessions.delete(tabId);
    this.ensureTrackingState();
  }

  async updateSessionMode(tabId, mode) {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    session.mode = mode;
    
    const storage = window.StorageManager.getInstance();
    const settings = await storage.getSettings();
    await storage.saveSettings({
      research: {
        mode: mode,
        currentTopic: mode === 'research' ? settings.research.currentTopic : [],
        sessionStart: session.startTime
      }
    });
  }

  updateLastActivity(tabId) {
    const session = this.sessions.get(tabId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  async saveWatchTime(session, seconds) {
    if (seconds <= 0) return;
    
    const storage = window.StorageManager.getInstance();
    const mode = session.mode || 'entertainment';
    await storage.updateWatchTime(seconds, mode);
  }

  startTracking() {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      void this.performPeriodicChecks();
    }, UsageTracker.periodicCheckIntervalMs);
  }

  ensureTrackingState() {
    if (this.sessions.size > 0) {
      this.startTracking();
      return;
    }

    this.stopTracking();
  }

  async performPeriodicChecks() {
    if (this.sessions.size === 0) {
      this.stopTracking();
      return;
    }

    const storage = window.StorageManager.getInstance();
    const settings = await storage.getSettings();
    const now = Date.now();
    
    for (const [tabId, session] of this.sessions) {
      const isPlaying = session.videoStartTimes.size > 0;

      if (isPlaying) {
        session.lastActivity = now;
      }

      if (!isPlaying && now - session.lastActivity > 1800000) {
        await this.endSession(tabId);
        continue;
      }
      
      // Check entertainment limit
      if (session.mode === 'entertainment' && 
          settings.entertainment.todayUsed >= settings.entertainment.dailyLimit) {
        
        try {
          await browser.tabs.update(tabId, {
            url: browser.runtime.getURL('ui/blocked.html?reason=entertainment-limit')
          });
        } catch (error) {
          await this.endSession(tabId);
        }
      }
      
    }
  }

  async getSessionStats(tabId) {
    return this.sessions.get(tabId) || null;
  }

  getSerializableSessionStats(tabId) {
    if (!tabId) {
      return null;
    }

    const session = this.sessions.get(tabId);
    if (!session) {
      return null;
    }

    return {
      mode: session.mode,
      currentWatchTimeSeconds: this.getCurrentWatchTimeSeconds(session),
      isPlaying: session.videoStartTimes.size > 0,
      lastActivity: session.lastActivity
    };
  }

  getCurrentWatchTimeSeconds(session, now = Date.now()) {
    return Math.max(0, Math.floor(this.getCurrentWatchTimeMs(session, now) / 1000));
  }

  getCurrentWatchTimeMs(session, now = Date.now()) {
    let totalWatchTime = session.totalWatchTime;

    for (const startTime of session.videoStartTimes.values()) {
      totalWatchTime += Math.max(0, now - startTime);
    }

    return totalWatchTime;
  }

  async getAllActiveSessions() {
    return new Map(this.sessions);
  }

  stopTracking() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Initialize usage tracker when background script loads  
const usageTracker = UsageTracker.getInstance();