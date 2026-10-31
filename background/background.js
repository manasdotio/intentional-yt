/** Central settings writer and durable deadline reconciliation. */
'use strict';
if (typeof importScripts === 'function') importScripts('/utils/storage.js', '/utils/policy.js', '/utils/schema.js');
var browser = globalThis.browser || globalThis.chrome;
StorageManager._background = true;
const RESET = 'iyt-daily-reset', DEADLINE = 'iyt-deadline';
let alarmQueue = Promise.resolve();
const localeCatalogs = new Map();
async function loadLocaleCatalog(lang) {
  // Only locale names are accepted; callers cannot request arbitrary resources.
  if (typeof lang !== 'string' || !/^[a-z]{2,3}(?:_[A-Z]{2})?$/.test(lang)) {
    throw new Error('Invalid locale');
  }
  if (localeCatalogs.has(lang)) return localeCatalogs.get(lang);
  const response = await fetch(browser.runtime.getURL(`_locales/${lang}/messages.json`));
  if (!response.ok) throw new Error('Locale catalog unavailable');
  const catalog = await response.json();
  localeCatalogs.set(lang, catalog);
  return catalog;
}
function getNextResetTime(resetHour = 4, now = new Date()) {
  const h = (Number.isFinite(resetHour) && resetHour >= 0 && resetHour <= 23) ? resetHour : 4;
  const target = new Date(now);
  target.setHours(h, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}
function scheduleDeadlines(currentSettings) {
  alarmQueue = alarmQueue.catch(() => {}).then(async () => {
    const settings = currentSettings || await StorageManager.execute({ op: 'reconcile' });
    const now = new Date();
    const resetHour = settings.dailyLimit?.resetHour ?? 4;
    const nextReset = getNextResetTime(resetHour, now);
    if ((await browser.alarms.get(RESET))?.scheduledTime !== nextReset) await browser.alarms.create(RESET, { when: nextReset });
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
  if (message?.type === 'IYT_REVIEW_PROMPT') {
    if (sender.url !== browser.runtime.getURL('ui/popup.html')) return;
    StorageManager.reviewPrompt(true)
      .then(show => sendResponse({ show }))
      .catch(() => sendResponse({ show: false }));
    return true;
  }
  if (message?.type === 'IYT_LOCALE') {
    loadLocaleCatalog(message.lang)
      .then(catalog => sendResponse({ ok: true, catalog }))
      .catch(error => sendResponse({ ok: false, error: error.message }));
    return true;
  }
  if (message?.type === 'IYT_CLOSE_TAB' && sender.tab?.id) {
    browser.tabs.remove(sender.tab.id).catch(console.error);
    return;
  }
  if (message?.type !== 'IYT_STORAGE') return;
  StorageManager.execute(message.command).then(async settings => {
    if (!['watch', 'claimLimitWarning'].includes(message.command.op)) await scheduleDeadlines(settings);
    sendResponse({ ok: true, settings });
  }).catch(error => sendResponse({ ok: false, error: error.message, code: error.code }));
  return true;
});
browser.alarms.onAlarm.addListener(() => { reconcile().catch(console.error); });

function setupContextMenus() {
  if (!browser?.contextMenus?.create) return;
  try {
    const menus = [
      { id: 'iyt-snooze-15', title: '⏸ Snooze Intentional YT (15 mins)' },
      { id: 'iyt-toggle-grayscale', title: '🔇 Toggle Grayscale Mode' },
      { id: 'iyt-block-channel', title: '🚫 Block this channel' }
    ];
    browser.contextMenus.removeAll(() => {
      for (const m of menus) {
        browser.contextMenus.create({
          id: m.id,
          title: m.title,
          contexts: ['page', 'link', 'action'],
          documentUrlPatterns: ['*://*.youtube.com/*', '*://youtube.com/*']
        }, () => {
          if (browser?.runtime?.lastError) { /* ignore duplicate errors */ }
        });
      }
    });
  } catch (err) {
    console.warn('[IYT] Context menu registration failed:', err);
  }
}

if (browser?.contextMenus?.onClicked) {
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    try {
      if (info.menuItemId === 'iyt-snooze-15') {
        const settings = await StorageManager.execute({ op: 'snooze', minutes: 15 });
        await scheduleDeadlines(settings);
      } else if (info.menuItemId === 'iyt-toggle-grayscale') {
        const current = await StorageManager.getSettings();
        await StorageManager.updateSettings({ grayscaleMode: !current.grayscaleMode });
      } else if (info.menuItemId === 'iyt-block-channel') {
        let channel = null;
        if (info.linkUrl) {
          try {
            const u = new URL(info.linkUrl);
            const p = u.pathname.split('/').filter(Boolean);
            if (p[0]?.startsWith('@')) channel = p[0];
            else if (['channel', 'c', 'user'].includes(p[0]) && p[1]) channel = p[1];
          } catch (_) {}
        }
        if (!channel && tab?.url) {
          try {
            const u = new URL(tab.url);
            const p = u.pathname.split('/').filter(Boolean);
            if (p[0]?.startsWith('@')) channel = p[0];
            else if (['channel', 'c', 'user'].includes(p[0]) && p[1]) channel = p[1];
          } catch (_) {}
        }
        if (!channel && tab?.id) {
          try {
            const res = await browser.tabs.sendMessage(tab.id, { type: 'IYT_GET_CURRENT_CHANNEL' });
            if (res?.channel) channel = res.channel;
          } catch (_) {}
        }
        if (channel) {
          const current = await StorageManager.getSettings();
          const clean = channel.trim();
          const list = current.channelBlocklist || [];
          if (!list.some(c => c.toLowerCase() === clean.toLowerCase())) {
            await StorageManager.updateSettings({ channelBlocklist: [...list, clean] });
          }
        }
      }
    } catch (err) {
      console.warn('[IYT ContextMenu] Click action error:', err);
    }
  });
}

setupContextMenus();
// Cross-device sync listener
if (browser?.storage?.onChanged) {
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'sync' && changes?.iyt_sync_settings?.newValue) {
      try {
        const local = await StorageManager.getSettings();
        if (local.syncEnabled) {
          const remote = changes.iyt_sync_settings.newValue;
          await StorageManager.updateSettings(remote);
        }
      } catch (err) {
        console.warn('[IYT Sync] Error applying remote sync settings:', err);
      }
    }
  });
}

browser.runtime.onStartup.addListener(() => { reconcile().catch(console.error); });
// Starts the seven-day wait on install, or on first run of this version for
// existing users whose original installation date is unknown.
StorageManager.reviewPrompt().catch(console.error);
browser.runtime.onInstalled.addListener(details => {
  reconcile().catch(console.error);
  browser.runtime.setUninstallURL('https://intentionalyt.me/uninstall').catch(() => {});
  if (details?.reason === 'install' && browser?.tabs?.create) {
    browser.tabs.create({ url: browser.runtime.getURL('ui/welcome.html') }).catch(console.error);
  }
});
reconcile().catch(console.error);
