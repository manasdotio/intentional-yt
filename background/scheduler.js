/**
 * Scheduler for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Handles daily reset alarms and background Shorts page intercepts.
 */

class Scheduler {
  static supportedHosts = new Set(['www.youtube.com', 'youtube.com']);
  static instance;
  alarmHandlers = new Map();
  
  static getInstance() {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  constructor() {
    this.setupEventHandlers();
    this.scheduleDailyReset();
  }

  setupEventHandlers() {
    browser.tabs.onUpdated?.addListener(this.checkTabUpdate.bind(this));
    browser.alarms?.onAlarm?.addListener(this.handleAlarm.bind(this));
  }

  async checkTabUpdate(tabId, changeInfo) {
    if (changeInfo.url && this.isYouTubeUrl(changeInfo.url)) {
      await this.checkShortsBlock(tabId, changeInfo.url);
    }
  }

  async checkShortsBlock(tabId, url) {
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

  scheduleDailyReset() {
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

  handleAlarm(alarm) {
    const handler = this.alarmHandlers.get(alarm.name);
    if (handler) {
      handler();
    }
  }

  isYouTubeUrl(url) {
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