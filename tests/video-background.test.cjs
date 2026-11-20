const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const VIDEO = 'abcdefghijk';
const WATCH = `https://www.youtube.com/watch?v=${VIDEO}`;
const AWAY = 'https://www.youtube.com/watch?v=zyxwvutsrqp';
const NOW = new Date('2026-11-20T12:00:00Z').getTime();
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function background(initial = {}) {
  const state = structuredClone(initial);
  const alarms = new Map();
  const tabs = new Map([[1, { id: 1, url: WATCH }], [2, { id: 2, url: WATCH }]]);
  const errors = [];
  const event = () => {
    const listeners = [];
    return {
      addListener: listener => listeners.push(listener),
      emit: (...args) => Promise.all(listeners.map(listener => listener(...args)))
    };
  };
  const browser = {
    storage: { local: {
      async get(keys) {
        return Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, structuredClone(state[key])]));
      },
      async set(values) { Object.assign(state, structuredClone(values)); },
      async remove(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) delete state[key]; }
    } },
    tabs: {
      async get(id) {
        if (!tabs.has(id)) throw new Error('No such tab');
        return structuredClone(tabs.get(id));
      },
      onUpdated: event(), onRemoved: event()
    },
    runtime: { id: 'fixture', onMessage: event(), onStartup: event(), onInstalled: event() },
    alarms: {
      async get(name) { return alarms.get(name); },
      async create(name, options) { alarms.set(name, { scheduledTime: options.when }); },
      async clear(name) { return alarms.delete(name); },
      onAlarm: event()
    }
  };
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [NOW])); }
    static now() { return NOW; }
  }
  const context = vm.createContext({ browser, URL, Date: Clock, TextEncoder, crypto: crypto.webcrypto,
    console: { error: error => errors.push(error), warn: error => errors.push(error) } });
  for (const file of ['utils/storage.js', 'utils/policy.js', 'utils/schema.js', 'background/background.js']) {
    vm.runInContext(source(file), context, { filename: file });
  }
  const manager = context.StorageManager;
  async function settle() {
    await new Promise(setImmediate);
    await manager._writeQueue;
    await vm.runInContext('alarmQueue', context);
    assert.deepEqual(errors, []);
  }
  await settle();
  return {
    state, alarms, tabs, browser, context, manager, settle,
    start: () => manager.execute({ op: 'videoStart', videoId: VIDEO, title: 'Chosen video', duration: 120, position: 10, live: false },
      { content: true, tabId: 1, videoId: VIDEO, isPro: async () => true }),
    update(id, url) {
      tabs.set(id, { id, url });
      return browser.tabs.onUpdated.emit(id, { url });
    },
    message(command) {
      return new Promise(resolve => browser.runtime.onMessage.emit({ type: 'IYT_STORAGE', command }, { id: 'fixture' }, resolve));
    }
  };
}

test('delayed owner lookup cannot replace the newer five-minute break alarm', async () => {
  const env = await background();
  const watching = await env.start();
  await env.context.scheduleDeadlines();
  assert.equal(env.alarms.get('iyt-deadline').scheduledTime, watching.videoSession.sessionDeadline);
  const lookup = deferred(), release = deferred();
  const get = env.browser.tabs.get;
  env.browser.tabs.get = async id => {
    const tab = await get(id);
    lookup.resolve();
    await release.promise;
    return tab;
  };
  const oldReconcile = env.context.reconcile();
  await lookup.promise;
  const response = await env.message({ op: 'videoFinishNow', token: watching.videoSession.token });
  assert.equal(response.ok, true);
  const deadline = response.settings.videoSession.breakUntil;
  assert.equal(deadline, NOW + 300000);
  assert.equal(env.alarms.get('iyt-deadline').scheduledTime, deadline);
  release.resolve();
  await oldReconcile;
  await env.settle();
  assert.equal(env.alarms.get('iyt-deadline').scheduledTime, deadline);
});

test('a fast owner departure and return starts exactly one break from the departed URL', async () => {
  const env = await background();
  const watching = await env.start();
  const departed = env.update(1, AWAY);
  const returned = env.update(1, WATCH);
  await Promise.all([departed, returned]);
  await env.settle();
  const session = env.state.settings.videoSession;
  assert.equal(session.token, watching.videoSession.token);
  assert.equal(session.phase, 'break');
  assert.equal(session.breakUntil, NOW + 300000);
  assert.equal(env.alarms.get('iyt-deadline').scheduledTime, session.breakUntil);
  await env.update(1, AWAY);
  assert.equal(env.state.settings.videoSession.breakUntil, session.breakUntil);
});

test('unrelated tab URL updates do not abandon the owner session', async () => {
  const env = await background();
  const watching = await env.start();
  await env.update(2, AWAY);
  await env.settle();
  assert.equal(env.state.settings.videoSession.token, watching.videoSession.token);
  assert.equal(env.state.settings.videoSession.phase, 'watching');
  assert.equal(env.alarms.get('iyt-deadline').scheduledTime, watching.videoSession.sessionDeadline);
});

test('a departure ordered after a queued start observes and abandons that committed token', async () => {
  const env = await background();
  const release = deferred();
  const blocked = env.manager._enqueue(() => release.promise);
  const starting = env.start();
  const departed = env.update(1, AWAY);
  const returned = env.update(1, WATCH);
  release.resolve();
  await blocked;
  const watching = await starting;
  await Promise.all([departed, returned]);
  await env.settle();
  assert.equal(env.state.settings.videoSession.token, watching.videoSession.token);
  assert.equal(env.state.settings.videoSession.phase, 'break');
});

test('a departure ordered before a later start cannot abandon that new session', async () => {
  const env = await background();
  const release = deferred();
  const blocked = env.manager._enqueue(() => release.promise);
  const departed = env.update(1, AWAY);
  const returned = env.update(1, WATCH);
  const starting = env.start();
  release.resolve();
  await blocked;
  const watching = await starting;
  await Promise.all([departed, returned]);
  await env.settle();
  assert.equal(env.state.settings.videoSession.token, watching.videoSession.token);
  assert.equal(env.state.settings.videoSession.phase, 'watching');
});

test('worker reload preserves a valid owner while browser startup starts a break', async () => {
  const original = await background();
  const watching = await original.start();
  const restarted = await background(original.state);
  assert.equal(restarted.state.settings.videoSession.token, watching.videoSession.token);
  assert.equal(restarted.state.settings.videoSession.phase, 'watching');
  await restarted.browser.runtime.onStartup.emit();
  await restarted.settle();
  assert.equal(restarted.state.settings.videoSession.phase, 'break');
  assert.equal(restarted.state.settings.videoSession.breakUntil, NOW + 300000);
});
