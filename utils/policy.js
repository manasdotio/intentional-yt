/** Shared, deterministic protection policy. No DOM or browser dependencies. */
'use strict';
globalThis.IYT_Policy = {
  active(s, now = Date.now()) {
    return !!s && s.extensionEnabled !== false && !(s.snoozeUntil > now);
  },
  scheduleActive(s, now = new Date()) {
    if (!s.enabled) return false;
    const day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = s.startTime.split(':').map(Number), [eh, em] = s.endTime.split(':').map(Number);
    const start = sh * 60 + sm, end = eh * 60 + em;
    if (start === end) return s.days.includes(day);
    if (start < end) return s.days.includes(day) && mins >= start && mins < end;
    return (s.days.includes(day) && mins >= start) || (s.days.includes((day + 6) % 7) && mins < end);
  },
  schedules(s, now = new Date()) {
    return this.active(s, now.getTime()) && s.scheduledBlocking?.enabled
      ? s.scheduledBlocking.schedules.filter(rule => this.scheduleActive(rule, now)) : [];
  },
  effective(s, now = new Date()) {
    const result = { ...s };
    if (this.videoSessionPhase(s, now.getTime()) === 'watching') {
      for (const key of ['blockHomeFeed','blockRecommended','blockEndScreens','blockShorts','disableAutoplay','disableHoverPreviews']) result[key] = true;
      result.limitHomeFeed = false;
    }
    // Timed sessions use the user's chosen controls. Only an explicitly strict
    // schedule may temporarily enable every protection.
    if (this.schedules(s, now).some(rule => rule.mode === 'strict')) {
      for (const key of Object.keys(result)) {
        if (/^(block|disable)/.test(key) && typeof result[key] === 'boolean') result[key] = true;
      }
      result.hideThumbnails = result.redirectShorts = true;
      result.limitHomeFeed = false;
    }
    return result;
  },
  videoSessionPhase(s, now = Date.now()) {
    const v = s?.videoSession;
    if (!v) return null;
    if (v.phase === 'watching') return now < v.sessionDeadline ? 'watching' : (now < v.sessionDeadline + 300000 ? 'break' : null);
    return v.phase === 'break' && now < v.breakUntil ? 'break' : null;
  },
  videoPlaybackAllowed(s, owner, videoId, verified, now = Date.now()) {
    const phase = this.videoSessionPhase(s, now);
    return !phase || (phase === 'watching' && owner && verified && videoId === s.videoSession.videoId);
  },
  commitmentWeakens(old, next, op) {
    if (!this.videoSessionPhase(old)) return false;
    if (['reset','import','resetStats','snooze','focusStart'].includes(op)) return true;
    // Reuse the same guardrails even when Focus Lock is not configured.
    const guard = { ...old.focusLock, enabled: true, pin: old.focusLock.pin || 'commitment' };
    // A synthetic lock is only a comparison mechanism. Preserve its identity in
    // both operands so harmless edits do not look like disabling/changing a PIN.
    if (old.focusLock.enabled && (old.focusLock.pin || ['phrase', 'strict'].includes(old.focusLock.unlockType)) && (!next.focusLock.enabled || next.focusLock.pin !== old.focusLock.pin || next.focusLock.cooldownMinutes < old.focusLock.cooldownMinutes)) return true;
    return this.weakens({ ...old, focusLock: guard }, { ...next, focusLock: guard }, op);
  },
  focusSessionActive(s, now = Date.now()) {
    return this.active(s, now) && s.focusSessionUntil > now;
  },
  limitWarning(s, now = Date.now()) {
    if (!this.active(s, now) || !s.dailyLimit.enabled || s.dailyLimit.warningEnabled === false || s.stats.limitDismissedToday) return 0;
    const left = s.dailyLimit.limitMinutes * 60 - s.stats.todayWatchSeconds;
    const threshold = s.dailyLimit.limitMinutes <= 5 ? 60 : 300;
    return left > 0 && left <= threshold ? Math.ceil(left / 60) : 0;
  },
  scheduleEnds(s, mode, now = new Date()) {
    // Only inspect actual end boundaries, rather than every minute of the week.
    const boundaries = new Set();
    for (const rule of s.scheduledBlocking?.schedules || []) {
      if (!rule.enabled || rule.mode !== mode) continue;
      const [hour, minute] = rule.endTime.split(':').map(Number);
      for (let offset = -1; offset <= 7; offset++) {
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
        if (!rule.days.includes(day.getDay())) continue;
        const allDay = rule.startTime === rule.endTime;
        const overnight = rule.startTime >= rule.endTime;
        const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + Number(overnight), allDay ? 0 : hour, allDay ? 0 : minute);
        if (end > now) boundaries.add(end.getTime());
      }
    }
    for (const timestamp of [...boundaries].sort((a, b) => a - b)) {
      const next = new Date(timestamp);
      if (!this.schedules(s, next).some(rule => rule.mode === mode)) return next;
    }
    return null;
  },
  fullBlockEnds(s, now = new Date()) { return this.scheduleEnds(s, 'full', now); },
  weakens(old, next, op) {
    if (!(old.focusLock?.enabled && (old.focusLock.pin || ['phrase', 'strict'].includes(old.focusLock.unlockType)))) return false;
    if (['reset', 'import', 'resetStats'].includes(op)) return true;
    if (old.focusSessionUntil > Date.now() && (next.focusSessionUntil || 0) < old.focusSessionUntil) return true;
    for (const key of Object.keys(old)) {
      if ((/^(block|disable)/.test(key) || ['extensionEnabled','redirectShorts','hideThumbnails'].includes(key)) && old[key] === true && next[key] === false) return true;
    }
    if (old.limitHomeFeed && !next.limitHomeFeed && !next.blockHomeFeed) return true;
    if (next.limitHomeFeed && old.blockHomeFeed) return true;
    if (old.filterMode === 'allowlist' && next.filterMode !== 'allowlist') return true;
    if (old.allowlistAction === 'hide' && next.allowlistAction === 'dim') return true;
    if ((next.snoozeUntil || 0) > (old.snoozeUntil || 0)) return true;
    for (const key of ['channelBlocklist','keywordBlocklist']) if (old[key].some(x => !next[key].includes(x))) return true;
    for (const key of ['dailyLimit','softReminder','scheduledBlocking','intentGate']) if (old[key]?.enabled && !next[key]?.enabled) return true;
    if (old.dailyLimit.enabled && (next.dailyLimit.limitMinutes > old.dailyLimit.limitMinutes || old.dailyLimit.resetHour !== next.dailyLimit.resetHour)) return true;
    if (old.softReminder.enabled && next.softReminder.intervalMinutes > old.softReminder.intervalMinutes) return true;
    if (old.intentGate?.enabled && old.intentGate.recheckMinutes > 0 && (next.intentGate.recheckMinutes === 0 || next.intentGate.recheckMinutes > old.intentGate.recheckMinutes)) return true;
    if (!old.stats.limitDismissedToday && next.stats.limitDismissedToday) return true;
    if (!next.focusLock.enabled || (old.focusLock.pin && next.focusLock.pin !== old.focusLock.pin) || next.focusLock.cooldownMinutes < old.focusLock.cooldownMinutes) return true;
    if (old.focusLock.unlockType === 'strict' && next.focusLock.unlockType !== 'strict') return true;
    if (old.focusLock.unlockType === 'both' && next.focusLock.unlockType !== 'both') return true;
    if (old.focusLock.unlockType === 'phrase' && next.focusLock.unlockType === 'pin' && !next.focusLock.pin) return true;
    if (old.focusLock.phraseType === 'custom' && next.focusLock.phraseType !== 'custom') return true;
    if (old.focusLock.phraseType === 'custom' && next.focusLock.customPhrase !== old.focusLock.customPhrase) return true;
    return old.scheduledBlocking.schedules.some(s => s.enabled && JSON.stringify(s) !== JSON.stringify(next.scheduledBlocking.schedules.find(n => n.id === s.id)));
  }
};
