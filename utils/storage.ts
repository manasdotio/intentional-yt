/**
 * Storage utilities for YouTube Focus Guard
 * Handles settings, usage tracking, and persistence
 */

interface ExtensionSettings {
  extensionEnabled?: boolean;
  nightLock: {
    enabled: boolean;
    startTime: string; // "23:30"
    endTime: string;   // "06:00"
  };
  entertainment: {
    dailyLimit: number; // minutes
    todayUsed: number;  
    lastResetDate: string;
  };
  research: {
    mode: 'research' | 'entertainment' | null;
    currentTopic: string[];
    sessionStart: number;
    allowedChannels: string[];
  };
  browsingMode: {
    active: boolean;
    startTime: number;
    duration: number;
    extensionsUsed: number;
    cooldownUntil: number;
  };
  watchTimer: {
    enabled: boolean;
    reminderIntervals: number[]; // [25, 15, 10, 5] minutes
    currentInterval: number;
    sessionStart: number;
    currentWatchTime?: number;
    totalToday: number;
  };
  stats: {
    todayWatchTime: number;
    todayResearchTime: number; 
    todayEntertainmentTime: number;
    lastStatsReset: string;
  };
}

class StorageManager {
  private static instance: StorageManager;
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getDefaultSettings(): ExtensionSettings {
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

  private mergeSettings<T extends Record<string, any>>(baseSettings: T, patchSettings: Partial<T>): T {
    const merged = { ...baseSettings } as T;

    Object.keys(patchSettings || {}).forEach((key) => {
      const typedKey = key as keyof T;
      const patchValue = patchSettings[typedKey];
      const baseValue = merged[typedKey];

      if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue) &&
          baseValue && typeof baseValue === 'object' && !Array.isArray(baseValue)) {
        merged[typedKey] = { ...(baseValue as object), ...(patchValue as object) } as T[keyof T];
      } else if (patchValue !== undefined) {
        merged[typedKey] = patchValue as T[keyof T];
      }
    });

    return merged;
  }

  async getSettings(): Promise<ExtensionSettings> {
    const defaultSettings = this.getDefaultSettings();

    try {
      const stored = await browser.storage.local.get('settings');
      if (stored.settings) {
        return this.mergeSettings(defaultSettings, stored.settings as Partial<ExtensionSettings>);
      }

      await browser.storage.local.set({ settings: defaultSettings });
      return defaultSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      const stored = await browser.storage.local.get('settings');
      const current = this.mergeSettings(this.getDefaultSettings(), (stored.settings || {}) as Partial<ExtensionSettings>);
      const updated = this.mergeSettings(current, settings);
      await browser.storage.local.set({ settings: updated });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async updateResearchSettings(settingsPatch: Partial<ExtensionSettings['research']>): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({
      research: {
        mode: settingsPatch.mode === undefined ? settings.research.mode : settingsPatch.mode,
        currentTopic: Array.isArray(settingsPatch.currentTopic) ? settingsPatch.currentTopic : settings.research.currentTopic,
        sessionStart: typeof settingsPatch.sessionStart === 'number' ? settingsPatch.sessionStart : settings.research.sessionStart,
        allowedChannels: Array.isArray(settingsPatch.allowedChannels) ? settingsPatch.allowedChannels : settings.research.allowedChannels,
      }
    });
  }

  async updateWatchTime(seconds: number, mode: 'research' | 'entertainment'): Promise<void> {
    const settings = await this.getSettings();
    const today = new Date().toDateString();
    
    // Reset daily stats if new day
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

  async resetDailyLimits(): Promise<void> {
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

  async updateBrowsingMode(settingsPatch: Partial<ExtensionSettings['browsingMode']>): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({
      browsingMode: {
        active: typeof settingsPatch.active === 'boolean' ? settingsPatch.active : settings.browsingMode.active,
        startTime: typeof settingsPatch.startTime === 'number' ? settingsPatch.startTime : settings.browsingMode.startTime,
        duration: typeof settingsPatch.duration === 'number' ? settingsPatch.duration : settings.browsingMode.duration,
        extensionsUsed: typeof settingsPatch.extensionsUsed === 'number' ? settingsPatch.extensionsUsed : settings.browsingMode.extensionsUsed,
        cooldownUntil: typeof settingsPatch.cooldownUntil === 'number' ? settingsPatch.cooldownUntil : settings.browsingMode.cooldownUntil,
      }
    });
  }

  async isBlocked(reason: string): Promise<boolean> {
    try {
      const blocked = await browser.storage.local.get('currentlyBlocked');
      return blocked.currentlyBlocked === reason;
    } catch {
      return false;
    }
  }

  async setBlocked(reason: string | null): Promise<void> {
    if (reason) {
      await browser.storage.local.set({ currentlyBlocked: reason });
    } else {
      await browser.storage.local.remove('currentlyBlocked');
    }
  }
}

// Export for global access
(window as any).StorageManager = StorageManager;