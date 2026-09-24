/**
 * background.js — Intentional YT v3
 */

'use strict';

if (typeof importScripts === 'function') {
  try {
    importScripts('/utils/storage.js');
  } catch (e) {
    importScripts('../utils/storage.js');
  }
}

var browser = globalThis.browser || globalThis.chrome;


const ALARM_NAME = 'iyt-daily-reset';
const SNOOZE_ALARM = 'iyt-snooze-restore';

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function scheduleNextReset() {
  const delayMinutes = msUntilMidnight() / 60000;
  browser.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
}

async function broadcastSettingsToTabs(settings) {
  try {
    if (browser && browser.tabs && typeof browser.tabs.query === 'function') {
      const tabs = await browser.tabs.query({ url: ['*://*.youtube.com/*', '*://m.youtube.com/*'] });
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { type: 'IYT_APPLY_SETTINGS', settings }).catch(() => {});
        }
      }
    }
  } catch (e) {}
}

async function checkSnoozeState() {
  const stored = await browser.storage.local.get('settings');
  const snoozeUntil = stored.settings?.snoozeUntil;
  if (!snoozeUntil) return;
  if (Date.now() >= snoozeUntil) {
    await StorageManager.updateSetting('snoozeUntil', null);
    const fresh = await StorageManager.getSettings();
    await broadcastSettingsToTabs(fresh);
  } else {
    browser.alarms.create(SNOOZE_ALARM, { when: snoozeUntil });
  }
}

browser.runtime.onInstalled.addListener(async () => {
  // Ensure settings always exist in storage from first install.
  // Without this, _flushToStorage reads an empty store and silently returns.
  const stored = await browser.storage.local.get('settings');
  if (!stored.settings) {
    const defaults = StorageManager.getDefaultSettings();
    await browser.storage.local.set({ settings: defaults });
  }
  scheduleNextReset();
  checkSnoozeState();
});

if (browser.runtime.onStartup) {
  browser.runtime.onStartup.addListener(() => {
    checkSnoozeState();
  });
}

browser.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    const newSnooze = changes.settings.newValue?.snoozeUntil;
    const oldSnooze = changes.settings.oldValue?.snoozeUntil;
    if (newSnooze && newSnooze > Date.now()) {
      browser.alarms.create(SNOOZE_ALARM, { when: newSnooze });
    } else if (!newSnooze && oldSnooze) {
      browser.alarms.clear(SNOOZE_ALARM);
    }
  }
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await StorageManager.resetDailyStats();
    scheduleNextReset();
  } else if (alarm.name === SNOOZE_ALARM) {
    await StorageManager.updateSetting('snoozeUntil', null);
    const fresh = await StorageManager.getSettings();
    await broadcastSettingsToTabs(fresh);
  }
});
