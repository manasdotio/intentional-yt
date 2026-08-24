// Polyfill browser to chrome for Chromium-based browsers
if (typeof browser === 'undefined' && typeof chrome !== 'undefined') {
  globalThis.browser = chrome;
}

class StorageManager {
  /**
   * Get the default settings schema.
   */
  static getDefaultSettings() {
    return {
      extensionEnabled: true,
      blockRecommendations: true,
      blockAutoplay: true,
      blockShorts: true,
      hideComments: false,
      hideThumbnails: false,
      grayscaleMode: false,
      softReminder: {
        enabled: false,
        intervalMinutes: 60
      },
      watchLimit: {
        enabled: false,
        limitMinutes: 60
      },
      stats: {
        todayWatchSeconds: 0,
        limitDismissedToday: false,
        lastStatsReset: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      }
    };
  }

  /**
   * Fetch settings from local storage, merging with defaults and running day resets.
   */
  static async getSettings() {
    const defaults = StorageManager.getDefaultSettings();
    try {
      const stored = await browser.storage.local.get('settings');
      let current = stored.settings ? StorageManager.merge(defaults, stored.settings) : defaults;

      // Automatically reset daily stats if the date has changed
      const today = new Date().toISOString().split('T')[0];
      if (current.stats.lastStatsReset !== today) {
        current.stats.todayWatchSeconds = 0;
        current.stats.limitDismissedToday = false;
        current.stats.lastStatsReset = today;
        await browser.storage.local.set({ settings: current });
      }

      return current;
    } catch (error) {
      console.error('Failed to get settings:', error);
      return defaults;
    }
  }

  /**
   * Save settings back to local storage.
   */
  static async saveSettings(settings) {
    try {
      await browser.storage.local.set({ settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Increment active watch seconds.
   */
  static async incrementWatchSeconds(seconds) {
    try {
      const settings = await StorageManager.getSettings();
      settings.stats.todayWatchSeconds += seconds;
      await StorageManager.saveSettings(settings);
    } catch (error) {
      console.error('Failed to increment watch seconds:', error);
    }
  }

  /**
   * Helper function to deeply merge settings.
   */
  static merge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = StorageManager.merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
} else if (typeof globalThis !== 'undefined') {
  globalThis.StorageManager = StorageManager;
}