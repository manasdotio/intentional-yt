/**
 * welcome.js — Intentional YT Onboarding Wizard
 * Provides a clean, 30-second goal-driven onboarding experience for new users.
 */
'use strict';

var browser = globalThis.browser || globalThis.chrome;
if (typeof globalThis !== 'undefined' && !globalThis.browser && globalThis.chrome) {
  globalThis.browser = globalThis.chrome;
}

let _selectedArchetype = 'balanced';
let _selectedDailyLimit = 0;
let _softReminder = false;
let _currentSettings = null;

const ARCHETYPE_CONFIGS = {
  balanced: {
    name: 'Balanced Focus',
    settings: {
      blockHomeFeed: true,
      blockChannelHome: false,
      limitHomeFeed: false,
      blockSidebar: false,
      blockRecommended: true,
      blockLiveChat: false,
      blockPlaylist: false,
      blockEndScreenVideowall: true,
      blockEndScreenCards: true,
      blockComments: false,
      blockProfilePhotos: false,
      blockMixPlaylists: true,
      blockMerch: true,
      blockVideoInfo: false,
      blockVideoButtons: false,
      blockChannelInfo: false,
      blockVideoDescription: false,
      blockTopHeader: false,
      blockNotificationBell: true,
      blockIrrelevantSearchResults: true,
      blockExploreAndTrending: true,
      blockMoreFromYouTube: true,
      blockShorts: true,
      redirectShorts: false,
      blockSubscriptionsFeed: false,
      disableAutoplay: true,
      disableAnnotations: true,
      disableHoverPreviews: false,
      hideThumbnails: false,
      grayscaleMode: false
    },
    highlights: [
      'Home feed hidden',
      'Shorts removed everywhere',
      'Sidebar suggestions hidden',
      'Comments & subscriptions remain open',
      'Autoplay disabled'
    ]
  },
  antiShorts: {
    name: 'Anti-Shorts Only',
    settings: {
      blockHomeFeed: false,
      blockChannelHome: false,
      limitHomeFeed: true,
      blockSidebar: false,
      blockRecommended: false,
      blockLiveChat: false,
      blockPlaylist: false,
      blockEndScreenVideowall: false,
      blockEndScreenCards: false,
      blockComments: false,
      blockProfilePhotos: false,
      blockMixPlaylists: false,
      blockMerch: false,
      blockVideoInfo: false,
      blockVideoButtons: false,
      blockChannelInfo: false,
      blockVideoDescription: false,
      blockTopHeader: false,
      blockNotificationBell: false,
      blockIrrelevantSearchResults: false,
      blockExploreAndTrending: false,
      blockMoreFromYouTube: false,
      blockShorts: true,
      redirectShorts: true,
      blockSubscriptionsFeed: false,
      disableAutoplay: true,
      disableAnnotations: false,
      disableHoverPreviews: false,
      hideThumbnails: false,
      grayscaleMode: false
    },
    highlights: [
      'Shorts eliminated on all tabs',
      'Shorts links redirect to regular player',
      'Home feed capped at 15 calm videos',
      'Comments & suggestions stay standard',
      'Infinite scroll stopped'
    ]
  },
  zen: {
    name: 'Deep Work (Zen)',
    settings: {
      blockHomeFeed: true,
      blockChannelHome: true,
      limitHomeFeed: false,
      blockSidebar: true,
      blockRecommended: true,
      blockLiveChat: true,
      blockPlaylist: true,
      blockEndScreenVideowall: true,
      blockEndScreenCards: true,
      blockComments: true,
      blockProfilePhotos: true,
      blockMixPlaylists: true,
      blockMerch: true,
      blockVideoInfo: false,
      blockVideoButtons: false,
      blockChannelInfo: false,
      blockVideoDescription: false,
      blockTopHeader: false,
      blockNotificationBell: true,
      blockIrrelevantSearchResults: true,
      blockExploreAndTrending: true,
      blockMoreFromYouTube: true,
      blockShorts: true,
      redirectShorts: false,
      blockSubscriptionsFeed: true,
      disableAutoplay: true,
      disableAnnotations: true,
      disableHoverPreviews: true,
      hideThumbnails: true,
      grayscaleMode: false
    },
    highlights: [
      'Pure Google-like search engine for YouTube',
      'Home feed & suggestions stripped',
      'Comments & notifications hidden',
      'End screens & autoplay blocked',
      'Zero rabbit holes'
    ]
  }
};

function $(id) {
  return document.getElementById(id);
}

function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else if (mode === 'light') {
    root.setAttribute('data-theme', 'light');
  } else {
    root.removeAttribute('data-theme');
  }
}

