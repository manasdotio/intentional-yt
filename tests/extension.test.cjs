const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const clone = value => structuredClone(value);

test('channel input accepts creator identifiers and rejects video, playlist and unrelated links', () => {
  const context = vm.createContext({ URL });
  const popup = source('ui/popup.js');
  vm.runInContext(popup.slice(popup.indexOf('function normalizeChannelEntry('), popup.indexOf('async function handleAddBlocklistEntry(')), context);
  const normalize = context.normalizeChannelEntry;
  for (const [input, expected] of [
    ['  Science Channel  ', 'science channel'], ['Science: Explained', 'science: explained'],
    ['@Creator.Name', '@creator.name'],
    ['@学習', '@学習'], ['UCAbCd123', 'ucabcd123'],
    ['https://www.youtube.com/@Creator/videos?view=0', '@creator'],
    ['youtube.com/@Creator/shorts', '@creator'],
    ['//m.youtube.com/@Creator', '@creator'],
    ['www.youtube.com/channel/UCAbCd123?si=share', 'ucabcd123'],
    ['https://youtube.com/c/Creator', 'creator'], ['https://youtube.com/user/Creator', 'creator'],
    ['https://youtube.com/@%C3%89cole', '@école'],
    ['https://youtube.com/@%E5%AD%A6%E7%BF%92', '@学習']
  ]) assert.equal(normalize(input), expected, input);
  for (const input of [
    'https://www.youtube.com/watch?v=123', 'youtube.com/shorts/123',
    'https://youtu.be/123?si=share', 'https://youtube.com/playlist?list=123',
    'https://youtube.com/live/123', 'https://youtube.com/embed/123',
    'https://youtube.com/results?search_query=channel', 'youtube.com',
    'https://example.com/@Creator', 'https://youtube.com.example.com/@Creator',
    'ftp://youtube.com/@Creator', 'https://user@youtube.com/@Creator',
    'https://youtube.com/channel/', 'https://youtube.com/@',
    'https://youtube.com/@bad%ZZ', 'https://youtube.com/@bad%2Fpath',
    'https://youtube.com/@bad%20name', 'https://[invalid', '@'
  ]) assert.equal(normalize(input), null, input);
});

function popupConnectionCheck(query, sendMessage) {
  const notice = { hidden: true };
  const context = vm.createContext({
    URL, setTimeout, clearTimeout, $: () => notice,
    browser: { tabs: { query, sendMessage } }
  });
  const popup = source('ui/popup.js');
  vm.runInContext(popup.slice(popup.indexOf('const YOUTUBE_CONTENT_URLS'), popup.indexOf('async function broadcastSettingsToTabs')), context);
  return { notice, check: () => context.checkYouTubeConnection() };
}

test('connection notice distinguishes supported YouTube tabs from unrelated pages', async () => {
  let tab = { id: 1, url: 'https://www.youtube.com/watch?v=lesson', status: 'complete' };
  let reachable = false;
  let requests = 0;
  const env = popupConnectionCheck(async () => [tab], async () => {
    requests++;
    if (!reachable) throw new Error('Receiving end does not exist');
    return { ready: true };
  });
  await env.check();
  assert.equal(env.notice.hidden, false);
  reachable = true;
  await env.check();
  assert.equal(env.notice.hidden, true, 'successful reconnect clears the warning');
  for (const url of ['https://music.youtube.com/', 'https://example.com/', 'https://www.youtube.com.example.com/', undefined]) {
    tab = { id: 2, url, status: 'complete' };
    await env.check();
    assert.equal(env.notice.hidden, true);
  }
  assert.equal(requests, 2, 'unsupported tabs are never messaged');
  tab = { id: 3, url: 'https://m.youtube.com/', status: 'loading' };
  await env.check();
  assert.equal(requests, 2, 'do not warn while a page is still loading');
  tab.status = 'complete';
  reachable = false;
  await env.check();
  assert.equal(env.notice.hidden, false, 'mobile YouTube uses the same connection check');
});

test('late connection failures cannot replace newer tab state', async () => {
  let tab = { id: 1, url: 'https://www.youtube.com/' };
  let fail;
  let started;
  const sending = new Promise(resolve => { started = resolve; });
  const env = popupConnectionCheck(async () => [tab], () => new Promise((_resolve, reject) => { fail = reject; started(); }));
  const oldCheck = env.check();
  await sending;
  tab = { id: 2, url: 'https://example.com/' };
  await env.check();
  fail(new Error('Tab navigated'));
  await oldCheck;
  assert.equal(env.notice.hidden, true);
});

test('failed tab queries do not produce a misleading reload warning', async () => {
  const env = popupConnectionCheck(async () => { throw new Error('Tab unavailable'); }, () => { throw new Error('Must not send'); });
  await env.check();
  assert.equal(env.notice.hidden, true);
});

test('a receiver that never responds produces a bounded reload notice', async () => {
  const env = popupConnectionCheck(async () => [{ id: 1, url: 'https://www.youtube.com/' }], () => new Promise(() => {}));
  await env.check();
  assert.equal(env.notice.hidden, false);
});

function store(initial = {}) {
  const state = clone(initial), writes = [];
  const browser = { storage: { local: {
    async get(keys) { return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, clone(state[k])])); },
    async set(values) { writes.push(clone(values)); Object.assign(state, clone(values)); },
    async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key]; }
  } } };
  const context = vm.createContext({ browser, console, crypto: crypto.webcrypto, TextEncoder });
  for (const file of ['utils/storage.js','utils/policy.js','utils/schema.js']) vm.runInContext(source(file), context);
  context.StorageManager._background = true;
  return { state, writes, manager: context.StorageManager, policy: context.IYT_Policy, validate: context.IYT_validate, context };
}
const locked = async env => {
  const pin = crypto.createHash('sha256').update('1234').digest('hex');
  await env.manager.updateSetting('focusLock', { ...env.manager.getDefaultSettings().focusLock, enabled: true, pin });
};

test('review prompt waits seven days, is claimed once, and survives resets and restarts', async () => {
  const env = store();
  const now = Date.now();
  assert.equal(await env.manager.reviewPrompt(), false);
  assert.ok(env.state.reviewEligibleAt >= now + 7 * 86400000);
  assert.ok(env.state.reviewEligibleAt <= Date.now() + 7 * 86400000);
  const deadline = env.state.reviewEligibleAt;
  assert.equal(await env.manager.reviewPrompt(true), false);
  assert.equal(env.state.reviewEligibleAt, deadline);
  assert.equal(env.state.reviewPromptShown, undefined);
  env.state.reviewEligibleAt = Date.now() - 1;
  assert.deepEqual(await Promise.all([env.manager.reviewPrompt(true), env.manager.reviewPrompt(true)]), [true, false]);
  assert.equal(env.state.reviewPromptShown, true);
  await env.manager.resetToDefaults();
  assert.equal(await store(env.state).manager.reviewPrompt(true), false);
});

test('review prompt fails closed when its one-time flag cannot be saved', async () => {
  const env = store({ reviewEligibleAt: Date.now() - 1 });
  env.context.browser.storage.local.set = async () => { throw new Error('Storage unavailable'); };
  await assert.rejects(env.manager.reviewPrompt(true), /Storage unavailable/);
});

test('channel Home blocking stops hidden trailers, including late autoplay, without affecting other pages or paused protection', () => {
  let channelHome = true;
  let pauses = 0;
  let scans = 0;
  let playHandler;
  const video = { paused: false, pause() { this.paused = true; pauses++; } };
  const settings = { extensionEnabled: true, blockChannelHome: true };
  const context = vm.createContext({
    _settings: settings,
    isEffectiveActive: s => s.extensionEnabled && !s.snoozeUntil,
    html: { hasAttribute: () => channelHome },
    document: {
      querySelectorAll: selector => { assert.equal(selector, 'ytd-browse video, ytm-browse video'); scans++; return [video]; },
      addEventListener: (event, handler, capture) => { assert.equal(event, 'play'); assert.equal(capture, true); playHandler = handler; }
    }
  });
  const code = source('content/blocker.js');
  vm.runInContext(code.slice(code.indexOf('function pauseBlockedChannelVideos()'), code.indexOf('// Initial home page state detection')), context);
  context.pauseBlockedChannelVideos();
  assert.equal(pauses, 1);
  context.pauseBlockedChannelVideos();
  assert.equal(pauses, 1, 'already-paused videos stay paused');
  video.paused = false;
  playHandler({ target: { matches: () => true } });
  assert.equal(pauses, 2, 'late autoplay is paused by the capturing listener');
  const scansBefore = scans;
  playHandler({ target: { matches: () => false } });
  assert.equal(scans, scansBefore, 'unrelated playback does not scan the channel');
  for (const state of ['other-tab', 'off', 'snoozed', 'toggle-off']) {
    channelHome = state !== 'other-tab';
    settings.extensionEnabled = state !== 'off';
    settings.snoozeUntil = state === 'snoozed' ? Date.now() + 60000 : null;
    settings.blockChannelHome = state !== 'toggle-off';
    video.paused = false;
    context.pauseBlockedChannelVideos();
    assert.equal(video.paused, false, state);
  }
});

test('channel Home blocking defaults off, persists independently and respects Focus Lock', async () => {
  const env = store();
  assert.equal(env.manager.getInitialSettings().blockChannelHome, false);
  assert.equal(env.manager.getDefaultSettings().blockChannelHome, false);
  await env.manager.updateSettings({ blockHomeFeed: true, blockChannelHome: true });
  const saved = await store(env.state).manager.getSettings();
  assert.equal(saved.blockChannelHome, true);
  assert.equal(saved.blockHomeFeed, true);
  await locked(env);
  await assert.rejects(env.manager.updateSetting('blockChannelHome', false), { code: 'LOCKED' });
});

test('presets apply atomically without snapshots and preserve unrelated preferences', async () => {
  const env = store();
  await env.manager.updateSettings({ themeMode:'dark', dailyLimit:{enabled:true,limitMinutes:45} });
  await env.manager.recordWatch(20, 'preset-watch', env.manager.getTodayString());
  const writesBefore = env.writes.length;
  await env.manager.applyPreset('balanced', { blockShorts:true, blockComments:true });
  assert.equal(env.writes.length, writesBefore + 1);
  const result = await store(env.state).manager.getSettings();
  assert.equal(result.blockShorts, true);
  assert.equal(result.blockComments, true);
  assert.equal(result.themeMode, 'dark');
  assert.equal(result.dailyLimit.limitMinutes, 45);
  assert.equal(result.stats.todayWatchSeconds, 20);
  assert.equal(env.state.presetUndo, undefined);
  await assert.rejects(env.manager.applyPreset('zen', { extensionEnabled:false }), /Invalid preset/);
  await assert.rejects(env.manager.execute({op:'undoPreset',id:'obsolete'}), /Unknown settings command/);
});

