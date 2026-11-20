/**
 * timerToast.js — Intentional YT v3
 * Passive watch timer, soft reminder toast, and daily limit enforcement.
 * Attached per watch/video page by youtubeObserver.js.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;


const IYT_Timer = (() => {
  let _video = null;
  let _contextInvalidated = false;
  let _attachGeneration = 0;
  let _attachedId = null;
  let _videoSeconds = 0;
  let _lastTick = 0;
  let _lastMediaTime = 0;
  let _counting = false;
  let _day = StorageManager.getTodayString();
  const _pendingBatches = new Map();
  const _batchPrefix = crypto.randomUUID();
  let _batchSequence = 0;

  // ─── Channel info scraping ─────────────────────────────────────────────────
  function _getChannelInfo() {
    // Try the most reliable selectors first (desktop, then mobile)
    try {
      // Desktop watch page – ytd-video-owner-renderer
      const ownerEl = document.querySelector('ytd-video-owner-renderer #channel-name yt-formatted-string, ytd-video-owner-renderer #owner-name a');
      if (ownerEl?.textContent?.trim()) {
        const name = ownerEl.textContent.trim();
        const href = ownerEl.closest('a')?.href || ownerEl.href || '';
        const id = _extractChannelId(href) || name;
        return { id, name };
      }
      // Desktop – above-the-fold simplified row
      const metaOwner = document.querySelector('#owner #channel-name a, ytd-channel-name a');
      if (metaOwner?.textContent?.trim()) {
        const name = metaOwner.textContent.trim();
        const id = _extractChannelId(metaOwner.href) || name;
        return { id, name };
      }
      // Mobile
      const mobileOwner = document.querySelector('.slim-owner-icon-and-title .slim-owner-channel-name');
      if (mobileOwner?.textContent?.trim()) {
        const name = mobileOwner.textContent.trim();
        return { id: name, name };
      }
    } catch (_) {}
    return { id: 'unknown', name: 'Unknown' };
  }

  function _extractChannelId(href) {
    if (!href) return null;
    try {
      const url = new URL(href, 'https://www.youtube.com');
      // /channel/UCxxxx
      const m = url.pathname.match(/\/channel\/(UC[a-zA-Z0-9_-]{10,})/);
      if (m) return m[1];
      // /@handle or /c/handle or /user/handle
      const m2 = url.pathname.match(/\/@([^/]+)|\/c\/([^/]+)|\/user\/([^/]+)/);
      if (m2) return '@' + (m2[1] || m2[2] || m2[3]);
    } catch (_) {}
    return null;
  }
  function _pendingSeconds() {
    let total = 0;
    for (const b of _pendingBatches.values()) {
      if (b.day === _day) total += b.seconds;
    }
    return total;
  }
  function _hasActiveMiniplayer() {
    return Boolean(document.querySelector?.('ytd-miniplayer[active] video, ytm-miniplayer[active] video, ytm-miniplayer video'));
  }
  function _validRoute() {
    return location.pathname === '/watch' || /^\/(shorts|live|embed)\//.test(location.pathname) || _hasActiveMiniplayer();
  }
  function _enforcing() { return IYT_Policy.active(_settings) && _video?.isConnected && _validRoute(); }

  let _settings = null;
  let _sessionSeconds = 0;
  let _intervalHandle = null;
  let _batchAccumulator = 0;   // seconds accumulated since last storage write
  let _baseWatchSeconds = 0;   // todayWatchSeconds value in storage
  let _reminderIntervalCount = 0;
  let _limitOverlayActive = false;
  let _allowedVideoId = null;
  let _graceConsumedFor = null;
  let _warningPending = false;
  let _warnedBudget = null;
  let _warningRetryAt = 0;
  let _overlayTrapHandler = null;
  let _prevFocusedEl = null;
  let _ownerToken = null;
  let _ownerEpoch = null;
  let _completionPending = null;
  let _claimPending = null;
  let _claimAttempted = null;
  let _sessionDeadlineTimer = null;
  let _sessionOverlay = null;
  let _startingVideo = false;
  let _startDeparted = false;
  let _startingVideoId = null;
  let _settingsGeneration = 0;

  async function _readCurrentSettings() {
    const generation = _settingsGeneration;
    const settings = await StorageManager.getSettings();
    return generation === _settingsGeneration || !_settings ? settings : _settings;
  }

  function _canonicalId() {
    const id = location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') : null;
    return /^[a-zA-Z0-9_-]{11}$/.test(id || '') ? id : null;
  }
  function _ordinaryVideoInfo() {
    const videoId = _canonicalId();
    if (!videoId || _hasActiveMiniplayer()) return { eligible: false, reason: 'unsupported' };
    const video = _video;
    if (!video?.isConnected || _attachedId !== videoId || !Number.isFinite(video.duration) || video.duration <= 0) return { eligible: false, reason: 'loading' };
    if (video.ended || video.currentTime >= video.duration || !Number.isFinite(video.currentTime)) return { eligible: false, reason: 'unsupported' };
    if (document.querySelector('.ad-showing, .ad-interrupting')) return { eligible: false, reason: 'ads' };
    const routeId = document.querySelector('ytd-watch-flexy[video-id]')?.getAttribute('video-id')
      || document.querySelector('meta[itemprop="videoId"]')?.content;
    if (routeId !== videoId) return { eligible: false, reason: 'loading' };
    const liveMeta = document.querySelector('meta[itemprop="isLiveBroadcast"]')?.content;
    const liveBadge = document.querySelector('.ytp-live-badge');
    const visibleLive = liveBadge && !liveBadge.hidden && getComputedStyle(liveBadge).display !== 'none' && getComputedStyle(liveBadge).visibility !== 'hidden';
    const clock = document.querySelector('.ytp-time-duration')?.textContent?.trim() || '';
    // Require an explicit non-live marker or a duration clock with no live badge.
    if (liveMeta === 'True' || liveMeta === 'true' || visibleLive || !(liveMeta?.toLowerCase() === 'false' || /^\d+(?::\d{2}){1,2}$/.test(clock))) return { eligible: false, reason: 'unsupported' };
    const title = (document.querySelector('h1.ytd-watch-metadata, h1.title, .slim-video-metadata-title')?.textContent || document.title || videoId).trim().slice(0, 200);
    return { eligible: true, videoId, title, duration: video.duration, position: video.currentTime, live: false };
  }
  function _videoInfo() {
    if (!_settings) return { eligible: false, reason: 'loading' };
    const reason = !IYT_Policy.active(_settings) ? (_settings.extensionEnabled === false ? 'off' : 'snooze')
      : IYT_Policy.videoSessionPhase(_settings) || _settings.focusSessionUntil > Date.now() ? 'active_session'
      : IYT_Policy.schedules(_settings).some(r => r.mode === 'full') ? 'schedule'
      : _settings.dailyLimit.enabled && (_settings.stats.limitDismissedToday || _isLimitExceeded()) ? 'budget' : null;
    return reason ? { eligible: false, reason } : _ordinaryVideoInfo();
  }
  function _ownsSession() { return _ownerToken === _settings?.videoSession?.token && _ownerEpoch === _settings?.videoSession?.ownerEpoch; }
  function _sessionBlocks(media) {
    if (_startingVideo || _completionPending === _settings?.videoSession?.token) return true;
    const info = IYT_Policy.videoSessionPhase(_settings) === 'watching' ? _ordinaryVideoInfo() : null;
    const verified = info?.eligible || (info?.reason === 'ads' && _attachedId === _canonicalId() && document.querySelector('ytd-watch-flexy[video-id]')?.getAttribute('video-id') === _canonicalId());
    return !IYT_Policy.videoPlaybackAllowed(_settings, _ownsSession(), info?.videoId || (verified ? _attachedId : null), media === _video && verified);
  }
  function _sessionText(key, fallback, subs) { return I18N.getMessage(key, subs, fallback); }
  function _renderSessionOverlay() {
    const phase = IYT_Policy.videoSessionPhase(_settings);
    const blocked = phase && (!_video || _sessionBlocks(_video));
    if (!blocked && !_completionPending) { _sessionOverlay?.remove(); _sessionOverlay = null; return; }
    if (!document.body) return;
    if (!_sessionOverlay) {
      _sessionOverlay = document.createElement('section');
      _sessionOverlay.id = 'iyt-video-session-overlay';
      _sessionOverlay.setAttribute('role', 'status');
      const heading = document.createElement('h2'); heading.className = 'iyt-session-heading';
      const detail = document.createElement('p'); detail.className = 'iyt-session-detail';
      const finish = document.createElement('button'); finish.type = 'button'; finish.className = 'iyt-session-finish';
      finish.addEventListener('click', () => _finishNow().catch(handleTimerError));
      _sessionOverlay.append(heading, detail, finish);
      document.body.appendChild(_sessionOverlay);
    }
    const breakUntil = _settings?.videoSession?.breakUntil || (_settings?.videoSession?.sessionDeadline + 300000);
    const seconds = Math.max(0, Math.ceil((breakUntil - Date.now()) / 1000));
    const remaining = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    _sessionOverlay.querySelector('h2').textContent = _completionPending ? _sessionText('video_session_working', 'Starting your break…') : phase === 'break' ? _sessionText('video_session_done', 'You’re done for now') : _sessionText('video_session_other', 'Only the chosen video can play in its original tab.');
    _sessionOverlay.querySelector('p').textContent = phase === 'break' ? _sessionText('video_session_break_remaining', 'Playback is paused for $1.', [remaining]) : (_settings?.videoSession?.title || '');
    const finish = _sessionOverlay.querySelector('button');
    finish.textContent = _sessionText('video_session_finish_now', 'Finish now and take a 5-minute break');
    finish.hidden = phase !== 'watching' || Boolean(_completionPending);
  }
  function _enforceSession() {
    if (!IYT_Policy.videoSessionPhase(_settings) && !_startingVideo) {
      _completionPending = null; _ownerToken = null; _ownerEpoch = null;
      if (_sessionOverlay) { _sessionOverlay.remove(); _sessionOverlay = null; }
      if (!_limitOverlayActive) _restoreMediaSession();
      return;
    }
    for (const media of document.querySelectorAll('video, audio')) {
      if (_sessionBlocks(media)) { media.pause(); _exitPictureInPicture(); _blockMediaSession(); }
    }
    if (!_limitOverlayActive && !_sessionBlocks(_video)) _restoreMediaSession();
    _renderSessionOverlay();
  }
  function _scheduleSessionDeadline() {
    clearTimeout(_sessionDeadlineTimer);
    const v = _settings?.videoSession;
    const next = v?.phase === 'watching' ? v.sessionDeadline : v?.breakUntil;
    if (next > Date.now()) _sessionDeadlineTimer = setTimeout(() => { _syncCurrentSettings().catch(handleTimerError); }, Math.min(2147483647, next - Date.now() + 25));
  }
  async function _syncSession(settings) {
    ++_settingsGeneration;
    _settings = settings;
    if (_completionPending && (settings.videoSession?.token !== _completionPending || settings.videoSession?.phase !== 'watching')) _completionPending = null;
    _scheduleSessionDeadline();
    _enforceSession();
    const v = settings.videoSession;
    if (v?.phase === 'watching' && !_startingVideo && !_ownsSession() && !_claimPending && _claimAttempted !== v.token && _ordinaryVideoInfo().eligible && _canonicalId() === v.videoId) {
      _claimPending = v.token;
      _claimAttempted = v.token;
      try {
        const generation = _attachGeneration;
        const video = _video;
        const claimed = await StorageManager._request({ op: 'videoClaim', token: v.token, videoId: v.videoId });
        // Responses can trail a storage event that already applied a break or a
        // newer epoch. Read current state instead of reinstalling the old reply.
        const current = await _readCurrentSettings();
        const owner = current.videoSession;
        if (generation === _attachGeneration && video === _video && _ordinaryVideoInfo().eligible && _canonicalId() === v.videoId && owner?.phase === 'watching' && owner.token === v.token && owner.ownerEpoch === claimed.videoSession?.ownerEpoch) {
          _ownerToken = v.token; _ownerEpoch = owner.ownerEpoch;
        }
        await _syncSession(current);
      } catch (error) { if (error.code === 'CONTEXT_INVALIDATED') handleTimerError(error); }
      finally { _claimPending = null; _enforceSession(); }
    }
  }
  async function _syncCurrentSettings() { await _syncSession(await _readCurrentSettings()); }
  async function _finishNow() {
    const token = _settings?.videoSession?.token;
    if (!token) return;
    _completionPending = token; _enforceSession();
    try { await StorageManager.finishVideoNow(token); await _syncCurrentSettings(); }
    catch (error) { _completionPending = null; _enforceSession(); throw error; }
  }
  async function _startVideo() {
    const info = _videoInfo();
    if (!info.eligible) return { ok: false, code: info.reason, error: info.reason };
    _startingVideo = true; _startingVideoId = info.videoId; _startDeparted = false; _enforceSession();
    const generation = _attachGeneration;
    const video = _video;
    try {
      const accepted = await StorageManager._request({ op: 'videoStart', ...info });
      let settings = await _readCurrentSettings();
      const session = settings.videoSession;
      if (session?.token === accepted.videoSession?.token && session.phase === 'watching' && session.ownerEpoch === accepted.videoSession.ownerEpoch) {
        if (_startDeparted || _canonicalId() !== info.videoId) {
          // The start may have committed after the background already checked
          // navigation. End that accepted token even if the route returned.
          await StorageManager._request({ op: 'videoDepart', token: session.token, ownerEpoch: session.ownerEpoch, departed: true });
          settings = await _readCurrentSettings();
        } else if (generation === _attachGeneration && video === _video && _ordinaryVideoInfo().eligible) {
          _ownerToken = session.token; _ownerEpoch = session.ownerEpoch;
        }
      }
      _startingVideo = false;
      await _syncSession(settings);
      return { ok: true, settings: _settings };
    } catch (error) { return { ok: false, error: error.message, code: error.code }; }
    finally { _startingVideo = false; _startingVideoId = null; _startDeparted = false; _enforceSession(); }
  }
  function routeChanged() {
    if (_startingVideo && _canonicalId() !== _startingVideoId) _startDeparted = true;
    const v = _settings?.videoSession;
    _enforceSession();
    if (v?.phase === 'watching' && _ownsSession() && _canonicalId() !== v.videoId) {
      _completionPending = v.token;
      StorageManager._request({ op: 'videoDepart', token: v.token, ownerEpoch: _ownerEpoch }).then(_syncCurrentSettings).catch(handleTimerError);
    }
  }
  document.addEventListener('play', event => { if (_sessionBlocks(event.target)) { event.target.pause(); _exitPictureInPicture(); _blockMediaSession(); _renderSessionOverlay(); } }, true);
  document.addEventListener('playing', event => { if (_sessionBlocks(event.target)) { event.target.pause(); _renderSessionOverlay(); } }, true);

  async function _maybeWarnBeforeLimit() {
    if (_warningPending || document.hidden || !_enforcing() || _video.paused || !_settings || Date.now() < _warningRetryAt) return;
    const key = `${_settings.stats.lastStatsReset}:${_settings.dailyLimit.limitMinutes}`;
    if (_warnedBudget === key || !IYT_Policy.limitWarning(_settings)) return;
    _warningPending = true;
    try {
      const result = await StorageManager.claimLimitWarning();
      if (result.minutes > 0) _warnedBudget = key;
      if (result.claimed && !document.hidden && _enforcing() && !_video.paused && !_isLimitExceeded() && IYT_Policy.limitWarning(_settings)) {
        _showToast(result.minutes, true);
      }
    } catch (error) {
      _warningRetryAt = Date.now() + 60000;
      handleTimerError(error);
    }
    finally { _warningPending = false; }
  }

  function _findActiveVideo() {
    return document.querySelector('ytd-miniplayer[active] video, ytm-miniplayer[active] video, ytm-miniplayer video')
      || document.querySelector('ytd-reel-video-renderer[is-active] video, ytm-reel-video-renderer[is-active] video')
      || document.querySelector('video.html5-main-video')
      || document.querySelector('#movie_player video')
      || document.querySelector('.html5-video-player video')
      || document.querySelector('ytd-watch-flexy video')
      || document.querySelector('ytd-player video')
      || document.querySelector('video');
  }

  function _getVideoId() {
    const p = window.location.pathname;
    if (p === '/watch') {
      return new URLSearchParams(window.location.search).get('v') || window.location.href;
    }
    if (p.startsWith('/shorts/')) {
      return p.split('/shorts/')[1]?.split(/[?#/]/)[0] || window.location.href;
    }
    const miniplayerLink = document.querySelector?.('ytd-miniplayer[active] a[href*="watch?v="], ytm-miniplayer a[href*="watch?v="]');
    if (miniplayerLink) {
      try {
        const url = new URL(miniplayerLink.href, window.location.origin);
        const v = url.searchParams.get('v');
        if (v) return v;
      } catch {}
    }
    if (_hasActiveMiniplayer() && _attachedId) {
      return _attachedId;
    }
    return window.location.pathname + window.location.search;
  }

  function _canOfferFinishVideo() {
    if (IYT_Policy.videoSessionPhase(_settings)) return false;
    if (window.location.pathname.startsWith('/live')) return false;
    if (!_video) return false;
    if (_video.ended) return false;
    if (_video.duration === Infinity) return false;

    // If the user already used "Finish this video" on this video and it ended, do not offer again
    if (_graceConsumedFor && _graceConsumedFor === _getVideoId()) return false;

    // Check if the video is already within 2 seconds of the end
    if (Number.isFinite(_video.duration) && _video.duration > 0) {
      const remSec = _video.duration - (_video.currentTime || 0);
      if (remSec <= 2) return false;
    }

    // Crucial: Only offer "Finish this video" if the user was actively watching this video
    // when the limit expired (session seconds > 0 or currentTime > 5), NOT when navigating
    // to a brand new video while the limit is already exhausted!
    const isMidWatch = _videoSeconds > 0;
    return isMidWatch;
  }

  function _isLimitExceeded() {
    if (!_enforcing() || !_settings?.dailyLimit?.enabled) return false;
    if (_settings.stats?.limitDismissedToday) return false;
    if (!IYT_Policy.videoSessionPhase(_settings) && _allowedVideoId && _allowedVideoId === _getVideoId()) return false;
    const limitMin = Number(_settings.dailyLimit.limitMinutes) || 60;
    const currentTotalSec = (_baseWatchSeconds || 0) + _batchAccumulator + _pendingSeconds();
    return (currentTotalSec / 60) >= limitMin;
  }

  function _t(key, subs, fallback) {
    if (typeof I18N !== 'undefined' && I18N.getMessage) {
      return I18N.getMessage(key, subs, fallback);
    }
    try {
      if (browser && browser.i18n && typeof browser.i18n.getMessage === 'function') {
        const msg = browser.i18n.getMessage(key, subs);
        if (msg) return msg;
      }
    } catch (e) {}
    return fallback;
  }

  // ─── Toast ─────────────────────────────────────────────────────────────────
  function _showToast(minutes, limitWarning = false) {
    if (!limitWarning && document.getElementById('iyt-toast')?.getAttribute('data-limit-warning') === 'true') return;
    document.getElementById('iyt-toast')?.remove();

    const toast = document.createElement('div');
    toast.id = 'iyt-toast';
    if (limitWarning) toast.setAttribute('data-limit-warning', 'true');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = 'iyt-toast-container';
    const dir = (typeof I18N !== 'undefined' && I18N.getDirection) ? I18N.getDirection() : 'ltr';
    toast.setAttribute('dir', dir);

    // Header: Icon + Badge + Close button
    const header = document.createElement('div');
    header.className = 'iyt-toast-header';

    const headerLeft = document.createElement('div');
    headerLeft.className = 'iyt-toast-header-left';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'iyt-toast-icon-wrap';
    iconWrap.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

    const badge = document.createElement('span');
    badge.className = 'iyt-toast-badge';
    badge.textContent = limitWarning ? _t('limit_warning_title', null, 'Almost at your daily limit') : _t('toast_reminder_badge', null, 'Gentle Reminder');

    headerLeft.appendChild(iconWrap);
    headerLeft.appendChild(badge);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'iyt-toast-close';
    closeBtn.setAttribute('aria-label', _t('toast_dismiss_aria', null, 'Dismiss'));
    closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    header.appendChild(headerLeft);
    header.appendChild(closeBtn);

    // Body Message
    const msgSpan = document.createElement('div');
    msgSpan.className = 'iyt-toast-message';
    const msgText = minutes === 1
      ? _t('toast_reminder_message_singular', null, "You've been watching for 1 minute.")
      : _t('toast_reminder_message', [String(minutes)], `You've been watching for ${minutes} minutes.`);
    msgSpan.textContent = limitWarning
      ? _t('limit_warning_message', [String(minutes)], `Time left today: ${minutes} min. Wrap up before the daily block starts.`)
      : msgText;

    // Action Buttons Row
    const actionsRow = document.createElement('div');
    actionsRow.className = 'iyt-toast-actions';

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'iyt-toast-btn iyt-toast-btn-pause';
    pauseBtn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg><span></span>';
    pauseBtn.querySelector('span').textContent = _t('toast_button_pause', null, 'Pause Video');

    const dismissBtn = document.createElement('button');
    dismissBtn.type = 'button';
    dismissBtn.className = 'iyt-toast-btn iyt-toast-btn-dismiss';
    dismissBtn.textContent = _t('toast_button_continue', null, 'Keep Watching');

    actionsRow.appendChild(pauseBtn);
    actionsRow.appendChild(dismissBtn);

    // 6-second countdown progress bar
    const progressTrack = document.createElement('div');
    progressTrack.className = 'iyt-toast-progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'iyt-toast-progress-bar';
    progressTrack.appendChild(progressBar);

    toast.appendChild(header);
    toast.appendChild(msgSpan);
    toast.appendChild(actionsRow);
    toast.appendChild(progressTrack);
    (document.fullscreenElement || document.body).appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('iyt-toast-show'));
    });

    let dismissed = false;
    let autoDismissTimer = null;
    let remainingMs = 6000;
    let timerStartedAt = Date.now();

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (autoDismissTimer) clearTimeout(autoDismissTimer);
      toast.classList.remove('iyt-toast-show');
      setTimeout(() => toast.remove(), 350);
    }

    function startTimer(duration) {
      timerStartedAt = Date.now();
      remainingMs = duration;
      autoDismissTimer = setTimeout(dismiss, duration);
    }

    function pauseTimer() {
      if (dismissed || !autoDismissTimer) return;
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
      const elapsed = Date.now() - timerStartedAt;
      remainingMs = Math.max(0, remainingMs - elapsed);
    }

    function resumeTimer() {
      if (dismissed || autoDismissTimer || remainingMs <= 0) return;
      startTimer(remainingMs);
    }

    toast.addEventListener('focusin', pauseTimer);
    toast.addEventListener('focusout', e => { if (!toast.contains(e.relatedTarget)) resumeTimer(); });
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });

    dismissBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });

    pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!_video) _video = _findActiveVideo();
      if (_video && !_video.paused) {
        _video.pause();
      }
      pauseBtn.classList.add('is-paused');
      pauseBtn.textContent = _t('toast_status_paused', null, 'Paused');
      setTimeout(dismiss, 1200);
    });

    startTimer(6000);
  }

  function _exitPictureInPicture() {
    if (typeof document !== 'undefined' && typeof document.exitPictureInPicture === 'function' && document.pictureInPictureElement) {
      try {
        document.exitPictureInPicture().catch(() => {});
      } catch {}
    }
  }

  function _blockMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof navigator.mediaSession?.setActionHandler === 'function') {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          if (_video && !_video.paused) _video.pause();
        });
        navigator.mediaSession.playbackState = 'paused';
      } catch {}
    }
  }

  function _restoreMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && typeof navigator.mediaSession?.setActionHandler === 'function') {
      try {
        navigator.mediaSession.setActionHandler('play', null);
      } catch {}
    }
  }

  // ─── Daily Limit Overlay ───────────────────────────────────────────────────
  function _showLimitOverlay() {
    if (!_enforcing()) return;
    if (_limitOverlayActive && document.getElementById('iyt-limit-overlay')) return;

    _exitPictureInPicture();
    _blockMediaSession();

    let playerEl = document.querySelector?.('ytd-miniplayer[active] #player-container')
      || document.querySelector?.('ytd-miniplayer[active]')
      || document.querySelector('#movie_player')
      || document.querySelector('.html5-video-player')
      || document.querySelector('ytd-player')
      || (_video ? _video.closest('.html5-video-player') : null)
      || (_video ? _video.parentElement : null);

    if (!playerEl) {
      playerEl = document.querySelector('#player') || document.querySelector('ytd-watch-flexy') || document.body;
    }
    if (!playerEl) return;

    if (getComputedStyle(playerEl).position === 'static') {
      playerEl.style.position = 'relative';
    }

    _prevFocusedEl = document.activeElement;
    if (_overlayTrapHandler) {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', _overlayTrapHandler, true);
      }
      _overlayTrapHandler = null;
    }
    document.getElementById('iyt-limit-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'iyt-limit-overlay';
    overlay.className = 'iy-limit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', _t('overlay_limit_title', null, 'Daily Limit Reached'));
    const dir = (typeof I18N !== 'undefined' && I18N.getDirection) ? I18N.getDirection() : 'ltr';
    overlay.setAttribute('dir', dir);

    const limitMin = _settings?.dailyLimit?.limitMinutes || 60;

    const icon = document.createElement('div');
    icon.className = 'iy-limit-icon';
    icon.textContent = '⏳';

    const title = document.createElement('h2');
    title.className = 'iy-limit-title';
    title.textContent = _t('overlay_limit_title', null, 'Daily Limit Reached');

    const p = document.createElement('p');
    p.className = 'iy-limit-message';
    p.textContent = _t('overlay_limit_message', [String(limitMin)], `You've reached your ${limitMin}-minute daily watch limit for YouTube today.`);

    const btnGroup = document.createElement('div');
    btnGroup.className = 'iy-limit-btn-group';

    const canFinish = _canOfferFinishVideo();
    let finishBtn = null;

    if (canFinish) {
      finishBtn = document.createElement('button');
      finishBtn.className = 'iy-limit-button';
      let label = _t('overlay_button_finish_video', null, 'Finish this video');
      if (_video && Number.isFinite(_video.duration) && _video.duration > 0) {
        const remSec = Math.max(0, _video.duration - (_video.currentTime || 0));
        const remMin = Math.ceil(remSec / 60);
        if (remMin > 0) {
          label = _t('overlay_button_finish_video_remaining', [String(remMin)], `Finish this video (${remMin}m left)`);
        }
      }
      finishBtn.textContent = label;
      finishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        _allowedVideoId = _getVideoId();
        _removeLimitOverlay();
        if (_video?.isConnected && _video.paused) {
          _video.play().catch(() => {});
        }
      });
      btnGroup.appendChild(finishBtn);
    }

    const stopBtn = document.createElement('button');
    stopBtn.className = canFinish ? 'iy-limit-button-secondary' : 'iy-limit-button';
    stopBtn.textContent = _t('overlay_button_stop_watching', null, 'Stop Watching (Go Home)');

    const overrideBtn = document.createElement('button');
    overrideBtn.className = 'iy-limit-button-secondary';
    overrideBtn.textContent = _t('overlay_button_dismiss_today', null, 'Dismiss for today');

    btnGroup.appendChild(stopBtn);
    if (!_settings.focusLock?.enabled) btnGroup.appendChild(overrideBtn);

    overlay.appendChild(icon);
    overlay.appendChild(title);
    overlay.appendChild(p);
    overlay.appendChild(btnGroup);

    playerEl.appendChild(overlay);
    _limitOverlayActive = true;

    // Focus primary action
    const primaryBtn = canFinish && finishBtn ? finishBtn : stopBtn;
    try { primaryBtn?.focus(); } catch (_) {}

    // Trap keyboard navigation & handle Escape key
    _overlayTrapHandler = (e) => {
      if (!_limitOverlayActive || !document.getElementById('iyt-limit-overlay')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (canFinish && finishBtn) {
          finishBtn.click();
        } else if (!_settings?.focusLock?.enabled && overrideBtn) {
          overrideBtn.click();
        } else {
          stopBtn?.focus();
        }
        return;
      }

      if (e.key === 'Tab') {
        const focusable = Array.from(overlay.querySelectorAll('button:not([disabled])'));
        if (focusable.length <= 1) {
          e.preventDefault();
          focusable[0]?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !overlay.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !overlay.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('keydown', _overlayTrapHandler, true);
    }

    // Prevent clicks from penetrating through overlay to player
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    stopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _allowedVideoId = null;
      _video?.pause();
      window.location.href = 'https://www.youtube.com/';
    });

    overrideBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try { await StorageManager.updateNestedSetting('stats', 'limitDismissedToday', true); }
      catch (error) { overrideBtn.textContent = error.message; return; }
      if (_settings?.stats) _settings.stats.limitDismissedToday = true;
      _allowedVideoId = null;
      _removeLimitOverlay();
    });
  }

  function _removeLimitOverlay() {
    if (_overlayTrapHandler) {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('keydown', _overlayTrapHandler, true);
      }
      _overlayTrapHandler = null;
    }
    document.getElementById('iyt-limit-overlay')?.remove();
    _limitOverlayActive = false;
    if (!IYT_Policy.videoSessionPhase(_settings) && !_completionPending) _restoreMediaSession();
    try {
      if (_prevFocusedEl && typeof _prevFocusedEl.focus === 'function' && _prevFocusedEl.isConnected) {
        _prevFocusedEl.focus();
        _prevFocusedEl = null;
      }
    } catch (_) {}
  }

  // ─── Write accumulated seconds to storage ─────────────────────────────────
  function _flushToStorage(seconds) {
    if (_contextInvalidated || seconds <= 0) return Promise.resolve();
    const id = _batchPrefix + ':' + (++_batchSequence);
    const channelInfo = _getChannelInfo();
    const batch = { seconds, day: _day, channelId: channelInfo.id, channelName: channelInfo.name };
    _pendingBatches.set(id, batch);
    async function send(attempt = 0) {
      if (_contextInvalidated) return;
      try {
        const generation = _settingsGeneration;
        const response = await StorageManager.recordWatch(seconds, id, batch.day);
        const settings = generation === _settingsGeneration || !_settings ? response : _settings;
        _pendingBatches.delete(id);
        ++_settingsGeneration;
        _settings = settings;
        _baseWatchSeconds = settings.stats.todayWatchSeconds;
        _day = StorageManager.getTodayString(settings?.dailyLimit?.resetHour);
        if (_isLimitExceeded()) { _video?.pause(); _showLimitOverlay(); }
        // Record per-channel analytics with hour bucket (best-effort, non-blocking)
        if (typeof IYT_Analytics !== 'undefined' && batch.channelId && batch.channelId !== 'unknown') {
          IYT_Analytics.recordChannelWatch(seconds, batch.channelId, batch.channelName, batch.day, new Date().getHours()).catch(() => {});
        }
      } catch (error) {
        if (/Extension context invalidated|Receiving end does not exist|Could not establish connection|sendMessage/i.test(String(error?.stack || error?.message || error || '')) || error?.code === 'CONTEXT_INVALIDATED' || (error instanceof TypeError)) {
          handleTimerError(error);
          return;
        }
        if (attempt < 2) setTimeout(() => send(attempt + 1), 1000 * (attempt + 1));
        else { _pendingBatches.delete(id); console.warn('[IYT] Watch update failed', error); }
      }
    }
    return send();
  }

  // Real elapsed playback, summed across playing tabs; buffering, seeking and ads excluded.
  function _accrue() {
    const now = performance.now();
    if (_counting && _video?.isConnected && !_video.seeking && _video.readyState >= 3 && !document.querySelector('.ad-showing')) {
      const elapsed = Math.max(0, (now - _lastTick) / 1000);
      const progress = Math.max(0, (_video.currentTime - _lastMediaTime) / (_video.playbackRate || 1));
      const seconds = Math.min(elapsed, progress);
      _sessionSeconds += seconds;
      _videoSeconds += seconds;
      _batchAccumulator += seconds;
    }
    _lastTick = now;
    _lastMediaTime = _video?.currentTime || 0;
  }

  function _tick() {
    if (!_validRoute()) {
      detach(false);
      return;
    }

    // If video element became detached, try to re-find
    if (!_video || !_video.isConnected) {
      const newVideo = _findActiveVideo();
      if (newVideo && newVideo !== _video) {
        attach().catch(handleTimerError);
        return;
      }
    }

    if (_video && _video.paused) {
      _onPause();
      return;
    }

    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    _accrue();
    const today = StorageManager.getTodayString(_settings?.dailyLimit?.resetHour);
    if (today !== _day) {
      _flushToStorage(_batchAccumulator);
      _batchAccumulator = 0;
      _baseWatchSeconds = 0;
      _sessionSeconds = 0;
      _reminderIntervalCount = 0;
      _day = today;
    }

    // Check daily limit every second in real time
    if (_isLimitExceeded()) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
      return;
    }

    // Reduce storage traffic; synchronize more often in the final five minutes.
    const remainingSeconds = (_settings?.dailyLimit?.limitMinutes || 60) * 60
      - (_baseWatchSeconds + _batchAccumulator + _pendingSeconds());
    const nearLimit = _enforcing() && _settings?.dailyLimit?.enabled
      && !_settings.stats?.limitDismissedToday && remainingSeconds <= 300;
    const flushInterval = nearLimit ? 5 : 15;
    if (_batchAccumulator >= flushInterval) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }

    // Soft reminder check (every intervalMinutes of SESSION time)
    _maybeWarnBeforeLimit();
    if (_enforcing() && _settings?.softReminder?.enabled) {
      const intervalSec = (_settings.softReminder.intervalMinutes || 30) * 60;
      const expectedCount = Math.floor(_sessionSeconds / intervalSec);
      if (expectedCount > _reminderIntervalCount) {
        _reminderIntervalCount = expectedCount;
        _showToast(Math.round(_sessionSeconds / 60));
      }
    }
  }

  // ─── Video event handlers ──────────────────────────────────────────────────
  function _onPlay() {
    if (_contextInvalidated) return;
    if (_sessionBlocks(_video)) { _video?.pause(); _renderSessionOverlay(); return; }
    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    if ((_limitOverlayActive || _isLimitExceeded()) && (IYT_Policy.videoSessionPhase(_settings) || _allowedVideoId !== _getVideoId())) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _exitPictureInPicture();
      _blockMediaSession();
      if (!_limitOverlayActive) {
        _showLimitOverlay();
      }
      return;
    }

    if (_intervalHandle) return; // guard against duplicate intervals
    _lastTick = performance.now();
    _lastMediaTime = _video?.currentTime || 0;
    _counting = true;
    _intervalHandle = setInterval(_tick, 1000);
  }

  function _onPause() {
    _accrue();
    _counting = false;
    if (_intervalHandle) {
      clearInterval(_intervalHandle);
      _intervalHandle = null;
    }
    // Flush any un-flushed seconds immediately on pause
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  }

  function _onEnded() {
    _onPause();
    // Ignore ad endings
    if (document.querySelector('.ad-showing, .ad-interrupting') || (_video && _video.closest('.ad-showing'))) {
      return;
    }
    const session = _settings?.videoSession;
    if (session?.phase === 'watching' && _ownsSession() && _attachedId === session.videoId && _video?.ended && Number.isFinite(_video.duration) && _video.currentTime >= _video.duration - 0.5) {
      _completionPending = session.token;
      _enforceSession();
      StorageManager._request({ op: 'videoFinish', token: session.token, ownerEpoch: _ownerEpoch, videoId: _attachedId, ended: true }).then(_syncCurrentSettings).catch(handleTimerError);
    }
    _graceConsumedFor = _getVideoId();
    _allowedVideoId = null;
    if (_isLimitExceeded()) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
    }
  }

  function _onTimeUpdate() {
    if (_sessionBlocks(_video)) { _video?.pause(); _renderSessionOverlay(); return; }
    if (_allowedVideoId && _allowedVideoId !== _getVideoId()) {
      _allowedVideoId = null;
    }

    if (_isLimitExceeded()) {
      if (_video && !_video.paused) {
        _video.pause();
      }
      _showLimitOverlay();
      return;
    }
    // Fallback: if video is actively progressing and not paused, ensure timer runs
    if (_video && !_video.paused && !_video.seeking && _video.readyState >= 3 && !_intervalHandle) {
      _onPlay();
    }
  }

  // ─── Attach to video element ───────────────────────────────────────────────
  async function attach() {
    if (_contextInvalidated) return;
    const generation = ++_attachGeneration;
    const id = _getVideoId();
    let video;
    for (let i = 0; i < 20; i++) {
      if (generation !== _attachGeneration || !_validRoute() || id !== _getVideoId()) return;
      video = _findActiveVideo();
      if (video?.isConnected) break;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    if (!video?.isConnected || generation !== _attachGeneration) return;
    if (_video === video && _attachedId === id && _listenersAttached) return;
    let settings = await _readCurrentSettings();
    if (generation !== _attachGeneration || id !== _getVideoId() || !_validRoute()) return;
    const sameVideo = _attachedId === id;
    detach(false);
    if (!sameVideo) { _allowedVideoId = null; _videoSeconds = 0; }
    await I18N.setLanguage(settings.userLanguage || 'auto');
    if (generation !== _attachGeneration || id !== _getVideoId() || !_validRoute()) return;
    _settings = settings;
    _video = video;
    _attachedId = id;
    _baseWatchSeconds = settings.stats.todayWatchSeconds;
    _day = StorageManager.getTodayString(settings?.dailyLimit?.resetHour);
    for (const [event, handler] of Object.entries(_videoEvents)) video.addEventListener(event, handler);
    _listenersAttached = true;
    await _syncSession(settings);
    if (_isLimitExceeded()) { video.pause(); _showLimitOverlay(); }
    else if (!video.paused && video.readyState >= 3) _onPlay();
  }
  function _onSeeking() { _onPause(); }
  function _onSeeked() { if (_video && !_video.paused && _video.readyState >= 3) _onPlay(); }
  function _metadataChanged() { if (_settings) _syncSession(_settings).catch(handleTimerError); }
  const _videoEvents = { play: _onPlay, playing: _onPlay, timeupdate: _onTimeUpdate, pause: _onPause, ended: _onEnded, waiting: _onPause, seeking: _onSeeking, seeked: _onSeeked, ratechange: _onSeeking, loadedmetadata: _metadataChanged, durationchange: _metadataChanged };
  let _listenersAttached = false;
  function detach(cancel = true) {
    if (cancel) ++_attachGeneration;
    _onPause();
    if (_video) for (const [event, handler] of Object.entries(_videoEvents)) _video.removeEventListener(event, handler);
    _listenersAttached = false;
    _video = null;
    _removeLimitOverlay();
    document.getElementById('iyt-toast')?.remove();
  }

  // Flush on tab close, hide, or navigation
  window.addEventListener('beforeunload', () => {
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  window.addEventListener('pagehide', () => {
    if (_batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _batchAccumulator > 0) {
      const toFlush = _batchAccumulator;
      _batchAccumulator = 0;
      _flushToStorage(toFlush);
    }
  });

  // Keep _settings in sync when popup or another tab changes settings
  function handleTimerError(error) {
    const runtime = globalThis.browser?.runtime || globalThis.chrome?.runtime || (typeof browser !== 'undefined' ? browser?.runtime : null);
    if (!runtime || !runtime.id || !runtime.sendMessage || /Extension context invalidated|Receiving end does not exist|Could not establish connection|sendMessage/i.test(String(error?.stack || error?.message || error || '')) || error?.code === 'CONTEXT_INVALIDATED' || (error instanceof TypeError)) {
      _contextInvalidated = true;
      _pendingBatches.clear();
      detach();
      return;
    }
    console.warn('[IYT] Timer update failed', error);
  }
  browser.storage.onChanged.addListener(async (changes) => {
    try {
    if (_contextInvalidated) return;
    if (!changes.settings && !changes.usage) return;
    if (changes.usage?.newValue) {
      const usage = changes.usage.newValue;
      for (const id of usage.batches || []) _pendingBatches.delete(id);
      _baseWatchSeconds = usage.stats.todayWatchSeconds;
    }
    const oldLanguage = _settings?.userLanguage;
    const settings = changes.settings || !_settings
      ? await _readCurrentSettings()
      : { ..._settings, stats: changes.usage.newValue.stats };
    await _syncSession(settings);
    _baseWatchSeconds = settings.stats.todayWatchSeconds;
    if (oldLanguage !== settings.userLanguage) await I18N.setLanguage(settings.userLanguage || 'auto');
    if (_isLimitExceeded()) { _video?.pause(); _showLimitOverlay(); }
    else _removeLimitOverlay();
    if (!IYT_Policy.active(settings) || (document.getElementById('iyt-toast')?.getAttribute('data-limit-warning') === 'true' && !IYT_Policy.limitWarning(settings))) document.getElementById('iyt-toast')?.remove();
    } catch (error) { handleTimerError(error); }
  });

  document.addEventListener('yt-miniplayer-state-changed', () => {
    if (_hasActiveMiniplayer()) {
      attach().catch(handleTimerError);
    } else if (!_validRoute()) {
      detach(false);
    }
  });

  document.addEventListener('enterpictureinpicture', () => {
    if (_sessionBlocks(document.pictureInPictureElement) || (_limitOverlayActive && _allowedVideoId !== _getVideoId())) {
      _exitPictureInPicture();
      if (_video && !_video.paused) _video.pause();
    }
  });

  // Listen for preview messages from extension popup
  if (browser && browser.runtime && browser.runtime.onMessage) {
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg?.type === 'IYT_VIDEO_INFO' || msg?.type === 'IYT_VIDEO_START') {
        if (sender?.id !== browser.runtime.id) return;
        if (msg.type === 'IYT_VIDEO_INFO') { sendResponse(_videoInfo()); return; }
        _startVideo().then(sendResponse).catch(error => sendResponse({ ok: false, error: error.message, code: error.code }));
        return true;
      }
      if (msg && msg.type === 'IYT_PREVIEW_TOAST') {
        const mins = msg.minutes || (_settings?.softReminder?.intervalMinutes || 30);
        _showToast(mins);
      }
    });
  }

  // Load the commitment even on home/search routes, where no timer attaches.
  _syncCurrentSettings().catch(handleTimerError);
  document.addEventListener('DOMContentLoaded', _enforceSession, { once: true });
  return { attach, detach, routeChanged, showToast: _showToast };
})();

window.__iytTimer = IYT_Timer;