function updateSummaryUI() {
  const config = (ARCHETYPE_CONFIGS[_selectedArchetype] || (_selectedArchetype === 'anti-shorts' ? ARCHETYPE_CONFIGS.antiShorts : ARCHETYPE_CONFIGS.balanced)) || ARCHETYPE_CONFIGS.balanced;
  const nameEl = $('preview-mode-name');
  if (nameEl) nameEl.textContent = config.name;

  const listEl = $('preview-items-list');
  if (listEl) {
    listEl.innerHTML = '';
    for (const h of config.highlights) {
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `<span class="preview-dot"></span><span>${h}</span>`;
      listEl.appendChild(item);
    }
    if (_selectedDailyLimit > 0) {
      const limitItem = document.createElement('div');
      limitItem.className = 'preview-item';
      limitItem.innerHTML = `<span class="preview-dot" style="background:#059669"></span><span><strong>${_selectedDailyLimit} min</strong> daily watch budget</span>`;
      listEl.appendChild(limitItem);
    }
    if (_softReminder) {
      const reminderItem = document.createElement('div');
      reminderItem.className = 'preview-item';
      reminderItem.innerHTML = `<span class="preview-dot" style="background:#059669"></span><span>30m break reminder active</span>`;
      listEl.appendChild(reminderItem);
    }
  }
}

function selectArchetype(archetypeKey) {
  _selectedArchetype = archetypeKey;
  document.querySelectorAll('.archetype-card').forEach(card => {
    const isTarget = card.getAttribute('data-archetype') === archetypeKey;
    card.classList.toggle('selected', isTarget);
    card.setAttribute('aria-checked', isTarget ? 'true' : 'false');
  });
  updateSummaryUI();
}

function selectDailyLimit(minutes) {
  _selectedDailyLimit = Number(minutes);
  document.querySelectorAll('.limit-pill-btn').forEach(btn => {
    const isTarget = Number(btn.getAttribute('data-limit')) === _selectedDailyLimit;
    btn.classList.toggle('selected', isTarget);
  });
  updateSummaryUI();
}

async function saveAndFinish() {
  const saveBtn = $('btn-save-setup');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const archetype = ARCHETYPE_CONFIGS[_selectedArchetype] || ARCHETYPE_CONFIGS.balanced;
    const fresh = await StorageManager.getSettings();

    const updates = {
      ...archetype.settings,
      dailyLimit: {
        ...fresh.dailyLimit,
        enabled: _selectedDailyLimit > 0,
        limitMinutes: _selectedDailyLimit > 0 ? _selectedDailyLimit : (fresh.dailyLimit?.limitMinutes || 60)
      },
      softReminder: {
        ...fresh.softReminder,
        enabled: _softReminder,
        intervalMinutes: 30
      }
    };

    // Filter to only modified keys
    for (const key of Object.keys(updates)) {
      if (JSON.stringify(updates[key]) === JSON.stringify(fresh[key])) {
        delete updates[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      await StorageManager.updateSettings(updates);
    }

    await browser.storage.local.set({ welcomeDismissed: true });

    const banner = $('wizard-success');
    if (banner) {
      banner.style.display = 'flex';
      banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      openYouTube();
    }, 600);
  } catch (err) {
    console.error('[IYT Welcome] Failed to save settings:', err);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save & start watching';
    }
  }
}

async function skipAndFinish() {
  try {
    await browser.storage.local.set({ welcomeDismissed: true });
    openYouTube();
  } catch (err) {
    console.error('[IYT Welcome] Failed to skip:', err);
    openYouTube();
  }
}

function openYouTube() {
  if (browser?.tabs?.create) {
    browser.tabs.create({ url: 'https://www.youtube.com' });
    window.close();
  } else {
    window.location.href = 'https://www.youtube.com';
  }
}

async function initWelcome() {
  try {
    _currentSettings = await StorageManager.getSettings();
    if (_currentSettings?.themeMode) {
      applyTheme(_currentSettings.themeMode);
    }
  } catch (e) {
    console.warn('[IYT Welcome] Could not load initial settings:', e);
  }

  // Setup Archetype listeners
  document.querySelectorAll('.archetype-card').forEach(card => {
    const key = card.getAttribute('data-archetype');
    card.addEventListener('click', () => selectArchetype(key));
    card.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        selectArchetype(key);
      }
    });
  });

  // Setup Limit pills listeners
  document.querySelectorAll('.limit-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectDailyLimit(btn.getAttribute('data-limit'));
    });
  });

  // Setup Reminder checkbox
  const reminderCheck = $('check-soft-reminder');
  if (reminderCheck) {
    reminderCheck.addEventListener('change', e => {
      _softReminder = e.target.checked;
      updateSummaryUI();
    });
  }

  // Action buttons
  $('btn-save-setup')?.addEventListener('click', saveAndFinish);
  $('btn-skip-setup')?.addEventListener('click', skipAndFinish);

  // Initial UI refresh
  updateSummaryUI();
}

document.addEventListener('DOMContentLoaded', initWelcome);