test('presets still respect Focus Lock and apply after an authorized cooldown', async () => {
  const env = store();
  await env.manager.updateSetting('blockHomeFeed', true);
  await locked(env);
  const command = { op:'preset',name:'balanced',updates:{blockHomeFeed:false,blockShorts:true} };
  await assert.rejects(env.manager.applyPreset(command.name, command.updates), {code:'LOCKED'});
  await env.manager.queueUnlock(command, '1234');
  assert.equal(env.state.settings.blockHomeFeed, true);
  await env.manager.updateSetting('blockComments', true);
  env.state.settings.focusLock.pendingUnlock.unlocksAt = Date.now() - 1;
  const restarted=store(env.state);
  const result=await restarted.manager.getSettings();
  assert.equal(result.blockHomeFeed, false);
  assert.equal(result.blockShorts, true);
  assert.equal(result.blockComments, true);
  assert.equal(result.focusLock.pendingUnlock, null);
  assert.equal(restarted.state.presetUndo, undefined);
});

test('obsolete undo snapshots and pending undo are retired without changing preferences', async () => {
  for (const offset of [-1000, 60000]) {
    const env=store();
    await env.manager.updateSetting('blockShorts', true);
    await locked(env);
    env.state.presetUndo={id:'old',name:'balanced',before:{blockShorts:false},after:{blockShorts:true}};
    env.state.settings.focusLock.pendingUnlock={command:{op:'undoPreset',id:'old'},unlocksAt:Date.now()+offset};
    const restarted=store(env.state);
    const result=await restarted.manager.getSettings();
    assert.equal(result.blockShorts,true);
    assert.equal(result.focusLock.enabled,true);
    assert.equal(result.focusLock.pendingUnlock,null);
    assert.equal(restarted.state.presetUndo,undefined);
    await restarted.manager.queueUnlock({op:'update',updates:{blockShorts:false}},'1234');
    assert.ok(restarted.state.settings.focusLock.pendingUnlock,'obsolete undo cannot block future authorized changes');
  }
});

test('new installations hide core distractions and preserve subsequent choices', async () => {
  const env = store();
  const initial = await env.manager.getSettings();
  assert.equal(initial.extensionEnabled, true);
  assert.deepEqual(Object.entries(initial).filter(([key, value]) => value === true).map(([key]) => key), ['extensionEnabled', 'blockHomeFeed', 'blockRecommended', 'blockShorts', 'enableQuickBlock']);
  assert.equal(initial.dailyLimit.enabled, false);
  assert.equal(initial.softReminder.enabled, false);
  assert.equal(initial.scheduledBlocking.enabled, false);
  assert.equal(initial.focusLock.enabled, false);
  const chosen = await env.manager.updateSettings({ blockHomeFeed: false });
  assert.equal(chosen.blockShorts, true);
  assert.equal(chosen.blockRecommended, true);
  assert.equal(chosen.enableQuickBlock, true);
  for (const key of ['blockHomeFeed', 'blockSidebar', 'blockLiveChat', 'blockPlaylist', 'blockVideoDescription', 'redirectShorts', 'disableAutoplay']) {
    assert.equal(chosen[key], false, key);
  }
  const restarted = store(env.state);
  assert.deepEqual(clone(await restarted.manager.getSettings()), clone(chosen));
});

test('existing full and legacy partial settings keep their previous behavior', async () => {
  const env = store();
  const existing = env.manager.getDefaultSettings();
  existing.blockHomeFeed = false;
  existing.blockComments = true;
  existing.enableQuickBlock = false;
  existing.dailyLimit = { enabled: true, limitMinutes: 45, warningEnabled: false, resetHour: 4 };
  const upgraded = store({ settings: existing });
  assert.deepEqual(clone(await upgraded.manager.getSettings()), clone(existing));
  const partial = store({ settings: { blockHomeFeed: false, blockComments: true } });
  const migrated = await partial.manager.getSettings();
  assert.equal(migrated.blockHomeFeed, false);
  assert.equal(migrated.blockComments, true);
  assert.equal(migrated.blockSidebar, true);
  assert.equal(migrated.blockLiveChat, true);
});

test('focus sessions persist, expire, and leave saved preferences and schedules intact', async () => {
  const env = store();
  await env.manager.updateSettings({ extensionEnabled: false, blockComments: false });
  await env.manager.snooze(15);
  const started = await env.manager.startFocusSession(25);
  assert.equal(started.extensionEnabled, true);
  assert.equal(started.snoozeUntil, null);
  assert.equal(started.blockComments, false);
  assert.equal(env.policy.effective(started).blockComments, false);
  const restarted = store(env.state);
  assert.equal((await restarted.manager.getSettings()).focusSessionUntil, started.focusSessionUntil);
  await assert.rejects(restarted.manager.startFocusSession(45), /already running/);
  const portable = restarted.validate(started, true);
  assert.equal(portable.focusSessionUntil, null);
  assert.equal(restarted.policy.focusSessionActive(started, started.focusSessionUntil), false);
  restarted.state.settings.focusSessionUntil = Date.now() - 1;
  const expired = await restarted.manager.getSettings();
  assert.equal(expired.focusSessionUntil, null);
  assert.equal(restarted.policy.effective(expired).blockComments, false);
  await assert.rejects(restarted.manager.startFocusSession(26), /Invalid focus duration/);
});

test('timed focus preserves learning tools and honors explicitly selected restrictions', async () => {
  const env = store();
  await env.manager.updateSettings({ blockShorts: true, blockRecommended: true, blockComments: true });
  const started = await env.manager.startFocusSession(25);
  assert.deepEqual(clone(env.policy.effective(started)), clone(started));
  for (const key of ['blockSidebar','blockPlaylist','blockTopHeader','blockVideoDescription','blockVideoButtons','blockLiveChat','blockSubscriptionsFeed','hideThumbnails','grayscaleMode']) {
    assert.equal(env.policy.effective(started)[key], false, key);
  }
  const ended = await env.manager.endFocusSession();
  assert.equal(ended.blockShorts, true);
  assert.equal(ended.blockRecommended, true);
  assert.equal(ended.blockComments, true);

  const strict = await env.manager.updateSettings({ scheduledBlocking: { enabled: true, schedules: [{ id:'work',label:'Work',enabled:true,days:[new Date().getDay()],startTime:'00:00',endTime:'00:00',mode:'strict' }] } });
  await env.manager.startFocusSession(25);
  assert.equal(env.policy.effective(await env.manager.getSettings()).blockPlaylist, true, 'explicit strict schedules still apply during timed sessions');
  assert.equal(strict.blockPlaylist, false, 'strict schedules never rewrite saved choices');
});

test('Focus Lock protects early session endings and cooldown applies with popup closed', async () => {
  const env = store();
  await locked(env);
  await env.manager.startFocusSession(60);
  await assert.rejects(env.manager.endFocusSession(), { code: 'LOCKED' });
  await assert.rejects(env.manager.updateSetting('focusSessionUntil', null), { code: 'LOCKED' });
  await env.manager.queueUnlock({ op: 'focusEnd', until: env.state.settings.focusSessionUntil }, '1234');
  env.state.settings.focusLock.pendingUnlock.unlocksAt = Date.now() - 1;
  const restarted = store(env.state);
  assert.equal((await restarted.manager.getSettings()).focusSessionUntil, null);
});

test('daily warning is claimed once across tabs and restarts without repeated writes', async () => {
  const env = store();
  await env.manager.updateSetting('dailyLimit', { enabled: true, limitMinutes: 30, warningEnabled: true });
  const day = env.manager.getTodayString();
  await env.manager.recordWatch(1500, 'first', day);
  const results = await Promise.all([env.manager.claimLimitWarning(), env.manager.claimLimitWarning()]);
  assert.equal(results.filter(result => result.claimed).length, 1);
  assert.equal(results[0].minutes, 5);
  const count = env.writes.length;
  await env.manager.claimLimitWarning();
  assert.equal(env.writes.length, count);
  assert.equal((await store(env.state).manager.claimLimitWarning()).claimed, false);
  await env.manager.updateNestedSetting('dailyLimit', 'limitMinutes', 31);
  assert.equal((await env.manager.claimLimitWarning()).claimed, false);
  await env.manager.recordWatch(60, 'next', day);
  assert.equal((await env.manager.claimLimitWarning()).claimed, true);
});

test('a delayed end command cannot cancel a newer focus session', async () => {
  const env = store();
  const first = await env.manager.startFocusSession(25);
  await env.manager.endFocusSession();
  const second = await env.manager.startFocusSession(60);
  const result = await env.manager.execute({ op: 'focusEnd', until: first.focusSessionUntil });
  assert.equal(result.focusSessionUntil, second.focusSessionUntil);
});

test('warnings respect off, snooze, dismissed limits, opt-out and short budgets', () => {
  const env = store(), s = env.manager.getDefaultSettings();
  s.dailyLimit = { enabled: true, limitMinutes: 5, warningEnabled: true };
  s.stats.todayWatchSeconds = 239;
  assert.equal(env.policy.limitWarning(s), 0);
  s.stats.todayWatchSeconds = 240;
  assert.equal(env.policy.limitWarning(s), 1);
  for (const patch of [{ extensionEnabled: false }, { snoozeUntil: Date.now() + 60000 }, { dailyLimit: { ...s.dailyLimit, warningEnabled: false } }, { stats: { ...s.stats, limitDismissedToday: true } }, { stats: { ...s.stats, todayWatchSeconds: 300 } }]) {
    assert.equal(env.policy.limitWarning({ ...s, ...patch }), 0);
  }
});

