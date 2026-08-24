/**
 * Background Script for Intentional YT
 * Handles daily reset alarms and background Shorts page intercepts.
 */

/**
 * Schedule daily reset alarm at midnight.
 */
async function setupDailyResetAlarm() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);

  const msUntilMidnight = midnight.getTime() - now.getTime();
  const delayInMinutes = Math.max(1, Math.round(msUntilMidnight / 60000));

  try {
    await browser.alarms.clear('daily-reset');
    browser.alarms.create('daily-reset', {
      delayInMinutes: delayInMinutes,
      periodInMinutes: 24 * 60 // Repeat daily (24 hours)
    });
  } catch (error) {
    console.error('Failed to setup daily reset alarm:', error);
  }
}

/**
 * Perform stats reset when daily-reset alarm fires.
 */
async function resetDailyStats() {
  try {
    const settings = await StorageManager.getSettings();
    if (!settings.stats) {
      settings.stats = {};
    }
    settings.stats.todayWatchSeconds = 0;
    settings.stats.limitDismissedToday = false;
    settings.stats.lastStatsReset = new Date().toISOString().split('T')[0];
    await StorageManager.saveSettings(settings);
    console.log('Daily watch stats reset successfully.');
  } catch (error) {
    console.error('Failed to reset daily stats:', error);
  }
}

// Listen for alarm triggers
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'daily-reset') {
    resetDailyStats();
  }
});

// Bind lifecycle listeners
browser.runtime.onInstalled.addListener(() => {
  setupDailyResetAlarm();
});

browser.runtime.onStartup.addListener(() => {
  setupDailyResetAlarm();
});

// Intercept Shorts URLs in background if blockShorts is enabled
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes('/shorts/')) {
    try {
      const settings = await StorageManager.getSettings();
      if (settings.extensionEnabled && settings.blockShorts) {
        browser.tabs.update(tabId, { url: 'https://www.youtube.com/' });
      }
    } catch (error) {
      console.error('Failed to intercept Shorts URL:', error);
    }
  }
});

// Run setup immediately on background script spin up
setupDailyResetAlarm();
