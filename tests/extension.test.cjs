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

function store(initial = {}) {
  const state = clone(initial), writes = [];
  const browser = { storage: { local: {
    async get(keys) { return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, clone(state[k])])); },
    async set(values) { writes.push(clone(values)); Object.assign(state, clone(values)); }
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

test('focus sessions persist, expire, and leave saved preferences and schedules intact', async () => {
  const env = store();
  await env.manager.updateSettings({ extensionEnabled: false, blockComments: false });
  await env.manager.snooze(15);
  const started = await env.manager.startFocusSession(25);
  assert.equal(started.extensionEnabled, true);
  assert.equal(started.snoozeUntil, null);
  assert.equal(started.blockComments, false);
  assert.equal(env.policy.effective(started).blockComments, true);
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
  for (const input of [{scheduledBlocking:{schedules:'bad'}},{channelBlocklist:[42]},{dailyLimit:{limitMinutes:-1}},{blockComments:'yes'},{unknown:true},{scheduledBlocking:{schedules:[{id:'"<input>',label:'x',enabled:true,days:[1],startTime:'09:00',endTime:'17:00',mode:'full'}]}}]) {
    assert.throws(()=>env.manager.importSettings(input),/Invalid setting/);
  }
  assert.equal(JSON.stringify(env.state),before);
});

test('portable backups remove PIN, deadlines, snooze and usage', () => {
  const env=store(), s=env.manager.getDefaultSettings();
  s.focusLock.pin='a'.repeat(64);s.focusLock.enabled=true;s.focusLock.pendingUnlock={unlocksAt:1};s.snoozeUntil=123;s.stats.todayWatchSeconds=30;
  const result=env.validate(s,true);assert.equal(result.focusLock.pin,null);assert.equal(result.focusLock.enabled,false);assert.equal(result.snoozeUntil,null);assert.equal(result.stats.todayWatchSeconds,0);
});

test('Focus Lock rejects every audited weakening path centrally', async () => {
  const env=store(),m=env.manager;
  const schedule={id:'work',label:'Work',enabled:true,days:[1],startTime:'09:00',endTime:'17:00',mode:'full'};
  await m.updateSettings({dailyLimit:{enabled:true,limitMinutes:30},scheduledBlocking:{enabled:true,schedules:[schedule]},channelBlocklist:['science']});
  await locked(env);
  const commands=[
    {op:'nested',parentKey:'dailyLimit',childKey:'limitMinutes',value:60},
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
  const env=store();await locked(env);
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
  },StorageManager:{execute:async()=>({focusLock:{}})},browser:{
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
    assert.ok(catalog.extensionName?.message?.length <= 75, `${lang} extensionName exceeds 75 chars: ${catalog.extensionName?.message?.length}`);
    assert.ok(!/[ØÙ]|à[¦¤]|\u00c3[\u00a0-\u00ff]|\u00d0[\u00b0-\u00bf]|\u00ce[\u0090-\u00bf]/.test(catalog.extensionName?.message), `${lang} extensionName has mojibake`);
  }
});

test('new focus messages are translated and retain their time placeholder', () => {
  const english = JSON.parse(source('_locales/en/messages.json'));
  const keys = ['focus_session_title','focus_session_description','focus_session_end','limit_warning_option','limit_warning_title','limit_warning_message','clear_status_active','clear_status_off','clear_status_snoozed','clear_status_full','clear_status_strict','clear_status_until','clear_status_session','clear_status_session_paused','clear_status_remaining','clear_status_limit_reached','clear_status_dismissed'];
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
  let observe, filters=0, shorts=0, autoplay=0;
  const context=vm.createContext({
    document:{body:{},addEventListener(){}},
    MutationObserver:class {constructor(fn){observe=fn;}observe(){}},
    _settings:{blockShorts:true,limitHomeFeed:false},isEffectiveActive:()=>true,
    getCardContainer:node=>node.card || null,
    scheduleShortsPurge:()=>shorts++,scheduleHomeFeedLimit(){},
    scheduleFilterScanForNodes:()=>filters++,scheduleAutoplay:()=>autoplay++,scanAllCards(){}
  });
  vm.runInContext(s.slice(s.indexOf('function initDomObserver()'),s.indexOf("if (document.readyState === 'loading')",s.indexOf('function initDomObserver()'))),context);
  context.initDomObserver();
  const player={nodeType:1,closest:()=>null,matches:()=>false};
  for(let i=0;i<1000;i++) observe([{type:'attributes',attributeName:'aria-label',target:player,addedNodes:[]}]);
  assert.equal(filters,0);assert.equal(shorts,0);assert.equal(autoplay,0);
  const card={...player,card:{}};
  observe([{type:'characterData',target:{nodeType:3,parentElement:card},addedNodes:[]}]);
  assert.equal(filters,1);assert.equal(shorts,0);assert.equal(autoplay,0);
  observe([{type:'childList',target:player,addedNodes:[card]}]);
  assert.equal(filters,2);assert.equal(shorts,1);assert.equal(autoplay,1);
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