test('all shipped scripts compile and manifest references exist', () => {
  const manifest = JSON.parse(source('manifest.json'));
  for (const dir of ['utils','content','background','ui']) for (const file of fs.readdirSync(path.join(root,dir))) {
    if (file.endsWith('.js')) new vm.Script(source(`${dir}/${file}`), { filename: file });
  }
  for (const file of [...manifest.background.scripts, ...manifest.content_scripts.flatMap(c => [...c.js,...c.css])]) assert.ok(fs.existsSync(path.join(root,file)), file);
  assert.ok(manifest.background.service_worker && manifest.background.scripts);
});

test('concurrent commands from independent clients preserve settings and usage', async () => {
  const env = store();
  function client() {
    const c = vm.createContext({ console, browser: { runtime: { sendMessage: async ({command}) => ({ok:true,settings:await env.manager.execute(command)}) } } });
    vm.runInContext(source('utils/storage.js'),c); return c.StorageManager;
  }
  const a=client(), b=client();
  await Promise.all([a.updateSetting('blockComments',true), b.updateSetting('blockPlaylist',true), a.recordWatch(5,'a',a.getTodayString()), b.recordWatch(7,'b',b.getTodayString())]);
  const result=await a.getSettings();
  assert.equal(result.blockComments,true); assert.equal(result.blockPlaylist,true); assert.equal(result.stats.todayWatchSeconds,12);
  assert.equal(env.state.settings.stats,undefined);
  env.writes.length=0;
  await a.recordWatch(5,'c',a.getTodayString());
  assert.ok(env.writes.every(write => !write.settings), 'watch batches must not wake preference listeners');
});

test('watch retries are idempotent and previous-day batches cannot reset new usage', async () => {
  const {manager:m}=store(); const day=m.getTodayString();
  await m.recordWatch(5,'same',day); await m.recordWatch(5,'same',day);
  await m.recordWatch(7,'old','2000-01-01');
  assert.equal((await m.getSettings()).stats.todayWatchSeconds,5);
});

test('date reconciliation migrates legacy stats and never unconditionally resets today', async () => {
  const env=store(); const defaults=env.manager.getDefaultSettings(); defaults.stats.todayWatchSeconds=35;
  env.state.settings=clone(defaults);
  assert.equal((await env.manager.getSettings()).stats.todayWatchSeconds,35);
  await env.manager.execute({op:'reconcile'});
  assert.equal((await env.manager.getSettings()).stats.todayWatchSeconds,35);
  env.state.usage.stats.lastStatsReset='2000-01-01';
  assert.equal((await env.manager.getSettings()).stats.todayWatchSeconds,0);
});

test('invalid imports are rejected atomically with field-specific errors', async () => {
  const env=store();await env.manager.getSettings();const before=JSON.stringify(env.state);
  for (const input of [{scheduledBlocking:{schedules:'bad'}},{channelBlocklist:[42]},{dailyLimit:{limitMinutes:-1}},{dailyLimit:{resetHour:-1}},{dailyLimit:{resetHour:24}},{blockComments:'yes'},{unknown:true},{scheduledBlocking:{schedules:[{id:'"<input>',label:'x',enabled:true,days:[1],startTime:'09:00',endTime:'17:00',mode:'full'}]}}]) {
    assert.throws(()=>env.manager.importSettings(input),/Invalid setting/);
  }
  assert.equal(JSON.stringify(env.state),before);
});

test('portable backups remove PIN, deadlines, snooze and usage', () => {
  const env=store(), s=env.manager.getDefaultSettings();
  s.focusLock.pin='a'.repeat(64);s.focusLock.enabled=true;s.focusLock.pendingUnlock={unlocksAt:1};s.snoozeUntil=123;s.stats.todayWatchSeconds=30;
  const result=env.validate(s,true);assert.equal(result.focusLock.pin,null);assert.equal(result.focusLock.enabled,false);assert.equal(result.snoozeUntil,null);assert.equal(result.stats.todayWatchSeconds,0);
});

test('import validation deduplicates and trims channel and keyword blocklists', () => {
  const env=store(), s=env.manager.getDefaultSettings();
  s.channelBlocklist = ['  @creator  ', '@creator', '@other'];
  s.keywordBlocklist = ['podcast', '  podcast  ', 'gaming'];
  const result = env.validate(s, true);
  assert.equal(JSON.stringify(result.channelBlocklist), JSON.stringify(['@creator', '@other']));
  assert.equal(JSON.stringify(result.keywordBlocklist), JSON.stringify(['podcast', 'gaming']));
});

test('Focus Lock rejects every audited weakening path centrally', async () => {
  const env=store(),m=env.manager;
  const schedule={id:'work',label:'Work',enabled:true,days:[1],startTime:'09:00',endTime:'17:00',mode:'full'};
  await m.updateSettings({dailyLimit:{enabled:true,limitMinutes:30},scheduledBlocking:{enabled:true,schedules:[schedule]},channelBlocklist:['science']});
  await locked(env);
  const commands=[
    {op:'nested',parentKey:'dailyLimit',childKey:'limitMinutes',value:60},
    {op:'nested',parentKey:'dailyLimit',childKey:'resetHour',value:0},
    {op:'nested',parentKey:'stats',childKey:'limitDismissedToday',value:true},
    {op:'nested',parentKey:'focusLock',childKey:'cooldownMinutes',value:1},
    {op:'resetStats'}, {op:'reset'}, {op:'import',settings:{}},
    {op:'update',updates:{snoozeUntil:Date.now()+60000}},
    {op:'update',updates:{extensionEnabled:false}},
    {op:'update',updates:{scheduledBlocking:{enabled:true,schedules:[{...schedule,mode:'strict'}]}}},
    {op:'list',key:'channelBlocklist',value:'science',remove:true}
  ];
  for(const command of commands) await assert.rejects(m.execute(command),e=>e.code==='LOCKED',JSON.stringify(command));
  await m.updateNestedSetting('dailyLimit','limitMinutes',15);
});

test('PIN deadlines survive context restart and apply once without a popup', async () => {
  const env=store();await env.manager.updateSetting('blockHomeFeed',true);await locked(env);
  const command={op:'update',updates:{blockHomeFeed:false}};
  await assert.rejects(env.manager.queueUnlock(command,'9999'),/Incorrect PIN/);
  await env.manager.queueUnlock(command,'1234');
  assert.equal(env.state.settings.blockHomeFeed,true);
  env.state.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;
  const restarted=store(env.state);
  assert.equal((await restarted.manager.getSettings()).blockHomeFeed,false);
  assert.equal(restarted.state.settings.focusLock.pendingUnlock,null);
  await restarted.manager.execute({op:'reconcile'});
  assert.equal(restarted.state.settings.blockHomeFeed,false);
});

test('strict settings, snooze and overnight schedules use one policy', () => {
  const env=store(),s=env.manager.getDefaultSettings(),p=env.policy;
  s.scheduledBlocking={enabled:true,schedules:[{id:'x',label:'x',enabled:true,days:[1],startTime:'22:00',endTime:'06:00',mode:'strict'}]};
  const tuesday=new Date(2026,8,29,2,0);
  const effective=p.effective(s,tuesday);
  assert.equal(effective.blockComments,true);assert.equal(effective.disableAutoplay,true);assert.equal(s.blockComments,false);
  assert.equal(p.schedules(s,new Date(2026,8,29,6,0)).length,0);
  s.snoozeUntil=tuesday.getTime()+60000;
  assert.equal(p.effective(s,tuesday).blockComments,false);
  s.snoozeUntil=null;s.extensionEnabled=false;assert.equal(p.schedules(s,tuesday).length,0);
});

test('reopening boundary includes overlapping and all-day schedules', () => {
  const env=store(),s=env.manager.getDefaultSettings();
  s.scheduledBlocking={enabled:true,schedules:[
    {enabled:true,days:[1],startTime:'09:00',endTime:'12:00',mode:'full'},
    {enabled:true,days:[1],startTime:'11:00',endTime:'17:00',mode:'full'}
  ]};
  assert.equal(env.policy.fullBlockEnds(s,new Date(2026,8,28,10,0)).getHours(),17);
  s.scheduledBlocking.schedules=[{enabled:true,days:[1],startTime:'09:00',endTime:'09:00',mode:'full'}];
  const end=env.policy.fullBlockEnds(s,new Date(2026,8,28,10,0));assert.equal(end.getDay(),2);assert.equal(end.getHours(),0);
});

test('queued schedule edits preserve schedules added during cooldown', async () => {
  const env=store(),m=env.manager;
  const first={id:'first',label:'First',enabled:true,days:[1],startTime:'09:00',endTime:'17:00',mode:'full'};
  await m.saveSchedule(first);await locked(env);
  await m.queueUnlock({op:'scheduleSave',schedule:{...first,endTime:'12:00'}},'1234');
  await m.saveSchedule({...first,id:'second',label:'Second'});
  env.state.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;
  const result=await m.getSettings();
  assert.equal(result.scheduledBlocking.schedules.length,2);
  assert.equal(result.scheduledBlocking.schedules.find(s=>s.id==='first').endTime,'12:00');
});

test('snooze starts its full duration after the cooldown, not before', async () => {
  const env=store(),m=env.manager;await locked(env);
  await m.queueUnlock({op:'snooze',minutes:5},'1234');
  env.state.settings.focusLock.pendingUnlock.unlocksAt=Date.now()-1;
  const result=await m.getSettings();
  assert.ok(result.snoozeUntil>Date.now()+299000);
});

test('manual localization follows declared placeholder indices and preserves dollar text', async () => {
  const catalog={message_test:{message:'$SECOND$ / $FIRST$ / $$',placeholders:{first:{content:'$1'},second:{content:'$2'}}}};
  const requests=[];
  const context=vm.createContext({console,browser:{runtime:{sendMessage:async message=>{requests.push(message);return {ok:true,catalog};}},i18n:{getMessage:()=>''}},fetch:()=>{throw new Error('Content scripts must not fetch locale files');}});
  vm.runInContext(source('utils/i18n.js'),context);
  await context.I18N.setLanguage('fr');
  assert.equal(context.I18N.getMessage('message_test',['$&','two']),'two / $& / $');
  assert.deepEqual(requests.map(message=>message.lang).sort(),['en','fr']);
  assert.ok(requests.every(message=>message.type==='IYT_LOCALE'));
});

