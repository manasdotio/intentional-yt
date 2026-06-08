/**
 * Storage utilities for YouTube Focus Guard (Intent-First Mindful Assistant)
 * Handles settings, intention tracking, and daily statistics.
 */

interface IntentionHistoryEntry {
  text: string;
  durationMinutes: number;
  date: string;
}

interface ExtensionSettings {
  extensionEnabled: boolean;
  activeIntention: string;
  intentionStartTime: number;
  intentionHistory: IntentionHistoryEntry[];
  breathingBreaks: {
    enabled: boolean;
    intervalMinutes: number; // e.g. 20
  };
  shortsBlocked: boolean;
  stats: {
    todayWatchTime: number;        // total seconds watched today
    todayIntentionalTime: number;  // seconds spent on matching intent today
    todayDriftTime: number;        // seconds spent on drift/bypassed videos today
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
      activeIntention: "",
      intentionStartTime: 0,
      intentionHistory: [],
      breathingBreaks: {
        enabled: true,
        intervalMinutes: 20
      },
      shortsBlocked: true,
      stats: {
        todayWatchTime: 0,
        todayIntentionalTime: 0,
        todayDriftTime: 0,
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
      let current: ExtensionSettings;
      if (stored.settings) {
        current = this.mergeSettings(defaultSettings, stored.settings as Partial<ExtensionSettings>);
      } else {
        current = defaultSettings;
      }

      // Automatically reset stats if it's a new day
      const today = new Date().toDateString();
      if (current.stats.lastStatsReset !== today) {
        current.stats.todayWatchTime = 0;
        current.stats.todayIntentionalTime = 0;
        current.stats.todayDriftTime = 0;
        current.stats.lastStatsReset = today;
        // Clean active intention on new day
        current.activeIntention = "";
        current.intentionStartTime = 0;
        await browser.storage.local.set({ settings: current });
      }

      return current;
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

  async setIntention(intentionText: string): Promise<void> {
    const trimmed = intentionText.trim();
    if (!trimmed) {
      await this.saveSettings({
        activeIntention: "",
        intentionStartTime: 0
      });
      return;
    }

    const now = Date.now();
    const settings = await this.getSettings();

    // If there was an old intention, save it to history before overwriting
    if (settings.activeIntention && settings.intentionStartTime > 0) {
      const durationMin = Math.round((now - settings.intentionStartTime) / 60000);
      if (durationMin > 0) {
        await this.addIntentionToHistory(settings.activeIntention, durationMin);
      }
    }

    await this.saveSettings({
      activeIntention: trimmed,
      intentionStartTime: now
    });
  }

  async addIntentionToHistory(text: string, durationMinutes: number): Promise<void> {
    if (!text) return;
    const settings = await this.getSettings();
    const history = Array.isArray(settings.intentionHistory) ? settings.intentionHistory : [];
    
    // Check if intention exists for today; if so, update duration, otherwise prepend new one
    const today = new Date().toDateString();
    const existingIndex = history.findIndex(h => h.text.toLowerCase() === text.toLowerCase() && h.date === today);
    
    if (existingIndex > -1) {
      history[existingIndex].durationMinutes += durationMinutes;
    } else {
      history.unshift({
        text,
        durationMinutes,
        date: today
      });
    }

    // Cap history length to 50 entries
    const cappedHistory = history.slice(0, 50);
    await this.saveSettings({
      intentionHistory: cappedHistory
    });
  }

  async updateWatchTime(seconds: number, isIntentional: boolean): Promise<void> {
    const settings = await this.getSettings();
    
    settings.stats.todayWatchTime += seconds;
    if (isIntentional) {
      settings.stats.todayIntentionalTime += seconds;
    } else {
      settings.stats.todayDriftTime += seconds;
    }

    await this.saveSettings({ stats: settings.stats });
  }

  async resetDailyStats(): Promise<void> {
    const today = new Date().toDateString();
    await this.saveSettings({
      activeIntention: "",
      intentionStartTime: 0,
      intentionHistory: [],
      stats: {
        todayWatchTime: 0,
        todayIntentionalTime: 0,
        todayDriftTime: 0,
        lastStatsReset: today
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