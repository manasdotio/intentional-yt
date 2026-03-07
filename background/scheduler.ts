/**
 * Scheduler for YouTube Focus Guard
 * Handles night lock checks, daily resets, and timed events
 */

class Scheduler {
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
    this.scheduleNightlockChecks();
    this.scheduleDailyReset();
  }

  private setupEventHandlers(): void {
    // Handle tab activation/creation for night lock check
    browser.tabs.onActivated?.addListener(this.checkActiveTab.bind(this));
    browser.tabs.onUpdated?.addListener(this.checkTabUpdate.bind(this));
    
    // Handle alarm events
    browser.alarms?.onAlarm?.addListener(this.handleAlarm.bind(this));
  }

  private async checkActiveTab(activeInfo: { tabId: number }): Promise<void> {
    await this.checkNightLock(activeInfo.tabId);
    await this.checkBrowsingCooldown(activeInfo.tabId);
  }

  private async checkTabUpdate(
    tabId: number, 
    changeInfo: { url?: string }, 
    tab: browser.tabs.Tab
  ): Promise<void> {
    if (changeInfo.url && this.isYouTubeUrl(changeInfo.url)) {
      await this.checkNightLock(tabId);
      if (await this.checkBrowsingCooldown(tabId)) {
        return;
      }
      await this.checkEntertainmentLimit(tabId);
      await this.checkShortsBlock(tabId, changeInfo.url);
    }
  }

  private async checkNightLock(tabId: number): Promise<void> {
    if (!StorageManager || !TimeUtils) return;
    
    const storage = StorageManager.getInstance();
    const timeUtils = TimeUtils.getInstance();
    const settings = await storage.getSettings();
    
    if (!settings.nightLock.enabled) return;

    const tab = await browser.tabs.get(tabId);
    if (!this.isYouTubeUrl(tab.url || '')) return;

    const isLockTime = timeUtils.isNightLockActive(
      settings.nightLock.startTime,
      settings.nightLock.endTime
    );

    if (isLockTime) {
      await storage.setBlocked('nightlock');
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('ui/blocked.html?reason=nightlock')
      });
    }
  }

  private async checkEntertainmentLimit(tabId: number): Promise<void> {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();
    
    const today = new Date().toDateString();
    if (settings.entertainment.lastResetDate !== today) {
      await storage.resetDailyLimits();
      return;
    }

    if (settings.research.mode !== 'research' && 
        settings.entertainment.todayUsed >= settings.entertainment.dailyLimit) {
      await storage.setBlocked('entertainment-limit');
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('ui/blocked.html?reason=entertainment-limit')
      });
    }
  }

  private async checkBrowsingCooldown(tabId: number): Promise<boolean> {
    const storage = StorageManager.getInstance();
    const settings = await storage.getSettings();

    if (!settings.browsingMode.cooldownUntil) {
      return false;
    }

    const now = Date.now();
    if (settings.browsingMode.cooldownUntil <= now) {
      await storage.updateBrowsingMode({ cooldownUntil: 0 });
      await storage.setBlocked(null);
      return false;
    }

    try {
      const tab = await browser.tabs.get(tabId);
      if (!this.isYouTubeUrl(tab.url || '')) return false;

      await storage.setBlocked('browsing-cooldown');
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('ui/blocked.html?reason=browsing-cooldown')
      });
      return true;
    } catch {
      return false;
    }
  }

  private async checkShortsBlock(tabId: number, url: string): Promise<void> {
    if (url.includes('/shorts/')) {
      const storage = StorageManager.getInstance();
      await storage.setBlocked('shorts');
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('ui/blocked.html?reason=shorts')
      });
    }
  }

  private scheduleNightlockChecks(): void {
    // Check every 5 minutes for night lock
    browser.alarms?.create('nightlock-check', { 
      periodInMinutes: 5 
    });
    
    this.alarmHandlers.set('nightlock-check', async () => {
      const tabs = await browser.tabs.query({ 
        url: ['*://www.youtube.com/*', '*://youtube.com/*'] 
      });
      
      for (const tab of tabs) {
        if (tab.id) {
          await this.checkNightLock(tab.id);
          await this.checkBrowsingCooldown(tab.id);
        }
      }
    });
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
      await storage.resetDailyLimits();
    });
  }

  private handleAlarm(alarm: browser.alarms.Alarm): void {
    const handler = this.alarmHandlers.get(alarm.name);
    if (handler) {
      handler();
    }
  }

  private isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  // Public method to trigger immediate checks
  async performImmediateChecks(): Promise<void> {
    const tabs = await browser.tabs.query({
      url: ['*://www.youtube.com/*', '*://youtube.com/*']
    });
    
    for (const tab of tabs) {
      if (tab.id) {
        await this.checkNightLock(tab.id);
        if (await this.checkBrowsingCooldown(tab.id)) {
          continue;
        }
        await this.checkEntertainmentLimit(tab.id);
        if (tab.url && tab.url.includes('/shorts/')) {
          await this.checkShortsBlock(tab.id, tab.url);
        }
      }
    }
  }
}

// Initialize scheduler when background script loads
const scheduler = Scheduler.getInstance();