test('background serves local catalogs and rejects invalid locale paths and foreign senders', async () => {
  let listener;
  const fetched=[];
  const event={addListener(){}};
  const context=vm.createContext({console,fetch:async url=>{
    fetched.push(url);
    return {ok:true,json:async()=>({hello:{message:'Hello'}})};
  },StorageManager:{execute:async()=>({focusLock:{}}),reviewPrompt:async()=>false},browser:{
    runtime:{id:'test-extension',getURL:p=>'chrome-extension://test-extension/'+p,
      onMessage:{addListener:fn=>{listener=fn;}},onStartup:event,onInstalled:event},
    alarms:{get:async()=>null,create:async()=>{},clear:async()=>{},onAlarm:event}
  }});
  vm.runInContext(source('background/background.js'),context);
  const request=lang=>new Promise(resolve=>{
    assert.equal(listener({type:'IYT_LOCALE',lang},{id:'test-extension'},resolve),true);
  });
  assert.equal((await request('en')).catalog.hello.message,'Hello');
  assert.equal((await request('en')).ok,true);
  assert.equal(fetched.length,1);
  assert.equal(fetched[0],'chrome-extension://test-extension/_locales/en/messages.json');
  assert.equal((await request('../../manifest')).ok,false);
  assert.equal(listener({type:'IYT_LOCALE',lang:'fr'},{id:'foreign'},()=>assert.fail('Foreign sender accepted')),undefined);
  assert.equal(fetched.length,1);
});

test('schedule evaluation stops retrying after extension context invalidation', async () => {
  let reads=0, timers=0;
  const handlers=[];
  const context=vm.createContext({
    console:{warn(){assert.fail('Invalidated contexts should stop quietly');}},
    document:{documentElement:{},readyState:'complete',addEventListener:(_,fn)=>handlers.push(fn)},
    window:{addEventListener:(_,fn)=>handlers.push(fn)},
    browser:{storage:{onChanged:{addListener:fn=>handlers.push(()=>fn({settings:{}}))}}},
    MutationObserver:class {disconnect(){}},
    StorageManager:{getSettings:async()=>{reads++;throw new Error('Extension context invalidated.');}},
    clearTimeout(){},setTimeout(){timers++;}
  });
  vm.runInContext(source('content/scheduledBlocker.js'),context);
  await new Promise(resolve=>setImmediate(resolve));
  for(const handler of handlers) await handler();
  assert.equal(reads,1);
  assert.equal(timers,0);
});

