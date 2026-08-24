/**
 * blocker.js — Intentional YT v3
 * Applies CSS classes to <html> based on settings. No dynamic JS blocking.
 * Purely event-driven and zero-overhead.
 */

'use strict';

const CLASS_MAP = {
  blockHomeFeed:               'iyt-no-home-feed',
  blockSidebar:                'iyt-no-sidebar',
  blockRecommended:            'iyt-no-recommended',
  blockLiveChat:               'iyt-no-live-chat',
  blockPlaylist:               'iyt-no-playlist',
  blockEndScreenVideowall:     'iyt-no-endscreen-wall',
  blockEndScreenCards:         'iyt-no-endscreen-cards',
  blockComments:               'iyt-no-comments',
  blockProfilePhotos:          'iyt-no-profile-photos',
  blockMixPlaylists:           'iyt-no-mix-playlists',
  blockMerch:                  'iyt-no-merch',
  blockVideoInfo:              'iyt-no-video-info',
  blockVideoButtons:           'iyt-no-video-buttons',
  blockChannelInfo:            'iyt-no-channel-info',
  blockVideoDescription:       'iyt-no-video-desc',
  blockTopHeader:              'iyt-no-top-header',
  blockNotificationBell:       'iyt-no-notif-bell',
  blockIrrelevantSearchResults:'iyt-no-irrelevant-search',
  blockExploreAndTrending:     'iyt-no-explore',
  blockMoreFromYouTube:        'iyt-no-more-yt',
  blockShorts:                 'iyt-no-shorts',
  blockSubscriptionsFeed:      'iyt-no-subscriptions',
  disableAnnotations:          'iyt-no-annotations',
  hideThumbnails:              'iyt-no-thumbnails',
  grayscaleMode:               'iyt-grayscale',
};

const html = document.documentElement;
let _settings = null;

function applyAllClasses(settings) {
  const enabled = settings.extensionEnabled !== false;
  for (const [key, cls] of Object.entries(CLASS_MAP)) {
    if (enabled && settings[key]) {
      html.classList.add(cls);
    } else {
      html.classList.remove(cls);
    }
  }
}

function applyAutoplay(settings) {
  if (!settings || !settings.extensionEnabled || !settings.disableAutoplay) return;
  document.querySelectorAll('video[autoplay]').forEach(v => v.removeAttribute('autoplay'));
  const btn = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
  if (btn) btn.click();
}

async function applyAllSettings() {
  _settings = await StorageManager.getSettings();
  applyAllClasses(_settings);
  applyAutoplay(_settings);
}

// React instantly when user toggles settings
browser.storage.onChanged.addListener((changes) => {
  if (!changes.settings?.newValue) return;
  _settings = changes.settings.newValue;
  applyAllClasses(_settings);
  applyAutoplay(_settings);
});

// Initial injection at document_start
applyAllSettings();

window.__iytBlocker = { applyAllSettings, applyAutoplay };
