/**
 * StorageManager — Intentional YT v3
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;
if (typeof globalThis !== 'undefined' && !globalThis.browser && globalThis.chrome) {
  globalThis.browser = globalThis.chrome;
}


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
      snoozeUntil: null,
      focusSessionUntil: null,
      userLanguage: 'auto',
      themeMode: 'auto',

      blockHomeFeed: true,
      limitHomeFeed: false,
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
      redirectShorts: true,
      blockSubscriptionsFeed: false,
      disableAutoplay: true,
      disableAnnotations: true,

      hideThumbnails: false,
      grayscaleMode: false,

      channelBlocklist: [],
      keywordBlocklist: [],
      enableQuickBlock: true,

      softReminder: { enabled: false, intervalMinutes: 30 },
      dailyLimit:   { enabled: false, limitMinutes: 60, warningEnabled: true },

      focusLock: {
        enabled: false,
        pin: null,
        cooldownMinutes: 10,
        lockedSettings: [],
        pendingUnlock: null
      },

      scheduledBlocking: {
        enabled: false,
        schedules: []
      },

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
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      if (source[key] !== null && source[key] !== undefined &&
          typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = StorageManager._merge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  static _background = false;
  static _writeQueue = Promise.resolve();
  static onProtectedChange = null;
  static _enqueue(fn) {
    const result = this._writeQueue.then(fn);
    this._writeQueue = result.catch(() => {});
    return result;
  }
  static async _request(command) {
    if (this._background) return this.execute(command);
    const response = await browser.runtime.sendMessage({ type: 'IYT_STORAGE', command });
    if (!response?.ok) {
      if (response?.code === 'LOCKED' && this.onProtectedChange) return this.onProtectedChange(command);
      const error = new Error(response?.error || 'Extension background unavailable. Reload the page.');
      error.code = response?.code;
      throw error;
    }
    return response.settings;
  }
  static getSettings() { return this._request({ op: 'read' }); }
  static updateSetting(key, value) { return this.updateSettings({ [key]: value }); }
  static updateSettings(updates) { return this._request({ op: 'update', updates }); }
  static updateNestedSetting(parentKey, childKey, value) {
    if (parentKey === 'focusLock' && childKey === 'pendingUnlock' && value === null) return this._request({ op: 'cancelUnlock' });
    return this._request({ op: 'nested', parentKey, childKey, value });
  }
  static resetDailyStats() { return this._request({ op: 'resetStats' }); }
  static resetToDefaults() { return this._request({ op: 'reset' }); }
  static importSettings(settings) {
    if (settings && Object.hasOwn(settings, 'schemaVersion')) {
      if (settings.schemaVersion !== 1 || Object.keys(settings).some(k => !['schemaVersion','settings'].includes(k))) throw new Error('Unsupported backup version');
      settings = settings.settings;
    }
    return this._request({ op: 'import', settings: IYT_validate(settings, true) });
  }
  static snooze(minutes) { return this._request({ op: 'snooze', minutes }); }
  static startFocusSession(minutes) { return this._request({ op: 'focusStart', minutes }); }
  static async endFocusSession() {
    const settings = await this.getSettings();
    return this._request({ op: 'focusEnd', until: settings.focusSessionUntil });
  }
  static claimLimitWarning() { return this._request({ op: 'claimLimitWarning' }); }
  static changeList(key, value, remove = false) { return this._request({ op: 'list', key, value, remove }); }
  static saveSchedule(schedule) { return this._request({ op: 'scheduleSave', schedule }); }
  static deleteSchedule(id) { return this._request({ op: 'scheduleDelete', id }); }
  static setScheduleEnabled(id, enabled) { return this._request({ op: 'scheduleToggle', id, enabled }); }
  static recordWatch(seconds, batchId, day) { return this._request({ op: 'watch', seconds, batchId, day }); }
  static queueUnlock(command, pin) { return this._request({ op: 'queueUnlock', command, pin }); }

  static _mutate(current, command) {
    const next = this._merge({}, current);
    switch (command.op) {
      case 'update':
        if (!command.updates || typeof command.updates !== 'object' || Array.isArray(command.updates)) throw new Error('Invalid update');
        for (const [key, value] of Object.entries(command.updates)) {
          if (['stats','__proto__','prototype','constructor'].includes(key)) throw new Error('Invalid update key');
          next[key] = value;
        }
        break;
      case 'nested':
        if (!['dailyLimit','softReminder','focusLock','scheduledBlocking','stats'].includes(command.parentKey) || ['pendingUnlock','__proto__','prototype','constructor'].includes(command.childKey)) throw new Error('Invalid nested update');
        if (command.parentKey === 'stats' && command.childKey !== 'limitDismissedToday') throw new Error('Invalid stats update');
        next[command.parentKey] = { ...next[command.parentKey], [command.childKey]: command.value }; break;
      case 'list':
        if (!['channelBlocklist','keywordBlocklist'].includes(command.key) || typeof command.value !== 'string') throw new Error('Invalid list update');
        next[command.key] = command.remove ? next[command.key].filter(x => x !== command.value) : [...new Set([...next[command.key], command.value])]; break;
      case 'resetStats': next.stats = this.getDefaultSettings().stats; break;
      case 'scheduleSave': {
        const list = next.scheduledBlocking.schedules;
        const index = list.findIndex(s => s.id === command.schedule?.id);
        next.scheduledBlocking.schedules = index < 0 ? [...list, command.schedule] : list.map((s, i) => i === index ? command.schedule : s);
        break;
      }
      case 'scheduleDelete': next.scheduledBlocking.schedules = next.scheduledBlocking.schedules.filter(s => s.id !== command.id); break;
      case 'scheduleToggle': next.scheduledBlocking.schedules = next.scheduledBlocking.schedules.map(s => s.id === command.id ? { ...s, enabled: command.enabled } : s); break;
      case 'snooze':
        if (!Number.isInteger(command.minutes) || command.minutes < 1 || command.minutes > 1440) throw new Error('Invalid snooze duration');
        next.snoozeUntil = Date.now() + command.minutes * 60000; break;
      case 'focusStart':
        if (![25, 45, 60].includes(command.minutes)) throw new Error('Invalid focus duration');
        if (current.focusSessionUntil > Date.now()) throw new Error('A focus session is already running');
        next.focusSessionUntil = Date.now() + command.minutes * 60000;
        next.extensionEnabled = true;
        next.snoozeUntil = null;
        break;
      case 'focusEnd':
        if (command.until === current.focusSessionUntil) next.focusSessionUntil = null;
        break;
      case 'reset': return this.getDefaultSettings();
      case 'import': return IYT_validate(command.settings, true);
      default: throw new Error('Unknown settings command');
    }
    const validated = IYT_validate(next);
    validated.focusLock.pendingUnlock = current.focusLock.pendingUnlock;
    return validated;
  }

  static execute(command) {
    return this._enqueue(async () => {
      const stored = await browser.storage.local.get(['settings','usage']);
      let settings;
      try { settings = IYT_validate(stored.settings || {}); }
      catch (error) {
        await browser.storage.local.set({ settingsRecovery: stored.settings });
        settings = this.getDefaultSettings();
      }
      const pending = stored.settings?.focusLock?.pendingUnlock;
      if (pending?.command && Number.isFinite(pending.unlocksAt)) settings.focusLock.pendingUnlock = pending;
      if (stored.usage?.stats) settings.stats = stored.usage.stats;
      const today = this.getTodayString();
      let batches = stored.usage?.batches || [];
      let warningKey = stored.usage?.warningKey || null;
      if (settings.stats.lastStatsReset !== today) { settings.stats = this.getDefaultSettings().stats; batches = []; }
      if (settings.snoozeUntil && settings.snoozeUntil <= Date.now()) settings.snoozeUntil = null;
      if (settings.focusSessionUntil && settings.focusSessionUntil <= Date.now()) settings.focusSessionUntil = null;
      if (settings.focusLock.pendingUnlock?.unlocksAt <= Date.now()) {
        const queued = settings.focusLock.pendingUnlock.command;
        settings.focusLock.pendingUnlock = null;
        settings = this._mutate(settings, queued);
      }
      const commit = async () => {
        const preferences = { ...settings }; delete preferences.stats;
        const usage = { stats: settings.stats, batches, warningKey };
        const updates = {};
        if (JSON.stringify(preferences) !== JSON.stringify(stored.settings)) updates.settings = preferences;
        if (JSON.stringify(usage) !== JSON.stringify(stored.usage)) updates.usage = usage;
        if (Object.keys(updates).length) await browser.storage.local.set(updates);
        return settings;
      };
      if (command.op === 'read' || command.op === 'reconcile') return commit();
      if (command.op === 'claimLimitWarning') {
        const key = `${today}:${settings.dailyLimit.limitMinutes}`;
        const minutes = IYT_Policy.limitWarning(settings);
        const claimed = minutes > 0 && warningKey !== key;
        if (claimed) warningKey = key;
        await commit();
        return { claimed, minutes };
      }
      if (command.op === 'watch') {
        if (!Number.isFinite(command.seconds) || command.seconds <= 0 || command.seconds > 3600 || typeof command.batchId !== 'string' || command.batchId.length > 100) throw new Error('Invalid watch batch');
        if (command.day === today && !batches.includes(command.batchId)) {
          settings.stats.todayWatchSeconds += command.seconds;
          batches = [...batches.slice(-999), command.batchId];
        }
        return commit();
      }
      if (command.op === 'cancelUnlock') { settings.focusLock.pendingUnlock = null; return commit(); }
      if (command.op === 'queueUnlock') {
        if (!settings.focusLock.enabled || !settings.focusLock.pin) throw new Error('Focus Lock is not active');
        if (settings.focusLock.pendingUnlock) throw new Error('An unlock is already pending');
        if (typeof command.pin !== 'string' || !/^\d{4}$/.test(command.pin)) throw new Error('Invalid PIN');
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(command.pin));
        const hex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
        if (hex !== settings.focusLock.pin) throw new Error('Incorrect PIN');
        this._mutate(settings, command.command);
        const now = Date.now();
        settings.focusLock.pendingUnlock = { command: command.command, requestedAt: now, unlocksAt: now + settings.focusLock.cooldownMinutes * 60000 };
        return commit();
      }
      const next = this._mutate(settings, command);
      if (IYT_Policy.weakens(settings, next, command.op)) {
        await commit();
        const error = new Error('Focus Lock requires a PIN and cooldown for this change.'); error.code = 'LOCKED'; throw error;
      }
      settings = next;
      return commit();
    });
  }
}
globalThis.StorageManager = StorageManager;
