/**
 * StorageManager — Intentional YT v3
 */

'use strict';

class StorageManager {
  static getTodayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  static getDefaultSettings() {
    return {
      extensionEnabled: true,

      blockHomeFeed: true,
      blockSidebar: true,
      blockRecommended: true,
      blockLiveChat: true,
      blockPlaylist: false,
      blockEndScreenVideowall: true,
      blockEndScreenCards: true,
      blockComments: false,
      blockProfilePhotos: false,
      blockMixPlaylists: true,
      blockMerch: true,
      blockVideoInfo: false,
      blockVideoButtons: false,
      blockChannelInfo: false,
      blockVideoDescription: false,
      blockTopHeader: false,
      blockNotificationBell: true,
      blockIrrelevantSearchResults: true,
      blockExploreAndTrending: true,
      blockMoreFromYouTube: true,
      blockShorts: true,
      blockSubscriptionsFeed: false,
      disableAutoplay: true,
      disableAnnotations: true,

      hideThumbnails: false,
      grayscaleMode: false,

      softReminder: { enabled: false, intervalMinutes: 30 },
      dailyLimit:   { enabled: false, limitMinutes: 60 },

      stats: {
        todayWatchSeconds: 0,
        limitDismissedToday: false,
        lastStatsReset: StorageManager.getTodayString()
      }
    };
  }

  static _merge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] !== null && source[key] !== undefined &&
          typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = StorageManager._merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  static async getSettings() {
    const defaults = StorageManager.getDefaultSettings();
    try {
      const stored = await browser.storage.local.get('settings');
      let current = stored.settings
        ? StorageManager._merge(defaults, stored.settings)
        : defaults;
      const today = StorageManager.getTodayString();
      if (!current.stats || current.stats.lastStatsReset !== today) {
        current = await StorageManager.resetDailyStats(current);
      }
      return current;
    } catch (err) {
      console.error('[IYT] getSettings failed:', err);
      return defaults;
    }
  }

  static _writeQueue = Promise.resolve();
  static _enqueue(fn) {
    // Create a promise that resolves to fn's return value, chained off the queue.
    // We store the *chain* on _writeQueue (so the next _enqueue waits for this one),
    // but we return a *separate* promise that resolves to fn's actual return value
    // so callers like resetDailyStats can get the settings object back.
    const resultPromise = StorageManager._writeQueue.then(fn);
    // Append a silent error-catcher to the queue so one failure doesn't break future writes
    StorageManager._writeQueue = resultPromise.catch(err =>
      console.error('[IYT] write queue error:', err)
    );
    return resultPromise;
  }

  static updateSetting(key, value) {
    return StorageManager._enqueue(async () => {
      const stored = await browser.storage.local.get('settings');
      const settings = stored.settings
        ? StorageManager._merge(StorageManager.getDefaultSettings(), stored.settings)
        : StorageManager.getDefaultSettings();
      settings[key] = value;
      await browser.storage.local.set({ settings });
    });
  }

  static updateNestedSetting(parentKey, childKey, value) {
    return StorageManager._enqueue(async () => {
      const stored = await browser.storage.local.get('settings');
      const settings = stored.settings
        ? StorageManager._merge(StorageManager.getDefaultSettings(), stored.settings)
        : StorageManager.getDefaultSettings();
      if (typeof settings[parentKey] !== 'object' || settings[parentKey] === null) {
        settings[parentKey] = {};
      }
      settings[parentKey][childKey] = value;
      await browser.storage.local.set({ settings });
    });
  }

  static async resetDailyStats(currentSettings) {
    return StorageManager._enqueue(async () => {
      let settings;
      if (currentSettings) {
        settings = currentSettings;
      } else {
        const stored = await browser.storage.local.get('settings');
        settings = stored.settings
          ? StorageManager._merge(StorageManager.getDefaultSettings(), stored.settings)
          : StorageManager.getDefaultSettings();
      }
      if (!settings.stats) settings.stats = {};
      settings.stats.todayWatchSeconds = 0;
      settings.stats.limitDismissedToday = false;
      settings.stats.lastStatsReset = StorageManager.getTodayString();
      await browser.storage.local.set({ settings });
      return settings;
    });
  }
}

if (typeof globalThis !== 'undefined') {
  globalThis.StorageManager = StorageManager;
}
