/**
 * background.js — Intentional YT v3
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;


const ALARM_NAME = 'iyt-daily-reset';

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function scheduleNextReset() {
  const delayMinutes = msUntilMidnight() / 60000;
  browser.alarms.create(ALARM_NAME, { delayInMinutes: delayMinutes });
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
});

browser.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await StorageManager.resetDailyStats();
    scheduleNextReset();
  }
});
