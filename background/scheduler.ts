/**
 * Scheduler for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Handles daily reset alarms and background Shorts page intercepts.
 */

class Scheduler {
  private static readonly supportedHosts = new Set(['www.youtube.com', 'youtube.com']);
  private static instance: Scheduler;
  private alarmHandlers: Map<string, () => void> = new Map();
  
  static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  constructor() {
    this.setupEventHandlers();
    this.scheduleDailyReset();
  }

  private setupEventHandlers(): void {
    browser.tabs.onUpdated?.addListener(this.checkTabUpdate.bind(this));
    browser.alarms?.onAlarm?.addListener(this.handleAlarm.bind(this));
  }

  private async checkTabUpdate(
    tabId: number, 
    changeInfo: { url?: string }
  ): Promise<void> {
    if (changeInfo.url && this.isYouTubeUrl(changeInfo.url)) {
      await this.checkShortsBlock(tabId, changeInfo.url);
    }
  }

  private async checkShortsBlock(tabId: number, url: string): Promise<void> {
    if (url.includes('/shorts/')) {
      const storage = StorageManager.getInstance();
      const settings = await storage.getSettings();
      
      if (settings.shortsBlocked) {
        // Redirect the tab from Shorts to standard YouTube home
        await browser.tabs.update(tabId, {
          url: 'https://www.youtube.com/'
        });
      }
    }
  }

  private scheduleDailyReset(): void {
    // Schedule daily reset at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    browser.alarms?.create('daily-reset', {
      when: Date.now() + msUntilMidnight,
      periodInMinutes: 24 * 60 // Repeat daily
    });
    
    this.alarmHandlers.set('daily-reset', async () => {
      const storage = StorageManager.getInstance();
      await storage.resetDailyStats();
    });
  }

  private handleAlarm(alarm: browser.alarms.Alarm): void {
    const handler = this.alarmHandlers.get(alarm.name);
    if (handler) {
      handler();
    }
  }

  private isYouTubeUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.toLowerCase();
      return Scheduler.supportedHosts.has(hostname) || hostname === 'youtu.be';
    } catch {
      return false;
    }
  }
}

// Initialize scheduler when background script loads
const scheduler = Scheduler.getInstance();