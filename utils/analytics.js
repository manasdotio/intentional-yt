/**
 * analytics.js — Intentional YT Pro Analytics Engine
 * Per-channel watch tracking, 7-day rolling history, focus streaks.
 * Zero external dependencies. All data stays in chrome.storage.local.
 *
 * Storage layout (key: 'analytics'):
 * {
 *   channels: { [channelId]: { name: string, seconds: number, lastSeen: string } },
 *   dailyHistory: { [dateStr]: { totalSeconds: number, channels: { [channelId]: number } } },
 *   streaks: { focusStreak: number, lastFocusDay: string, longestStreak: number }
 * }
 *
 * A "focus day" = any day where watch time is under a configured threshold (default 30 min).
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

const IYT_Analytics = (() => {
  const STORAGE_KEY = 'analytics';
  const MAX_HISTORY_DAYS = 30;
  const MAX_CHANNELS = 500;
  // A focus day is any day where total watch was under this many minutes.
  const FOCUS_DAY_THRESHOLD_MIN = 30;

  /** Read the analytics object from storage. Returns a safe default if missing. */
  async function _read() {
    try {
      const stored = await browser.storage.local.get(STORAGE_KEY);
      const a = stored?.[STORAGE_KEY];
      if (a && typeof a === 'object') return a;
    } catch (_) {}
    return { channels: {}, dailyHistory: {}, streaks: { focusStreak: 0, lastFocusDay: '', longestStreak: 0 } };
  }

  /** Persist the analytics object. */
  async function _write(data) {
    await browser.storage.local.set({ [STORAGE_KEY]: data });
  }

  /**
   * Record watch seconds for a channel on a given day.
   * Called by timerToast when flushing a batch.
   *
   * @param {number}  seconds    - Elapsed playback seconds for this batch.
   * @param {string}  channelId  - YouTube channel ID (e.g. "UCxxxxxxx") or handle.
   * @param {string}  channelName - Display name of the channel.
   * @param {string}  dateStr    - ISO date "YYYY-MM-DD" of the watch day.
   */
  async function recordChannelWatch(seconds, channelId, channelName, dateStr) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

    const id = sanitiseChannelId(channelId);
    const name = sanitiseName(channelName);
    const data = await _read();

    // ── Channel lifetime totals ─────────────────────────────────────────────
    if (!data.channels[id]) data.channels[id] = { name, seconds: 0, lastSeen: dateStr };
    data.channels[id].seconds += seconds;
    data.channels[id].lastSeen = dateStr;
    if (name && name !== 'Unknown') data.channels[id].name = name;

    // Prune oldest channels if limit exceeded (keep top MAX_CHANNELS by seconds)
    const channelEntries = Object.entries(data.channels);
    if (channelEntries.length > MAX_CHANNELS) {
      const sorted = channelEntries.sort((a, b) => b[1].seconds - a[1].seconds);
      data.channels = Object.fromEntries(sorted.slice(0, MAX_CHANNELS));
    }

    // ── Daily history ───────────────────────────────────────────────────────
    if (!data.dailyHistory[dateStr]) data.dailyHistory[dateStr] = { totalSeconds: 0, channels: {} };
    data.dailyHistory[dateStr].totalSeconds += seconds;
    if (!data.dailyHistory[dateStr].channels[id]) data.dailyHistory[dateStr].channels[id] = 0;
    data.dailyHistory[dateStr].channels[id] += seconds;

    // Prune old history
    const histKeys = Object.keys(data.dailyHistory).sort();
    if (histKeys.length > MAX_HISTORY_DAYS) {
      for (const old of histKeys.slice(0, histKeys.length - MAX_HISTORY_DAYS)) {
        delete data.dailyHistory[old];
      }
    }

    await _write(data);
  }

  /**
   * Recompute and persist focus streaks based on the current daily history.
   * Should be called once per day (e.g. at midnight reset or on popup open).
   *
   * A day counts as a "focus day" when total watch was < focusThresholdMin,
   * OR when no watch was recorded at all (zero watch = great focus day).
   *
   * @param {number} resetHour        - Daily reset hour (default 4).
   * @param {number} focusThresholdMin - Min threshold in minutes; use user's
   *                                    daily limit if set, else 30.
   */
  async function updateStreaks(resetHour = 4, focusThresholdMin = 30) {
    const threshold = (Number.isFinite(focusThresholdMin) && focusThresholdMin > 0)
      ? focusThresholdMin
      : 30;
    const data = await _read();
    if (!data.streaks) data.streaks = { focusStreak: 0, lastFocusDay: '', longestStreak: 0 };

    const today = StorageManager.getTodayString(resetHour);

    // Build a sorted list of the last 30 days ending today
    let streak = 0;
    let longest = data.streaks.longestStreak || 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const dayData = data.dailyHistory[dateKey];
      const totalMin = ((dayData?.totalSeconds || 0) / 60);
      const isFocusDay = !dayData || totalMin < threshold;
      if (isFocusDay) {
        streak++;
        if (streak > longest) longest = streak;
      } else {
        break; // streak ends at first non-focus day
      }
    }

    data.streaks.focusStreak = streak;
    data.streaks.longestStreak = longest;
    data.streaks.lastFocusDay = today;
    await _write(data);
    return data.streaks;
  }

  /**
   * Get the top N channels by total seconds over the last `days` days.
   * Returns [{ id, name, seconds, pct }] sorted descending.
   */
  async function getTopChannels(days = 7, topN = 3) {
    const data = await _read();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

    // Accumulate channel seconds for the window
    const totals = {};
    let grandTotal = 0;
    for (const [dateStr, dayData] of Object.entries(data.dailyHistory)) {
      if (dateStr < cutoffStr) continue;
      for (const [chId, secs] of Object.entries(dayData.channels || {})) {
        totals[chId] = (totals[chId] || 0) + secs;
        grandTotal += secs;
      }
    }

    const sorted = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([id, seconds]) => ({
        id,
        name: data.channels[id]?.name || id,
        seconds,
        pct: grandTotal > 0 ? Math.round((seconds / grandTotal) * 100) : 0
      }));

    return { channels: sorted, grandTotalSeconds: grandTotal };
  }

  /**
   * Get the 7-day daily history array suitable for rendering a bar chart.
   * Returns [{ dateStr, dayName, minutes, isToday }] for the past 7 days.
   */
  async function getDailyHistory(days = 7) {
    const data = await _read();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const seconds = data.dailyHistory[key]?.totalSeconds || 0;
      result.push({
        dateStr: key,
        dayName: dayNames[d.getDay()],
        minutes: Math.round(seconds / 60),
        isToday: i === 0
      });
    }
    return result;
  }

  /** Get current streak data without recomputing. */
  async function getStreaks() {
    const data = await _read();
    return data.streaks || { focusStreak: 0, lastFocusDay: '', longestStreak: 0 };
  }

  /** Sync today's total from the main stats engine into analytics history. */
  async function syncTodayTotal(todaySeconds, dateStr) {
    if (!Number.isFinite(todaySeconds) || todaySeconds < 0) return;
    if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
    const data = await _read();
    if (!data.dailyHistory[dateStr]) data.dailyHistory[dateStr] = { totalSeconds: 0, channels: {} };
    // Only update total if analytics engine is ahead (channel tracking may have already added more)
    if (data.dailyHistory[dateStr].totalSeconds < todaySeconds) {
      data.dailyHistory[dateStr].totalSeconds = todaySeconds;
    }
    await _write(data);
  }

  /** Reset all analytics data (e.g. user requests full reset). */
  async function reset() {
    await browser.storage.local.remove(STORAGE_KEY);
  }

  // ─── Sanitisation helpers ──────────────────────────────────────────────────

  function sanitiseChannelId(id) {
    if (typeof id !== 'string') return 'unknown';
    // Strip to safe chars: letters, digits, _, -, @
    return id.replace(/[^a-zA-Z0-9_\-@]/g, '').slice(0, 100) || 'unknown';
  }

  function sanitiseName(name) {
    if (typeof name !== 'string') return 'Unknown';
    return name.replace(/[\u0000-\u001F]/g, '').slice(0, 100).trim() || 'Unknown';
  }

  return {
    recordChannelWatch,
    updateStreaks,
    getTopChannels,
    getDailyHistory,
    getStreaks,
    syncTodayTotal,
    reset
  };
})();

globalThis.IYT_Analytics = IYT_Analytics;
