/**
 * Scheduler for YouTube Focus Guard (JS version)
 * Handles night lock checks, daily resets, and timed events
 */

class Scheduler {
  static supportedHosts = new Set(['www.youtube.com', 'youtube.com']);

  constructor() {
    this.alarmHandlers = new Map();
    this.setupEventHandlers();
    this.scheduleNightlockChecks();
    this.scheduleDailyReset();
  }

  static getInstance() {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  setupEventHandlers() {
    if (browser.tabs.onActivated) {
      browser.tabs.onActivated.addListener((activeInfo) => {
        this.checkActiveTab(activeInfo);
      });
    }
    
    if (browser.tabs.onUpdated) {
      browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        this.checkTabUpdate(tabId, changeInfo, tab);
      });
    }
    
    if (browser.alarms.onAlarm) {
      browser.alarms.onAlarm.addListener((alarm) => {
        this.handleAlarm(alarm);
      });
    }
  }

  async checkActiveTab(activeInfo) {
    await this.checkNightLock(activeInfo.tabId);
    await this.checkBrowsingCooldown(activeInfo.tabId);
  }

  async checkTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.url && this.isYouTubeUrl(changeInfo.url)) {
      await this.checkNightLock(tabId);
      if (await this.checkBrowsingCooldown(tabId)) {
        return;
      }
      await this.checkEntertainmentLimit(tabId);
      await this.checkShortsBlock(tabId, changeInfo.url);
    }
  }

  async checkNightLock(tabId) {
    if (!window.StorageManager || !window.TimeUtils) return;
    
    const storage = window.StorageManager.getInstance();
    const timeUtils = window.TimeUtils.getInstance();
    const settings = await storage.getSettings();
    
    if (!settings.nightLock.enabled) return;

    try {
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
    } catch (error) {
      // Tab might not exist anymore
      console.log('Error checking night lock:', error);
    }
  }

  async checkEntertainmentLimit(tabId) {
    const storage = window.StorageManager.getInstance();
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

  async checkBrowsingCooldown(tabId) {
    const storage = window.StorageManager.getInstance();
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

  async checkShortsBlock(tabId, url) {
    if (url.includes('/shorts/')) {
      const storage = window.StorageManager.getInstance();
      await storage.setBlocked('shorts');
      await browser.tabs.update(tabId, {
        url: browser.runtime.getURL('ui/blocked.html?reason=shorts')
      });
    }
  }

  scheduleNightlockChecks() {
    if (browser.alarms) {
      browser.alarms.create('nightlock-check', { 
        periodInMinutes: 5 
      });
      
      this.alarmHandlers.set('nightlock-check', async () => {
        const tabs = await browser.tabs.query({ 
          url: ['*://www.youtube.com/*', '*://youtube.com/*'] 
        });
        
        for (const tab of tabs) {
          if (tab.id && tab.url && this.isYouTubeUrl(tab.url)) {
            await this.checkNightLock(tab.id);
            await this.checkBrowsingCooldown(tab.id);
          }
        }
      });
    }
  }

  scheduleDailyReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    if (browser.alarms) {
      browser.alarms.create('daily-reset', {
        when: Date.now() + msUntilMidnight,
        periodInMinutes: 24 * 60
      });
      
      this.alarmHandlers.set('daily-reset', async () => {
        const storage = window.StorageManager.getInstance();
        await storage.resetDailyLimits();
      });
    }
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

  async performImmediateChecks() {
    const tabs = await browser.tabs.query({
      url: ['*://www.youtube.com/*', '*://youtube.com/*']
    });
    
    for (const tab of tabs) {
      if (tab.id && tab.url && this.isYouTubeUrl(tab.url)) {
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