test('every release archive has fonts, all selectable languages and correct backgrounds', () => {
  const archives={}, fakeFs=Object.create(fs);
  fakeFs.writeFileSync=(file,data)=>archives[file]=data;
  fakeFs.statSync=file=>archives[file]?{size:archives[file].length}:fs.statSync(file);
  const module={exports:{}};
  const context=vm.createContext({require:name=>name==='fs'?fakeFs:require(name),module,__dirname:path.join(root,'scripts'),Buffer,process:{argv:[]},console:{log(){}}});
  vm.runInContext(source('scripts/package.cjs'),context);context.module.exports.packageExtension();
  assert.equal(Object.keys(archives).length,3);
  for(const [file,buffer] of Object.entries(archives)) {
    let offset=0;const entries=new Map();
    while(buffer.readUInt32LE(offset)===0x04034b50) {
      const size=buffer.readUInt32LE(offset+18),nameLength=buffer.readUInt16LE(offset+26),extra=buffer.readUInt16LE(offset+28);
      const name=buffer.subarray(offset+30,offset+30+nameLength).toString();const start=offset+30+nameLength+extra;
      const data=zlib.inflateRawSync(buffer.subarray(start,start+size));
      assert.equal(zlib.crc32(data),buffer.readUInt32LE(offset+14));entries.set(name,data);offset=start+size;
    }
    assert.equal([...entries.keys()].filter(k=>k.startsWith('fonts/')).length,4);
    if (file.includes('edge')) {
      assert.equal([...entries.keys()].filter(k=>k.startsWith('_locales/')).length, 1);
      assert.ok(entries.has('_locales/en/messages.json'));
    } else {
      assert.equal([...entries.keys()].filter(k=>k.startsWith('_locales/')).length, 26);
    }
    const manifest=JSON.parse(entries.get('manifest.json'));
    for (const name of entries.keys()) {
      assert.ok(!/\.(?:md|map)$/.test(name), `Development file shipped: ${name}`);
      assert.ok(!['styles/ui.css','icons/icon-512.png'].includes(name), `Unused asset shipped: ${name}`);
    }
    const runtimePaths = [manifest.action.default_popup, ...Object.values(manifest.icons),
      ...(manifest.background.scripts || []), ...(manifest.background.service_worker ? [manifest.background.service_worker] : []),
      ...manifest.content_scripts.flatMap(script => [...(script.js || []), ...(script.css || [])])];
    for (const name of runtimePaths) assert.ok(entries.has(name), `Missing runtime file: ${name}`);
    for (const name of ['LICENSE', 'licenses/MIT-legacy.txt']) {
      assert.equal(entries.get(name)?.toString(), source(name), `Missing or stale license: ${name}`);
    }
    if(file.includes('firefox')) { assert.ok(manifest.background.scripts); assert.equal(manifest.background.service_worker,undefined); }
    else assert.equal(manifest.background.scripts,undefined);
    for(const match of entries.get('styles/popup.css').toString().matchAll(/url\(['"]?(\.\.\/[^)'"\s]+)/g)) assert.ok(entries.has(path.posix.normalize('styles/'+match[1])),match[1]);
  }
});

test('locale catalogs contain new labels without encoding corruption', () => {
  const english=JSON.parse(source('_locales/en/messages.json'));
  for(const lang of fs.readdirSync(path.join(root,'_locales'))) {
    const catalog=JSON.parse(source(`_locales/${lang}/messages.json`));
    for(const key of Object.keys(english)) assert.ok(catalog[key],`${lang}: ${key}`);
    for(const key of ['scheduled_close_tab','scheduled_blank_screen','action_undo','channel_blocked']) assert.ok(!/^\?+[\s?$1]*$/.test(catalog[key].message),lang);
    for(const key of ['stats_callout_info','stats_tooltip_info','desc_block_shorts']) {
      assert.ok(!/\?/.test(catalog[key].message), `${lang}: ${key} contains damaged text`);
    }
    assert.ok(catalog.extensionName?.message?.length <= 75, `${lang} extensionName exceeds 75 chars: ${catalog.extensionName?.message?.length}`);
    assert.ok(!/[ØÙ]|à[¦¤]|\u00c3[\u00a0-\u00ff]|\u00d0[\u00b0-\u00bf]|\u00ce[\u0090-\u00bf]/.test(catalog.extensionName?.message), `${lang} extensionName has mojibake`);
  }
});

test('new focus messages are translated and retain their time placeholder', () => {
  const english = JSON.parse(source('_locales/en/messages.json'));
  const keys = ['focus_session_title','focus_session_description','focus_session_end','limit_warning_option','limit_warning_title','limit_warning_message','clear_status_off','clear_status_snoozed','clear_status_full','clear_status_strict','clear_status_until','clear_status_session','clear_status_session_paused','clear_status_remaining','clear_status_limit_reached','clear_status_dismissed','popup_chat','popup_comments','popup_home_limited','popup_autoplay','popup_description','popup_filtered','popup_reminders','desc_sidebar_navigation'];
  for (const lang of fs.readdirSync(path.join(root, '_locales'))) {
    const catalog = JSON.parse(source(`_locales/${lang}/messages.json`));
    for (const key of keys) {
      assert.ok(catalog[key]?.message?.trim(), `${lang}: ${key} is empty`);
      assert.ok(!/@@@\d{2}@@@|IYTSEP|__IYT_VALUE__/.test(catalog[key].message), `${lang}: ${key} leaked a translation marker`);
      if (lang !== 'en') assert.notEqual(catalog[key].message, english[key].message, `${lang}: ${key} was not translated`);
    }
    for (const key of ['limit_warning_message','clear_status_snoozed','clear_status_full','clear_status_strict','clear_status_until','clear_status_session','clear_status_session_paused','clear_status_remaining']) {
      assert.ok(catalog[key].message.includes('$value$'), `${lang}: ${key} lost the value placeholder`);
    }
  }
});

function timerHarness(overrides = {}) {
  const env=store(); let settings=Object.assign(env.manager.getDefaultSettings(),overrides);
  let now=0, selectedVideo, timerId=0; const intervals=new Map(), timeouts=new Map(), nodes=new Map(), changes=[];
  function element() {
    return { children:[], style:{}, classList:{add(){},remove(){}}, listeners:{},
      setAttribute(){}, getAttribute(){return null;}, querySelector(){return null;}, closest(){return null;},
      appendChild(child){this.children.push(child);child.parentElement=this;if(child.id)nodes.set(child.id,child);},
      addEventListener(name,fn){(this.listeners[name] ||= new Set()).add(fn);},
      removeEventListener(name,fn){this.listeners[name]?.delete(fn);},
      remove(){if(this.id)nodes.delete(this.id);},
      emit(name){for(const fn of this.listeners[name]||[])fn({stopPropagation(){}});}
    };
  }
  const player=element(),video=Object.assign(element(),{isConnected:true,paused:false,seeking:false,readyState:4,currentTime:0,duration:120,playbackRate:1,ended:false,muted:false,volume:0.7});
  video.closest=()=>player;video.pause=()=>{if(!video.paused){video.paused=true;video.emit('pause');}};video.play=async()=>{video.paused=false;video.emit('playing');};selectedVideo=video;
  const doc={body:element(),addEventListener(){},getElementById:id=>nodes.get(id),createElement:element,
    querySelector:selector=>selector==='#movie_player'?player:selector.includes('video')&&!selector.includes('.ad')?selectedVideo:null};
  const location={pathname:'/watch',search:'?v=one',href:'https://www.youtube.com/watch?v=one'};
  const context=vm.createContext({document:doc,location,window:{location,addEventListener(){}},console,crypto:crypto.webcrypto,URLSearchParams,
    IYT_Policy:env.policy,I18N:{async setLanguage(){},getMessage:(key,subs,fallback)=>fallback,getDirection:()=> 'ltr'},
    StorageManager:{getTodayString:()=>env.manager.getTodayString(),getSettings:async()=>clone(settings),recordWatch:async seconds=>{settings.stats.todayWatchSeconds+=seconds;return clone(settings);}},
    performance:{now:()=>now},getComputedStyle:()=>({position:'relative'}),requestAnimationFrame:fn=>fn(),
    setInterval:fn=>{const id=++timerId;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id),
    setTimeout:fn=>{const id=++timerId;timeouts.set(id,fn);return id;},clearTimeout:id=>timeouts.delete(id),
    browser:{storage:{onChanged:{addListener:fn=>changes.push(fn)}},runtime:{onMessage:{addListener(){}}}}
  });
  vm.runInContext(source('content/timerToast.js'),context);
  return {video,player,nodes,intervals,timeouts,context,location,changes,
    timer:context.window.__iytTimer, settings:()=>settings,
    select(value){selectedVideo=value;},async tick(seconds,mediaSeconds=seconds){now+=seconds*1000;video.currentTime+=mediaSeconds;for(const fn of [...intervals.values()])fn();await Promise.resolve();await Promise.resolve();},
    async change(patch){settings={...settings,...patch};for(const fn of changes)await fn({settings:{newValue:settings}});}
  };
}

test('timer counts elapsed playback when callbacks are delayed, not callback count', async () => {
  const h=timerHarness();await h.timer.attach();await h.tick(12);
  assert.equal(h.settings().stats.todayWatchSeconds,0);
  h.video.pause();assert.equal(h.intervals.size,0);
  assert.equal(h.settings().stats.todayWatchSeconds,12);
  await h.tick(20,0);assert.equal(h.settings().stats.todayWatchSeconds,12);
});

test('watch time syncs every fifteen seconds and every five near the daily limit', async () => {
  const h=timerHarness({dailyLimit:{enabled:true,limitMinutes:60}});
  await h.timer.attach();await h.tick(14);
  assert.equal(h.settings().stats.todayWatchSeconds,0);
  await h.tick(1);assert.equal(h.settings().stats.todayWatchSeconds,15);
  await h.tick(14);assert.equal(h.settings().stats.todayWatchSeconds,15);
  await h.tick(1);assert.equal(h.settings().stats.todayWatchSeconds,30);
  h.timer.detach();
  const near=timerHarness({dailyLimit:{enabled:true,limitMinutes:60,warningEnabled:false}});
  near.settings().stats.todayWatchSeconds=3295;
  await near.timer.attach();await near.tick(4);
  assert.equal(near.settings().stats.todayWatchSeconds,3295);
  await near.tick(1);assert.equal(near.settings().stats.todayWatchSeconds,3300);
  await near.tick(5);assert.equal(near.settings().stats.todayWatchSeconds,3305);
  await near.tick(2);near.timer.detach();
  assert.equal(near.settings().stats.todayWatchSeconds,3307);
});

test('buffering and seeking do not count as playback', async () => {
  const h=timerHarness();await h.timer.attach();h.video.readyState=2;h.video.emit('waiting');
  await h.tick(10,0);assert.equal(h.settings().stats.todayWatchSeconds,0);
  h.video.readyState=4;h.video.emit('playing');await h.tick(5);assert.equal(h.settings().stats.todayWatchSeconds,0);
  h.video.seeking=true;h.video.emit('seeking');await h.tick(10,90);h.video.seeking=false;h.video.emit('seeked');
  await h.tick(5);h.video.pause();assert.equal(h.settings().stats.todayWatchSeconds,10);
});

test('disabled and snoozed timers never pause playback or mount a limit overlay', async () => {
  for(const overrides of [{extensionEnabled:false},{snoozeUntil:Date.now()+60000}]) {
    const h=timerHarness({...overrides,dailyLimit:{enabled:true,limitMinutes:1}});h.settings().stats.todayWatchSeconds=60;
    await h.timer.attach();await h.tick(2);
    assert.equal(h.video.paused,false);assert.equal(h.nodes.has('iyt-limit-overlay'),false);
  }
});

test('finish-video grace survives paused same-player attachment; route change revokes it', async () => {
  const h=timerHarness({dailyLimit:{enabled:true,limitMinutes:1}});await h.timer.attach();await h.tick(61);
  assert.equal(h.video.paused,true);let overlay=h.nodes.get('iyt-limit-overlay');assert.ok(overlay);
  const actions=overlay.children.at(-1);actions.children[0].emit('click');
  assert.equal(h.video.paused,false);h.video.pause();await h.timer.attach();await h.video.play();
  assert.equal(h.video.paused,false);assert.equal(h.nodes.has('iyt-limit-overlay'),false);
  h.location.search='?v=two';await h.timer.attach();assert.equal(h.video.paused,true);assert.ok(h.nodes.has('iyt-limit-overlay'));
});

test('navigation cancels a pending video poll and home cannot acquire a limit overlay', async () => {
  const h=timerHarness({dailyLimit:{enabled:true,limitMinutes:1}});h.select(null);
  const pending=h.timer.attach();h.location.pathname='/';h.timer.detach();h.select(h.video);
  for(const fn of h.timeouts.values())fn();await pending;
  h.settings().stats.todayWatchSeconds=60;await h.change({extensionEnabled:true});
  assert.equal(h.intervals.size,0);assert.equal(h.nodes.has('iyt-limit-overlay'),false);
});

test('unrelated player mutations do not schedule document scans; card changes still filter', () => {
  const s=source('content/blocker.js');
  let observe, filters=0, autoplay=0;
  const context=vm.createContext({
    document:{body:{},addEventListener(){}},
    MutationObserver:class {constructor(fn){observe=fn;}observe(){}},
    _settings:{blockShorts:true,limitHomeFeed:false},isEffectiveActive:()=>true,
    needsCardObservation:()=>true,configureDomObserver(){},
    getCardContainer:node=>node.card || null,
    scheduleHomeFeedLimit(){},
    scheduleFilterScanForNodes:()=>filters++,scheduleAutoplay:()=>autoplay++,scanAllCards(){}
  });
  vm.runInContext(s.slice(s.indexOf('function initDomObserver()'),s.indexOf("if (document.readyState === 'loading')",s.indexOf('function initDomObserver()'))),context);
  context.initDomObserver();
  const player={nodeType:1,closest:()=>null,matches:()=>false};
  for(let i=0;i<1000;i++) observe([{type:'attributes',attributeName:'aria-label',target:player,addedNodes:[]}]);
  assert.equal(filters,0);assert.equal(autoplay,0);
  const card={...player,card:{}};
  observe([{type:'characterData',target:{nodeType:3,parentElement:card},addedNodes:[]}]);
  assert.equal(filters,1);assert.equal(autoplay,0);
  observe([{type:'childList',target:player,addedNodes:[card]}]);
  assert.equal(filters,2);assert.equal(autoplay,1);
});

test('continuous mutations cannot postpone card filtering indefinitely', () => {
  const s=source('content/blocker.js');
  let callback, timers=0;
  const context=vm.createContext({_settings:{enableQuickBlock:true},isEffectiveActive:()=>true,
    setTimeout:fn=>{callback=fn;return ++timers;},clearTimeout:()=>assert.fail('Pending batch must not restart')});
  vm.runInContext(s.slice(s.indexOf('let _filterDebounceTimer'),s.indexOf('function flushPendingFilterNodes')),context);
  let flushed=0;context.flushPendingFilterNodes=()=>flushed++;
  for(let i=0;i<1000;i++) context.scheduleFilterScanForNodes([{nodeType:1,isConnected:true}]);
  assert.equal(timers,1);callback();assert.equal(flushed,1);
});

test('feed nudges stop without progress, retry new cards, and ignore detached grids', () => {
  const s=source('content/blocker.js');
  const pending=[];let resizes=0;
  const grid={isConnected:true};
  const context=vm.createContext({WeakMap,Event,location:{pathname:'/',search:''},
    _settings:{limitHomeFeed:true},isEffectiveActive:()=>true,isHomePage:()=>true,
    setTimeout:fn=>{pending.push(fn);return pending.length;},
    window:{dispatchEvent:()=>resizes++,scrollY:1},document:{querySelector:()=>null}});
  vm.runInContext(s.slice(s.indexOf('let _nudgeTimer'),s.indexOf('function limitHomeFeedEnforce')),context);
  for(let i=0;i<100;i++) {context.triggerScrollerNudge(grid,1);pending.shift()?.();}
  assert.equal(resizes,4,'Only two nudges, each dispatching resize and scroll');
  context.triggerScrollerNudge(grid,2);pending.shift()();assert.equal(resizes,6);
  grid.isConnected=false;
  context.triggerScrollerNudge(grid,2);pending.shift()();assert.equal(resizes,6);
});

test('overlapping navigation scans share bounded deadlines without starvation', () => {
  const s=source('content/blocker.js');let scans=0;
  const callbacks=[];
  const context=vm.createContext({document:{},scanAllCards:()=>scans++,setTimeout:(fn,ms)=>{callbacks.push({fn,ms});return callbacks.length;}});
  vm.runInContext(s.slice(s.indexOf('const _routeFilterTimers'),s.indexOf('let _isApplyingClasses')),context);
  for(let i=0;i<100;i++) {context.scheduleFullFilterScan(80);context.scheduleFullFilterScan(1000);}
  assert.equal(callbacks.length,2);
  callbacks.forEach(({fn})=>fn());assert.equal(scans,2);
  context.scheduleFullFilterScan(80);assert.equal(callbacks.length,3);
});

test('observer follows filtering, autoplay, feed limiting, off and snooze settings', () => {
  const s=source('content/blocker.js');const options=[];let disconnects=0;
  const settings={extensionEnabled:true,enableQuickBlock:false,channelBlocklist:[],keywordBlocklist:[]};
  const context=vm.createContext({_settings:settings,document:{body:{}},
    isEffectiveActive:s=>s.extensionEnabled && !s.snoozeUntil,
    clearTimeout(){},_filterDebounceTimer:1,_pendingFilterNodes:new Set([{}]),_pendingFullFilterScan:true});
  vm.runInContext(s.slice(s.indexOf('let _domObserver'),s.indexOf('function initDomObserver')),context);
  context.observer={disconnect:()=>disconnects++,observe:(_,value)=>options.push(value)};
  vm.runInContext('_domObserver = observer',context);
  context.configureDomObserver();assert.equal(options.length,0);assert.equal(disconnects,1);
  assert.equal(context._pendingFilterNodes.size,0);
  settings.disableAutoplay=true;context.configureDomObserver();
  assert.equal(options.at(-1).attributes,undefined);assert.equal(options.at(-1).childList,true);
  settings.enableQuickBlock=true;context.configureDomObserver();assert.equal(options.at(-1).characterData,true);
  settings.enableQuickBlock=false;settings.keywordBlocklist=['test'];context.configureDomObserver();
  assert.equal(options.length,2,'Same observation mode must not reconnect and discard queued records');
  settings.extensionEnabled=false;context.configureDomObserver();assert.equal(disconnects,4);
  settings.extensionEnabled=true;context.configureDomObserver();assert.equal(options.length,3);
  settings.snoozeUntil=123;context.configureDomObserver();assert.equal(disconnects,6);
  settings.snoozeUntil=null;settings.keywordBlocklist=[];settings.disableAutoplay=false;settings.limitHomeFeed=true;
  context.configureDomObserver();assert.equal(options.at(-1).attributes,undefined);
});

test('large mutation bursts release queued DOM references and still run filtering', () => {
  const s=source('content/blocker.js');
  let callback, scans=0;
  const context=vm.createContext({_settings:{enableQuickBlock:true},isEffectiveActive:()=>true,document:{},
    setTimeout:fn=>{callback=fn;return 1;},scanAllCards:()=>scans++});
  vm.runInContext(s.slice(s.indexOf('let _filterDebounceTimer'),s.indexOf('const _routeFilterTimers')),context);
  for(let i=0;i<10000;i++) context.scheduleFilterScanForNodes([{nodeType:1,isConnected:true}]);
  assert.equal(vm.runInContext('_pendingFilterNodes.size',context),0);
  callback();assert.equal(scans,1);
  assert.equal(vm.runInContext('_pendingFullFilterScan',context),false);
  context.scheduleFilterScanForNodes([{nodeType:1,isConnected:false}]);
  callback();assert.equal(scans,1);
});

test('dialog releases removed page sections and cleans up if its overlay disappears', () => {
  let notify, disconnected=0;
  const previous={isConnected:true,getClientRects:()=>[],focus(){}};
  const sibling={isConnected:true,inert:false};
  const body={children:[]};
  const overlay={isConnected:true,parentElement:body,setAttribute(){},hasAttribute:()=>true,
    querySelectorAll:()=>[],focus(){}};
  body.children=[overlay,sibling];
  const context=vm.createContext({document:{body,documentElement:{},activeElement:previous,addEventListener(){}},
    MutationObserver:class {constructor(fn){notify=fn;}observe(){}disconnect(){disconnected++;}}});
  vm.runInContext(source('utils/dialog.js'),context);
  context.IYT_Dialog.open(overlay);assert.equal(sibling.inert,true);
  sibling.isConnected=false;body.children=[overlay];notify();
  assert.equal(sibling.inert,false);
  // Once released, closing the dialog must no longer mutate this old node.
  sibling.inert=true;
  const before=disconnected;overlay.isConnected=false;notify();
  assert.equal(disconnected,before+1);assert.equal(sibling.inert,true);
});

test('navigation handles invalidated storage and timer promises and stops retrying', async () => {
  for (const failure of ['storage','timer']) {
    let reads=0,detaches=0,timers=0;
    const events=[];
    const context=vm.createContext({
      console:{warn(){assert.fail('Expected invalidation should stop quietly');}},
      location:{pathname:failure==='storage'?'/feed/subscriptions':'/watch',search:''},
      document:{readyState:'complete',addEventListener:(_,fn)=>events.push(fn)},
      window:{addEventListener:(_,fn)=>events.push(fn),
        __iytBlocker:{applyAllSettings:async()=>{reads++;if(failure==='storage')throw new Error('Extension context invalidated.');}},
        __iytTimer:{detach:()=>detaches++,attach:async()=>{throw new Error('Extension context invalidated.');}}},
      setTimeout:()=>++timers,clearTimeout(){}
    });
    vm.runInContext(source('content/youtubeObserver.js'),context);
    await new Promise(resolve=>setImmediate(resolve));
    for(const event of events) event();
    assert.equal(reads,1);assert.ok(detaches>=1);assert.equal(timers,0);
  }
});

test('watch tracking stops after invalidation without retrying or restarting playback timers', async () => {
  const h=timerHarness();
  let requests=0;
  h.context.StorageManager.recordWatch=()=>{requests++;throw new Error('Extension context invalidated.');};
  await h.timer.attach();await h.tick(15);
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(requests,1);assert.equal(h.intervals.size,0);assert.equal(h.timeouts.size,0);
  await h.timer.attach();h.video.emit('playing');await h.tick(10);
  assert.equal(requests,1);assert.equal(h.intervals.size,0);
});

test('invalidated locale messaging stops further requests for both sync and async failures', async () => {
  for(const asynchronous of [false,true]) {
    let requests=0;
    const context=vm.createContext({console:{warn(){assert.fail('Expected invalidation should stop quietly');}},
      browser:{runtime:{sendMessage(){requests++;const error=new Error('Extension context invalidated.');
        if(asynchronous)return Promise.reject(error);throw error;}},i18n:{getMessage:()=>''}}});
    vm.runInContext(source('utils/i18n.js'),context);
    await context.I18N.setLanguage('auto');await context.I18N.setLanguage('fr');
    assert.equal(requests,1);
    assert.equal(context.I18N.getMessage('missing',null,'Fallback'),'Fallback');
  }
});

test('popup invalidation recovery tells the user to reopen without retrying storage', () => {
  let handler, message, prevented=false;
  const s=source('ui/popup.js');
  const context=vm.createContext({window:{addEventListener:(_,fn)=>handler=fn},
    showToast:text=>message=text,StorageManager:{getSettings:()=>assert.fail('Must not retry a dead context')}});
  vm.runInContext(s.slice(s.indexOf("window.addEventListener('unhandledrejection'"),s.indexOf('function renderPendingUnlockBanner')),context);
  handler({reason:new Error('Extension context invalidated.'),preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.match(message,/reopen/);
});

test('channel matches are exact and do not inherit page ownership', () => {
  const s=source('content/blocker.js');
  const code=s.slice(s.indexOf('function cleanChannelText'),s.indexOf('function getCardTitle'))+s.slice(s.indexOf('function matchesChannel'),s.indexOf('function matchesKeyword'));
  const context=vm.createContext({});vm.runInContext(code,context);
  assert.equal(context.matchesChannel({names:['ScienceDaily'],handles:[]},['Science'],null),false);
  assert.equal(context.matchesChannel({names:['Science'],handles:[]},['Science'],null),true);
  assert.equal(context.matchesChannel({names:['Other'],handles:[]},['Science'],{name:'Science'}),false);
});


test('mix playlist blocking suppresses radio cards, shelves, lockups and dynamic feeds via zero-flash CSS', () => {
  const css = source('styles/blocker.css');
  const js = source('content/blocker.js');

  // Verify CSS contains comprehensive high-specificity rules for iyt-no-mix-playlists
  const mixSection = css.slice(css.indexOf('MIX / RADIO PLAYLISTS'), css.indexOf('MERCH / TICKETS / OFFERS'));
  assert.ok(mixSection.includes('display: none !important;'));

  // Dedicated radio elements
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-radio-renderer'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-compact-radio-renderer'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-grid-radio-renderer'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytm-radio-renderer'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytm-compact-radio-renderer'));

  // Feed items & lockups with list=RD or start_radio=1
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-rich-item-renderer:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-rich-item-renderer:has(a[href*="start_radio=1"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-compact-video-renderer:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists yt-lockup-view-model:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-video-renderer:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-playlist-renderer:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists ytd-rich-section-renderer:has(a[href*="list=RD"])'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists .ytp-videowall-still[data-is-mix="true"]'));
  assert.ok(mixSection.includes('html.iyt-no-mix-playlists .ytp-ce-element:has(a[href*="list=RD"])'));

  // Blocker.js card container registration
  assert.ok(js.includes("'ytd-compact-radio-renderer'"));
  assert.ok(js.includes("'ytd-grid-radio-renderer'"));
});

test('end screen card blocking suppresses recommendation cards without blurring video player', () => {
  const css = source('styles/blocker.css');

  // Verify CSS contains targeted selectors for iyt-no-endscreen-cards without dangerous generic wildcards
  assert.ok(!css.includes('html.iyt-no-endscreen-cards [class*="ytp-ce-"]'));
  assert.ok(css.includes('html.iyt-no-endscreen-cards .ytp-ce-element'));
  assert.ok(css.includes('html.iyt-no-endscreen-cards .ytp-ce-video'));
  assert.ok(css.includes('html.iyt-no-endscreen-cards .ytp-ce-playlist'));

  // Verify blur prevention and backdrop-filter reset rules are present
  assert.ok(css.includes('backdrop-filter: blur(0px) !important;'));
  assert.ok(css.includes('html.iyt-no-endscreen-cards video'));
  assert.ok(css.includes('html.iyt-no-endscreen-cards .ytp-player-content'));
});


test('multi-creator collab cards extract all anchor hrefs matching /@ and /channel/ across metadata and avatars and filter correctly', () => {
  const s = source('content/blocker.js');
  const code = s.slice(s.indexOf('function cleanChannelText'), s.indexOf('function getCurrentPageChannelInfo')) +
    s.slice(s.indexOf('function matchesChannel'), s.indexOf('function matchesKeyword'));
  const context = vm.createContext({ decodeURIComponent });
  vm.runInContext(code, context);

  // 1. Multi-creator collab card with avatar links, metadata byline links, and a video title link
  const avatarLink1 = {
    getAttribute: attr => attr === 'href' ? '/@CreatorA' : (attr === 'title' ? 'Creator A' : null),
    textContent: '',
    closest: sel => sel.includes('#avatar-link')
  };
  const avatarLink2 = {
    getAttribute: attr => attr === 'href' ? '/channel/UCCollaborator2' : (attr === 'aria-label' ? "Go to Creator B's channel" : null),
    textContent: '',
    closest: sel => sel.includes('#avatar-link')
  };
  const bylineTextContainer = {
    getAttribute: () => null,
    textContent: 'Creator A and Creator B',
    closest: () => null
  };
  const bylineLink1 = {
    getAttribute: attr => attr === 'href' ? 'https://www.youtube.com/@CreatorA' : null,
    textContent: 'Creator A',
    closest: sel => sel.includes('#channel-name')
  };
  const bylineLink2 = {
    getAttribute: attr => attr === 'href' ? '/@CreatorB' : null,
    textContent: 'Creator B',
    closest: sel => sel.includes('#channel-name')
  };
  const videoTitleLink = {
    getAttribute: attr => attr === 'href' ? '/watch?v=12345' : (attr === 'title' ? 'Mega Collab Video' : null),
    textContent: 'Mega Collab Video',
    closest: () => null
  };

  const card = {
    nodeType: 1,
    querySelectorAll: selector => {
      if (selector.includes('media-item-byline')) {
        return [bylineTextContainer, bylineLink1, bylineLink2];
      }
      return [avatarLink1, avatarLink2, bylineLink1, bylineLink2, videoTitleLink];
    }
  };

  const info = context.getCardChannelInfo(card);

  // Assert all handles and channel IDs are extracted across metadata and avatar links
  assert.ok(info.handles.includes('@creatora'), 'Must include @creatora');
  assert.ok(info.handles.includes('creatora'), 'Must include creatora');
  assert.ok(info.handles.includes('@creatorb'), 'Must include @creatorb');
  assert.ok(info.handles.includes('creatorb'), 'Must include creatorb');
  assert.ok(info.ids.includes('uccollaborator2'), 'Must include uccollaborator2');

  // Assert display names are captured without leaking video titles
  assert.ok(info.names.includes('Creator A and Creator B'));
  assert.ok(info.names.includes('Creator A'));
  assert.ok(info.names.includes('Creator B'));
  assert.ok(!info.names.includes('Mega Collab Video'), 'Video title must not leak into channel names');

  // Assert matchesChannel blocks when any creator is in channelBlocklist
  assert.equal(context.matchesChannel(info, ['@creatorb'], null), true, 'Block by collaborator handle');
  assert.equal(context.matchesChannel(info, ['creatora'], null), true, 'Block by uploader handle without @');
  assert.equal(context.matchesChannel(info, ['UCCollaborator2'], null), true, 'Block by collaborator channel ID');
  assert.equal(context.matchesChannel(info, ['/channel/UCCollaborator2'], null), true, 'Block by collaborator channel URL');
  assert.equal(context.matchesChannel(info, ['Creator B'], null), true, 'Block by collaborator display name');
  assert.equal(context.matchesChannel(info, ['@othercreator'], null), false, 'Unrelated channel must not match');

  // 2. Collab popover card where visible text string is "Creator A and 1 other"
  const popoverCard = {
    nodeType: 1,
    querySelectorAll: selector => {
      if (selector.includes('media-item-byline')) {
        return [{ getAttribute: () => null, textContent: 'Creator A and 1 other', closest: () => null }];
      }
      return [
        { getAttribute: attr => attr === 'href' ? '/@CreatorA' : null, textContent: 'Creator A', closest: sel => sel.includes('#byline') },
        { getAttribute: attr => attr === 'href' ? '/@HiddenCollab' : null, textContent: '', closest: sel => sel.includes('ytd-collaborations-badge-renderer') }
      ];
    }
  };

  const popoverInfo = context.getCardChannelInfo(popoverCard);
  assert.ok(popoverInfo.handles.includes('@hiddencollab'), 'Collab popover link handle must be extracted');
  assert.equal(context.matchesChannel(popoverInfo, ['@hiddencollab'], null), true, 'Popover collaborator must trigger block');
});


test('daily reset hour shifts activity day boundary so late-night sessions belong to previous day quota', () => {
  const getToday = store().manager.getTodayString;

  // With 4:00 AM reset (Night Owl default):
  const lateNight1145PM = new Date(2026, 9, 31, 23, 45, 0).getTime();
  const pastMidnight130AM = new Date(2026, 10, 1, 1, 30, 0).getTime();
  const earlyMorning359AM = new Date(2026, 10, 1, 3, 59, 59).getTime();
  const resetMorning400AM = new Date(2026, 10, 1, 4, 0, 0).getTime();
  const morning800AM = new Date(2026, 10, 1, 8, 0, 0).getTime();

  assert.equal(getToday(4, lateNight1145PM), '2026-10-31', '11:45 PM is Oct 31');
  assert.equal(getToday(4, pastMidnight130AM), '2026-10-31', '1:30 AM is still Oct 31 quota (no midnight refill)');
  assert.equal(getToday(4, earlyMorning359AM), '2026-10-31', '3:59:59 AM is still Oct 31 quota');
  assert.equal(getToday(4, resetMorning400AM), '2026-11-01', '4:00:00 AM flips to Nov 01 fresh budget');
  assert.equal(getToday(4, morning800AM), '2026-11-01', '8:00 AM is Nov 01');

  // With 0:00 (Midnight reset):
  assert.equal(getToday(0, lateNight1145PM), '2026-10-31', 'Midnight mode: 11:45 PM is Oct 31');
  assert.equal(getToday(0, pastMidnight130AM), '2026-11-01', 'Midnight mode: 1:30 AM is Nov 01');

  // Background alarm next-reset calculation:
  const bg = source('background/background.js');
  const context = vm.createContext({});
  vm.runInContext(bg.slice(bg.indexOf('function getNextResetTime'), bg.indexOf('function scheduleDeadlines')), context);
  const getNextReset = context.getNextResetTime;

  // At 11:45 PM on Oct 31, next 4:00 AM is tomorrow morning (Nov 1 4:00 AM)
  const nextFromNight = getNextReset(4, new Date(2026, 9, 31, 23, 45, 0));
  assert.equal(nextFromNight, new Date(2026, 10, 1, 4, 0, 0).getTime());

  // At 1:30 AM on Nov 1, next 4:00 AM is same day morning (Nov 1 4:00 AM)
  const nextFromEarlyMorning = getNextReset(4, new Date(2026, 10, 1, 1, 30, 0));
  assert.equal(nextFromEarlyMorning, new Date(2026, 10, 1, 4, 0, 0).getTime());

  // At 4:00:01 AM on Nov 1, next 4:00 AM is next morning (Nov 2 4:00 AM)
  const nextFromPastReset = getNextReset(4, new Date(2026, 10, 1, 4, 0, 1));
  assert.equal(nextFromPastReset, new Date(2026, 10, 2, 4, 0, 0).getTime());

  // At 11:45 PM on Oct 31 in midnight mode (resetHour = 0), next reset is midnight Nov 1
  const nextMidnight = getNextReset(0, new Date(2026, 9, 31, 23, 45, 0));
  assert.equal(nextMidnight, new Date(2026, 10, 1, 0, 0, 0).getTime());
});


test('miniplayer keeps timer attached and accumulating time when browsing away from /watch', async () => {
  const env = store();
  let settings = env.manager.getDefaultSettings();
  let now = 0, timerId = 0;
  const intervals = new Map(), nodes = new Map();

  function element() {
    return {
      children: [], style: {}, classList: { add() {}, remove() {} }, listeners: {},
      setAttribute() {}, getAttribute() { return null; }, querySelector() { return null; }, closest() { return null; },
      appendChild(child) { this.children.push(child); child.parentElement = this; if (child.id) nodes.set(child.id, child); },
      addEventListener(name, fn) { (this.listeners[name] ||= new Set()).add(fn); },
      removeEventListener(name, fn) { this.listeners[name]?.delete(fn); },
      remove() { if (this.id) nodes.delete(this.id); },
      emit(name) { for (const fn of this.listeners[name] || []) fn({ stopPropagation() {} }); }
    };
  }

  const player = element(), video = Object.assign(element(), {
    isConnected: true, paused: false, seeking: false, readyState: 4, currentTime: 0, duration: 120, playbackRate: 1, ended: false, muted: false, volume: 0.7
  });
  video.closest = () => player;
  video.pause = () => { if (!video.paused) { video.paused = true; video.emit('pause'); } };
  video.play = async () => { video.paused = false; video.emit('play'); video.emit('playing'); };

  let miniplayerActive = true;
  const doc = {
    body: element(), addEventListener() {}, getElementById: id => nodes.get(id), createElement: element,
    querySelector: selector => {
      if (selector === '#movie_player') return player;
      if (selector.includes('ytd-miniplayer[active] video')) return miniplayerActive ? video : null;
      if (selector.includes('video') && !selector.includes('.ad')) return video;
      return null;
    }
  };

  const location = { pathname: '/', search: '', href: 'https://www.youtube.com/' };
  const context = vm.createContext({
    document: doc, location, window: { location, addEventListener() {} }, navigator: {}, console, crypto: crypto.webcrypto, URLSearchParams,
    IYT_Policy: env.policy, I18N: { async setLanguage() {}, getMessage: (k, s, f) => f, getDirection: () => 'ltr' },
    StorageManager: { getTodayString: () => env.manager.getTodayString(), getSettings: async () => clone(settings), recordWatch: async seconds => { settings.stats.todayWatchSeconds += seconds; return clone(settings); }, updateNestedSetting: async () => {} },
    performance: { now: () => now }, getComputedStyle: () => ({ position: 'relative' }), requestAnimationFrame: fn => fn(),
    setInterval: fn => { const id = ++timerId; intervals.set(id, fn); return id; }, clearInterval: id => intervals.delete(id),
    setTimeout: fn => { const id = ++timerId; return id; }, clearTimeout() {},
    browser: { storage: { onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} } } }
  });

  vm.runInContext(source('content/timerToast.js'), context);
  const timer = context.window.__iytTimer;

  // Even though pathname is '/', active miniplayer allows attachment
  await timer.attach();
  now += 15000; video.currentTime += 15;
  for (const fn of [...intervals.values()]) fn();
  await Promise.resolve(); await Promise.resolve();

  video.pause();
  assert.equal(settings.stats.todayWatchSeconds, 15, 'Miniplayer video on home page accurately accumulated 15 seconds');

  // When miniplayer closes, next tick cleanly detaches
  miniplayerActive = false;
  video.paused = false;
  video.emit('play');
  now += 1000;
  for (const fn of [...intervals.values()]) fn();
  assert.equal(intervals.size, 0, 'Closing miniplayer on non-watch page cleanly detached playback timer');
});

test('limit overlay exits picture-in-picture, hijacks mediaSession play, and forces immediate pause on media keys', async () => {
  const env = store();
  let settings = Object.assign(env.manager.getDefaultSettings(), { dailyLimit: { enabled: true, limitMinutes: 1 } });
  let now = 0, timerId = 0, inPip = false;
  const intervals = new Map(), nodes = new Map(), docListeners = {};

  function element() {
    return {
      children: [], style: {}, classList: { add() {}, remove() {} }, listeners: {},
      setAttribute() {}, getAttribute() { return null; }, querySelector() { return null; }, closest() { return null; },
      appendChild(child) { this.children.push(child); child.parentElement = this; if (child.id) nodes.set(child.id, child); },
      addEventListener(name, fn) { (this.listeners[name] ||= new Set()).add(fn); },
      removeEventListener(name, fn) { this.listeners[name]?.delete(fn); },
      remove() { if (this.id) nodes.delete(this.id); },
      emit(name) { for (const fn of this.listeners[name] || []) fn({ stopPropagation() {} }); }
    };
  }

  const player = element(), video = Object.assign(element(), {
    isConnected: true, paused: false, seeking: false, readyState: 4, currentTime: 0, duration: 120, playbackRate: 1, ended: false, muted: false, volume: 0.7
  });
  video.closest = () => player;
  video.pause = () => { if (!video.paused) { video.paused = true; video.emit('pause'); } };
  video.play = async () => { video.paused = false; video.emit('play'); video.emit('playing'); };

  const doc = {
    body: element(),
    addEventListener(name, fn) { (docListeners[name] ||= new Set()).add(fn); },
    removeEventListener(name, fn) { docListeners[name]?.delete(fn); },
    getElementById: id => nodes.get(id), createElement: element,
    querySelector: selector => selector === '#movie_player' ? player : selector.includes('video') ? video : null,
    get pictureInPictureElement() { return inPip ? video : null; },
    exitPictureInPicture: async () => { inPip = false; },
    emit(name) { for (const fn of docListeners[name] || []) fn({ stopPropagation() {} }); }
  };

  const mediaSession = {
    handlers: {}, playbackState: 'none',
    setActionHandler(action, handler) { this.handlers[action] = handler; }
  };

  const location = { pathname: '/watch', search: '?v=test', href: 'https://www.youtube.com/watch?v=test' };
  const context = vm.createContext({
    document: doc, location, window: { location, addEventListener() {} }, navigator: { mediaSession }, console, crypto: crypto.webcrypto, URLSearchParams,
    IYT_Policy: env.policy, I18N: { async setLanguage() {}, getMessage: (k, s, f) => f, getDirection: () => 'ltr' },
    StorageManager: { getTodayString: () => env.manager.getTodayString(), getSettings: async () => clone(settings), recordWatch: async seconds => { settings.stats.todayWatchSeconds += seconds; return clone(settings); }, updateNestedSetting: async () => {} },
    performance: { now: () => now }, getComputedStyle: () => ({ position: 'relative' }), requestAnimationFrame: fn => fn(),
    setInterval: fn => { const id = ++timerId; intervals.set(id, fn); return id; }, clearInterval: id => intervals.delete(id),
    setTimeout: fn => { const id = ++timerId; return id; }, clearTimeout() {},
    browser: { storage: { onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} } } }
  });

  vm.runInContext(source('content/timerToast.js'), context);
  const timer = context.window.__iytTimer;

  // Set 55 seconds elapsed, attach and watch 6s to hit 1-minute daily limit
  settings.stats.todayWatchSeconds = 55;
  await timer.attach();
  inPip = true;
  assert.equal(doc.pictureInPictureElement, video, 'PiP was active before limit triggered');

  now += 6000; video.currentTime += 6;
  for (const fn of [...intervals.values()]) fn();
  await Promise.resolve(); await Promise.resolve();

  // 1. Overlay mounted and PiP automatically exited
  assert.ok(nodes.has('iyt-limit-overlay'), 'Limit overlay is mounted');
  assert.equal(doc.pictureInPictureElement, null, 'Picture-in-picture was forced to exit');

  // 2. MediaSession play action hijacked and set to paused
  assert.equal(mediaSession.playbackState, 'paused', 'MediaSession playback state set to paused');
  assert.equal(typeof mediaSession.handlers['play'], 'function', 'MediaSession play handler hijacked');

  // 3. Hardware media keys pressing Play are trapped and pause video
  video.paused = false;
  mediaSession.handlers['play']();
  assert.equal(video.paused, true, 'Hardware media key play handler immediately paused playback');

  // 4. Video play event while limit overlay is active immediately pauses
  video.paused = false;
  video.emit('play');
  assert.equal(video.paused, true, 'Video play event listener immediately paused playback while limit overlay is active');

  // 5. Subsequent attempts to re-enter PiP while overlay is active are trapped
  inPip = true;
  doc.emit('enterpictureinpicture');
  assert.equal(doc.pictureInPictureElement, null, 'enterpictureinpicture listener forced immediate exit');

  // 6. Finishing the video clears mediaSession hijacking
  const overlay = nodes.get('iyt-limit-overlay');
  const finishBtn = overlay.children[3].children[0];
  finishBtn.emit('click');
  assert.equal(mediaSession.handlers['play'], null, 'MediaSession handler restored after finish video selected');
});

test('disableHoverPreviews suppresses video previews via zero-flash CSS and prevents preview playback', () => {
  const css = source('styles/blocker.css');
  assert.ok(css.includes('html.iyt-no-hover-previews ytd-video-preview'), 'CSS contains high-specificity iyt-no-hover-previews selector');
  assert.ok(css.includes('display: none !important'), 'CSS contains display: none !important');
  assert.ok(css.includes('pointer-events: none !important'), 'CSS contains pointer-events: none !important');

  const env = store();
  assert.equal(env.manager.getDefaultSettings().disableHoverPreviews, false, 'disableHoverPreviews defaults to false');
  assert.equal(env.manager.getInitialSettings().disableHoverPreviews, false, 'disableHoverPreviews is false on fresh install');

  // Blocker CLASS_MAP check
  const blockerSource = source('content/blocker.js');
  const context = vm.createContext({
    browser: { storage: { onChanged: { addListener() {} } }, runtime: { onMessage: { addListener() {} } } },
    document: { documentElement: { toggleAttribute() {}, setAttribute() {}, removeAttribute() {}, classList: { toggle() {} } }, addEventListener() {} },
    window: { location: { pathname: '/' } },
    IYT_Policy: env.policy
  });
  vm.runInContext(blockerSource.slice(0, blockerSource.indexOf('const html =')), context);
  assert.equal(vm.runInContext('CLASS_MAP', context).disableHoverPreviews, 'iyt-no-hover-previews');
});

test('custom homeRedirect navigates / to Subscriptions, Watch Later, or History when home feed is blocked', async () => {
  const env = store();
  const defaults = env.manager.getDefaultSettings();
  assert.equal(defaults.homeRedirect, 'none', 'defaults to none');

  const valid = env.validate({ ...defaults, homeRedirect: 'subscriptions' });
  assert.equal(valid.homeRedirect, 'subscriptions');

  assert.throws(() => {
    env.validate({ ...defaults, homeRedirect: 'invalid_destination' });
  }, /Invalid setting: homeRedirect/);

  for (const { pathname, search, blockHomeFeed, homeRedirect, snoozeUntil, expectedRedirect, desc } of [
    { pathname: '/', search: '', blockHomeFeed: true, homeRedirect: 'subscriptions', expectedRedirect: '/feed/subscriptions', desc: 'redirects / to subscriptions when blockHomeFeed is true' },
    { pathname: '/', search: '', blockHomeFeed: true, homeRedirect: 'watchLater', expectedRedirect: '/playlist?list=WL', desc: 'redirects / to watchLater when blockHomeFeed is true' },
    { pathname: '/', search: '', blockHomeFeed: true, homeRedirect: 'history', expectedRedirect: '/feed/history', desc: 'redirects / to history when blockHomeFeed is true' },
    { pathname: '/', search: '', blockHomeFeed: true, homeRedirect: 'none', expectedRedirect: null, desc: 'does not redirect when homeRedirect is none' },
    { pathname: '/', search: '', blockHomeFeed: false, homeRedirect: 'subscriptions', expectedRedirect: null, desc: 'does not redirect when blockHomeFeed is false' },
    { pathname: '/feed/subscriptions', search: '', blockHomeFeed: true, homeRedirect: 'subscriptions', expectedRedirect: null, desc: 'does not redirect when already on destination' },
    { pathname: '/', search: '', blockHomeFeed: true, homeRedirect: 'subscriptions', snoozeUntil: Date.now() + 60000, expectedRedirect: null, desc: 'does not redirect when snoozed' }
  ]) {
    let replacedWith = null;
    const location = { pathname, search, replace(url) { replacedWith = url; } };
    const events = [];
    const context = vm.createContext({
      location,
      document: { readyState: 'complete', addEventListener: (_, fn) => events.push(fn), querySelector: () => null },
      window: { addEventListener: (_, fn) => events.push(fn), __iytBlocker: { applyAllSettings: async () => {} }, __iytTimer: { detach() {}, attach: async () => {} } },
      StorageManager: {
        getSettings: async () => ({
          extensionEnabled: true,
          blockHomeFeed,
          homeRedirect,
          snoozeUntil: snoozeUntil || null
        })
      },
      IYT_Policy: env.policy,
      setTimeout: () => 1,
      clearTimeout() {},
      console
    });

    vm.runInContext(source('content/youtubeObserver.js'), context);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(replacedWith, expectedRedirect, desc);
  }

  // SPA navigation via yt-navigate-start
  let spaReplaced = null;
  const spaEvents = {};
  const spaContext = vm.createContext({
    location: { pathname: '/feed/subscriptions', search: '', replace(url) { spaReplaced = url; } },
    document: { readyState: 'complete', addEventListener: (name, fn) => { spaEvents[name] = fn; }, querySelector: () => null },
    window: { addEventListener: () => {}, __iytBlocker: { applyAllSettings: async () => {} }, __iytTimer: { detach() {}, attach: async () => {} } },
    StorageManager: {
      getSettings: async () => ({
        extensionEnabled: true,
        blockHomeFeed: true,
        homeRedirect: 'watchLater'
      })
    },
    IYT_Policy: env.policy,
    setTimeout: () => 1,
    clearTimeout() {},
    console
  });
  vm.runInContext(source('content/youtubeObserver.js'), spaContext);
  await new Promise(resolve => setImmediate(resolve));

  spaContext.location.pathname = '/';
  spaEvents['yt-navigate-start']({ detail: { url: '/' } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(spaReplaced, '/playlist?list=WL', 'SPA navigation to / triggers redirect to watchLater');
});
