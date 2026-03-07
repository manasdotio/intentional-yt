/**
 * Storage utilities for YouTube Focus Guard (JS version)
 * Handles settings, usage tracking, and persistence
 */

// Chrome/Firefox API compatibility shim
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  window.browser = {
    storage: {
      local: {
        get: (keys) => new Promise((resolve, reject) => chrome.storage.local.get(keys, (result) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(result))),
        set: (items) => new Promise((resolve, reject) => chrome.storage.local.set(items, () => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve())),
        remove: (keys) => new Promise((resolve, reject) => chrome.storage.local.remove(keys, () => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve()))
      }
    },
    runtime: {
      getURL: (path) => chrome.runtime.getURL(path),
      sendMessage: (msg) => new Promise((resolve, reject) => chrome.runtime.sendMessage(msg, (response) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(response))),
      onMessage: chrome.runtime.onMessage,
      lastError: chrome.runtime.lastError
    },
    tabs: {
      create: (props) => new Promise((resolve, reject) => chrome.tabs.create(props, (tab) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(tab))),
      query: (query) => new Promise((resolve, reject) => chrome.tabs.query(query, (tabs) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(tabs))),
      get: (tabId) => new Promise((resolve, reject) => chrome.tabs.get(tabId, (tab) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(tab))),
      update: (tabId, props) => new Promise((resolve, reject) => chrome.tabs.update(tabId, props, (tab) => chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(tab))),
      onActivated: chrome.tabs.onActivated,
      onUpdated: chrome.tabs.onUpdated
    },
    alarms: chrome.alarms ? {
      create: (name, info) => chrome.alarms.create(name, info),
      onAlarm: chrome.alarms.onAlarm,
      clear: (name) => new Promise((resolve) => chrome.alarms.clear(name, resolve))
    } : null
  };
}

class StorageManager {
  static getInstance() {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  getDefaultSettings() {
    return {
      extensionEnabled: true,
      nightLock: {
        enabled: true,
        startTime: "23:30",
        endTime: "06:00"
      },
      entertainment: {
        dailyLimit: 60,
        todayUsed: 0,
        lastResetDate: new Date().toDateString()
      },
      research: {
        mode: null,
        currentTopic: [],
        sessionStart: 0,
        allowedChannels: []
      },
      browsingMode: {
        active: false,
        startTime: 0,
        duration: 15 * 60 * 1000,
        extensionsUsed: 0,
        cooldownUntil: 0
      },
      watchTimer: {
        enabled: true,
        reminderIntervals: [25, 15, 10, 5],
        currentInterval: 0,
        sessionStart: 0,
        currentWatchTime: 0,
        totalToday: 0
      },
      stats: {
        todayWatchTime: 0,
        todayResearchTime: 0,
        todayEntertainmentTime: 0,
        lastStatsReset: new Date().toDateString()
      }
    };
  }

  mergeSettings(baseSettings, patchSettings) {
    const merged = { ...baseSettings };

    Object.keys(patchSettings || {}).forEach((key) => {
      const patchValue = patchSettings[key];
      const baseValue = merged[key];

      if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue) &&
          baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        merged[key] = { ...baseValue, ...patchValue };
      } else {
        merged[key] = patchValue;
      }
    });

    return merged;
  }

  async getSettings() {
    const defaultSettings = this.getDefaultSettings();

    try {
      const stored = await browser.storage.local.get('settings');
      if (stored.settings) {
        return this.mergeSettings(defaultSettings, stored.settings);
      }

      await browser.storage.local.set({ settings: defaultSettings });
      return defaultSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings) {
    try {
      // Merge against raw storage and defaults without calling getSettings(),
      // otherwise first-run initialization can recurse back into saveSettings().
      const stored = await browser.storage.local.get('settings');
      const current = this.mergeSettings(this.getDefaultSettings(), stored.settings || {});
      const updated = this.mergeSettings(current, settings);
      await browser.storage.local.set({ settings: updated });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async updateResearchSettings(researchSettings) {
    const settings = await this.getSettings();
    await this.saveSettings({
      research: {
        mode: typeof researchSettings.mode === 'string' || researchSettings.mode === null ? researchSettings.mode : settings.research.mode,
        currentTopic: Array.isArray(researchSettings.currentTopic) ? researchSettings.currentTopic : settings.research.currentTopic,
        sessionStart: typeof researchSettings.sessionStart === 'number' ? researchSettings.sessionStart : settings.research.sessionStart,
        allowedChannels: Array.isArray(researchSettings.allowedChannels) ? researchSettings.allowedChannels : settings.research.allowedChannels,
      }
    });
  }

  async updateWatchTime(seconds, mode) {
    const settings = await this.getSettings();
    const today = new Date().toDateString();
    
    if (settings.stats.lastStatsReset !== today) {
      settings.stats.todayWatchTime = 0;
      settings.stats.todayResearchTime = 0;
      settings.stats.todayEntertainmentTime = 0;
      settings.stats.lastStatsReset = today;
      settings.entertainment.todayUsed = 0;
      settings.entertainment.lastResetDate = today;
    }

    settings.stats.todayWatchTime += seconds;
    if (mode === 'research') {
      settings.stats.todayResearchTime += seconds;
    } else {
      settings.stats.todayEntertainmentTime += seconds;
      settings.entertainment.todayUsed += Math.round(seconds / 60);
    }

    await this.saveSettings(settings);
  }

  async resetDailyLimits() {
    const today = new Date().toDateString();
    await this.saveSettings({
      entertainment: {
        dailyLimit: 60,
        todayUsed: 0,
        lastResetDate: today
      },
      stats: {
        todayWatchTime: 0,
        todayResearchTime: 0,
        todayEntertainmentTime: 0,
        lastStatsReset: today
      }
    });
  }

  async updateBrowsingMode(browsingMode) {
    const settings = await this.getSettings();
    await this.saveSettings({
      browsingMode: {
        active: typeof browsingMode.active === 'boolean' ? browsingMode.active : settings.browsingMode.active,
        startTime: typeof browsingMode.startTime === 'number' ? browsingMode.startTime : settings.browsingMode.startTime,
        duration: typeof browsingMode.duration === 'number' ? browsingMode.duration : settings.browsingMode.duration,
        extensionsUsed: typeof browsingMode.extensionsUsed === 'number' ? browsingMode.extensionsUsed : settings.browsingMode.extensionsUsed,
        cooldownUntil: typeof browsingMode.cooldownUntil === 'number' ? browsingMode.cooldownUntil : settings.browsingMode.cooldownUntil,
      }
    });
  }

  async isBlocked(reason) {
    try {
      const blocked = await browser.storage.local.get('currentlyBlocked');
      return blocked.currentlyBlocked === reason;
    } catch {
      return false;
    }
  }

  async setBlocked(reason) {
    if (reason) {
      await browser.storage.local.set({ currentlyBlocked: reason });
    } else {
      await browser.storage.local.remove('currentlyBlocked');
    }
  }
}

// Export for global access
window.StorageManager = StorageManager;