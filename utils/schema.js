/** Validate backups and settings before committing any mutation. */
'use strict';
globalThis.IYT_validate = function (input, portable = false) {
  const defaults = StorageManager.getDefaultSettings();
  const fail = path => { throw new Error(`Invalid setting: ${path}`); };
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  if (!object(input)) fail('settings');
  if (JSON.stringify(input).length > 250000) fail('file too large');
  const visit = (value, template, path = '') => {
    if (!object(value)) fail(path);
    const result = { ...template };
    for (const [key, v] of Object.entries(value)) {
      const name = path ? `${path}.${key}` : key;
      if (!Object.hasOwn(template, key) || ['__proto__','constructor','prototype'].includes(key)) fail(name);
      const d = template[key];
      if (name === 'focusLock.pendingUnlock') { result[key] = null; continue; }
      if (name === 'snoozeUntil' || name === 'focusSessionUntil') {
        if (v !== null && (!Number.isFinite(v) || v < 0)) fail(name);
      } else if (name === 'focusLock.pin') {
        if (v !== null && (typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v))) fail(name);
      } else if (Array.isArray(d)) {
        if (!Array.isArray(v) || v.length > (key === 'schedules' ? 100 : 1000)) fail(name);
        if (key === 'schedules') {
          const ids = new Set();
          for (const schedule of v) {
            if (!object(schedule) || Object.keys(schedule).some(k => !['id','label','enabled','days','startTime','endTime','mode'].includes(k))) fail(name);
            if (typeof schedule.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(schedule.id) || ids.has(schedule.id)) fail(`${name}.id`);
            ids.add(schedule.id);
            if (typeof schedule.label !== 'string' || schedule.label.length > 200 || typeof schedule.enabled !== 'boolean') fail(name);
            if (!Array.isArray(schedule.days) || !schedule.days.length || schedule.days.length > 7 || schedule.days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) fail(`${name}.days`);
            if (![schedule.startTime, schedule.endTime].every(t => typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail(`${name}.time`);
            if (!['full','strict'].includes(schedule.mode)) fail(`${name}.mode`);
          }
        } else if (v.some(x => typeof x !== 'string' || !x.trim() || x.length > 200)) fail(name);
      } else if (object(d)) {
        result[key] = visit(v, d, name); continue;
      } else if (typeof d === 'boolean') {
        if (typeof v !== 'boolean') fail(name);
      } else if (typeof d === 'number') {
        if (!Number.isFinite(v) || v < 0) fail(name);
        if (name !== 'stats.todayWatchSeconds' && (!Number.isInteger(v) || v < 1 || v > 1440)) fail(name);
        if (name === 'stats.todayWatchSeconds' && v > 8640000) fail(name);
      } else if (typeof v !== 'string' || v.length > 100) fail(name);
      result[key] = v;
    }
    return result;
  };
  const result = visit(input, defaults);
  if (!['auto','light','dark'].includes(result.themeMode)) fail('themeMode');
  if (!['auto','id','cs','de','el','en','es','fr','it','nl','pl','pt_BR','ro','sv','vi','tr','ru','uk','he','ar','hi','bn','th','ja','zh_CN','zh_TW','ko'].includes(result.userLanguage)) fail('userLanguage');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.stats.lastStatsReset)) fail('stats.lastStatsReset');
  if (portable) {
    result.focusLock = { ...defaults.focusLock };
    result.stats = { ...defaults.stats };
    result.snoozeUntil = null;
    result.focusSessionUntil = null;
  }
  return result;
};
