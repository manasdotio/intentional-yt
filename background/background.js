/** Central settings writer and durable deadline reconciliation. */
'use strict';
if (typeof importScripts === 'function') importScripts('/utils/storage.js', '/utils/policy.js', '/utils/schema.js');
var browser = globalThis.browser || globalThis.chrome;
StorageManager._background = true;
const RESET = 'iyt-daily-reset', DEADLINE = 'iyt-deadline';
let alarmQueue = Promise.resolve();
function scheduleDeadlines() {
  alarmQueue = alarmQueue.catch(() => {}).then(async () => {
    const settings = await StorageManager.execute({ op: 'reconcile' });
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    if ((await browser.alarms.get(RESET))?.scheduledTime !== midnight) await browser.alarms.create(RESET, { when: midnight });
    const deadlines = [settings.snoozeUntil, settings.focusSessionUntil, settings.focusLock.pendingUnlock?.unlocksAt].filter(t => t > Date.now());
    const next = Math.min(...deadlines);
    if (deadlines.length) {
      if ((await browser.alarms.get(DEADLINE))?.scheduledTime !== next) await browser.alarms.create(DEADLINE, { when: next });
    } else await browser.alarms.clear(DEADLINE);
  });
  return alarmQueue;
}
async function reconcile() {
  await scheduleDeadlines();
}
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== browser.runtime.id) return;
  if (message?.type === 'IYT_CLOSE_TAB' && sender.tab?.id) {
    browser.tabs.remove(sender.tab.id).catch(console.error);
    return;
  }
  if (message?.type !== 'IYT_STORAGE') return;
  StorageManager.execute(message.command).then(async settings => {
    if (!['watch', 'claimLimitWarning'].includes(message.command.op)) await scheduleDeadlines();
    sendResponse({ ok: true, settings });
  }).catch(error => sendResponse({ ok: false, error: error.message, code: error.code }));
  return true;
});
browser.alarms.onAlarm.addListener(() => { reconcile().catch(console.error); });
browser.runtime.onStartup.addListener(() => { reconcile().catch(console.error); });
browser.runtime.onInstalled.addListener(() => {
  reconcile().catch(console.error);
  browser.runtime.setUninstallURL('https://intentionalyt.me/uninstall').catch(() => {});
});
reconcile().catch(console.error);
