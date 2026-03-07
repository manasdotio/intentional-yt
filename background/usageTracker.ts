/**
 * Usage Tracker for YouTube Focus Guard
 * Tracks watch time, research vs entertainment sessions, and statistics
 */

interface SessionData {
  startTime: number;
  mode: 'research' | 'entertainment' | null;
  videoStartTimes: Map<string, number>;
  totalWatchTime: number;
  pausedTime: number;
  lastActivity: number;
}

interface SessionStatsResponse {
  mode: 'research' | 'entertainment' | null;
  currentWatchTimeSeconds: number;
  isPlaying: boolean;
  lastActivity: number;
}

class UsageTracker {
  private static instance: UsageTracker;
  private static readonly periodicCheckIntervalMs = 30000;
  private sessions: Map<number, SessionData> = new Map();
  private intervalId: number | null = null;
  
  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  constructor() {
    this.setupMessageHandling();
  }

  private setupMessageHandling(): void {
    browser.tabs?.onRemoved?.addListener((tabId: number) => {
      void this.endSession(tabId);
    });

    browser.runtime.onMessage.addListener((message, sender) => {
      if (message?.type === 'get-session-stats') {
        return Promise.resolve(this.getSerializableSessionStats(message?.data?.tabId));
      }

      if (sender.tab?.id) {
        void this.handleContentMessage(message, sender.tab.id);
      }

      return false;
    });
  }

  private async handleContentMessage(message: any, tabId: number): Promise<void> {
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

  private async startSession(tabId: number, mode: 'research' | 'entertainment' | null): Promise<void> {
    const existingSession = this.sessions.get(tabId);
    const now = Date.now();
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    const storedWatchTimeSeconds = settings.watchTimer.currentWatchTime || 0;
    const storedSessionStart = settings.watchTimer.sessionStart || 0;
    const canRestoreStoredSession = !existingSession && storedSessionStart > 0 && (now - storedSessionStart) <= (2 * 60 * 60 * 1000);
    const session: SessionData = existingSession ?? {
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

  private async trackVideoStart(tabId: number, videoId: string): Promise<void> {
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

  private async trackVideoPause(tabId: number, videoId: string): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    const startTime = session.videoStartTimes.get(videoId);
    if (startTime) {
      const watchTime = Date.now() - startTime;
      session.totalWatchTime += watchTime;
      session.videoStartTimes.delete(videoId);
      
      // Update storage with watch time
      await this.saveWatchTime(session, Math.floor(watchTime / 1000));
    }
    
    session.lastActivity = Date.now();
  }

  private async trackVideoResume(tabId: number, videoId: string): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;
    if (!videoId) return;
    
    session.videoStartTimes.set(videoId, Date.now());
    session.lastActivity = Date.now();
  }

  private async trackVideoEnd(tabId: number, videoId: string): Promise<void> {
    await this.trackVideoPause(tabId, videoId);
  }

  private async endSession(tabId: number): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    // Track any remaining watch time
    for (const [videoId, startTime] of session.videoStartTimes) {
      const watchTime = Date.now() - startTime;
      session.totalWatchTime += watchTime;
      await this.saveWatchTime(session, Math.floor(watchTime / 1000));
    }
    
    // Clear session
    this.sessions.delete(tabId);
    this.ensureTrackingState();
  }

  private async updateSessionMode(tabId: number, mode: 'research' | 'entertainment'): Promise<void> {
    const session = this.sessions.get(tabId);
    if (!session) return;
    
    session.mode = mode;
    
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    await storage.saveSettings({
      research: {
        mode: mode,
        currentTopic: mode === 'research' ? settings.research.currentTopic : [],
        sessionStart: session.startTime
      }
    });
  }

  private updateLastActivity(tabId: number): void {
    const session = this.sessions.get(tabId);
    if (session) {
      session.lastActivity = Date.now();
    }
  }

  private async saveWatchTime(session: SessionData, seconds: number): Promise<void> {
    if (seconds <= 0) return;
    
    const storage = StorageManager.getInstance();
    const mode = session.mode || 'entertainment';
    await storage.updateWatchTime(seconds, mode);
  }

  private startTracking(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      void this.performPeriodicChecks();
    }, UsageTracker.periodicCheckIntervalMs) as any;
  }

  private ensureTrackingState(): void {
    if (this.sessions.size > 0) {
      this.startTracking();
      return;
    }

    this.stopTracking();
  }

  private async performPeriodicChecks(): Promise<void> {
    if (this.sessions.size === 0) {
      this.stopTracking();
      return;
    }

    const storage = StorageManager.getInstance();
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
          // Tab might not exist anymore
          await this.endSession(tabId);
        }
      }
      
    }
  }

  // Public methods for getting stats
  async getSessionStats(tabId: number): Promise<SessionData | null> {
    return this.sessions.get(tabId) || null;
  }

  private getSerializableSessionStats(tabId?: number): SessionStatsResponse | null {
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

  private getCurrentWatchTimeSeconds(session: SessionData, now: number = Date.now()): number {
    return Math.max(0, Math.floor(this.getCurrentWatchTimeMs(session, now) / 1000));
  }

  private getCurrentWatchTimeMs(session: SessionData, now: number = Date.now()): number {
    let totalWatchTime = session.totalWatchTime;

    for (const startTime of session.videoStartTimes.values()) {
      totalWatchTime += Math.max(0, now - startTime);
    }

    return totalWatchTime;
  }

  async getAllActiveSessions(): Promise<Map<number, SessionData>> {
    return new Map(this.sessions);
  }

  stopTracking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Initialize usage tracker when background script loads  
const usageTracker = UsageTracker.getInstance();