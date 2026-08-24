/**
 * Popup Script for Intentional YT
 * Binds UI components and updates watch stats in real-time.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('master-toggle');
  const recsToggle = document.getElementById('recommendations-toggle');
  const autoplayToggle = document.getElementById('autoplay-toggle');
  const shortsToggle = document.getElementById('shorts-toggle');
  const commentsToggle = document.getElementById('comments-toggle');
  const thumbnailsToggle = document.getElementById('thumbnails-toggle');
  const grayscaleToggle = document.getElementById('grayscale-toggle');
  const reminderSelect = document.getElementById('reminder-select');
  
  const watchLimitToggle = document.getElementById('watch-limit-toggle');
  const watchLimitSelect = document.getElementById('watch-limit-select');
  const watchLimitDropdownRow = document.getElementById('watch-limit-dropdown-row');

  const watchTimeDisplay = document.getElementById('watch-time-display');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');

  /**
   * Read settings from storage and populate the popup interface.
   */
  async function loadSettings() {
    const settings = await StorageManager.getSettings();

    masterToggle.checked = settings.extensionEnabled;
    recsToggle.checked = settings.blockRecommendations;
    autoplayToggle.checked = settings.blockAutoplay;
    shortsToggle.checked = settings.blockShorts;
    commentsToggle.checked = settings.hideComments;
    thumbnailsToggle.checked = settings.hideThumbnails;
    grayscaleToggle.checked = settings.grayscaleMode;
    
    // Set reminder dropdown option
    if (settings.softReminder && settings.softReminder.enabled) {
      reminderSelect.value = settings.softReminder.intervalMinutes.toString();
    } else {
      reminderSelect.value = "0";
    }

    // Set watch limit settings
    if (settings.watchLimit) {
      watchLimitToggle.checked = settings.watchLimit.enabled;
      watchLimitSelect.value = (settings.watchLimit.limitMinutes || 60).toString();
    } else {
      watchLimitToggle.checked = false;
      watchLimitSelect.value = "60";
    }

    // Toggle dropdown visibility inline
    watchLimitDropdownRow.style.display = watchLimitToggle.checked ? 'flex' : 'none';

    updateUIState(settings);
    updateStatsDisplay(settings);
  }

  /**
   * Adjust body styling when the master toggle switches.
   */
  function updateUIState(settings) {
    if (settings.extensionEnabled) {
      document.body.classList.remove('disabled-mode');
    } else {
      document.body.classList.add('disabled-mode');
    }
  }

  /**
   * Render total daily watch time and percentage progress.
   */
  function updateStatsDisplay(settings) {
    const totalSeconds = (settings.stats && settings.stats.todayWatchSeconds) || 0;

    // Format display string: e.g. "1h 14m" or "25m" or "0m"
    let displayStr = '0m';
    if (totalSeconds >= 3600) {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      displayStr = `${hrs}h ${mins}m`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      displayStr = `${mins}m`;
    }
    watchTimeDisplay.textContent = displayStr;

    // Determine watch limit target (use configured soft reminder threshold, default to 60 minutes)
    let targetMinutes = 60;
    if (settings.softReminder && settings.softReminder.enabled && settings.softReminder.intervalMinutes > 0) {
      targetMinutes = settings.softReminder.intervalMinutes;
    }
    
    const targetSeconds = targetMinutes * 60;
    const percent = Math.min(100, Math.round((totalSeconds / targetSeconds) * 100));

    // Update progress bar GUI
    progressBarFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% of reminder interval (${targetMinutes}m)`;
  }

  /**
   * Read DOM control values and persist them to storage.
   */
  async function saveSettingsFromUI() {
    const enabled = masterToggle.checked;
    const recs = recsToggle.checked;
    const autoplay = autoplayToggle.checked;
    const shorts = shortsToggle.checked;
    const comments = commentsToggle.checked;
    const thumbnails = thumbnailsToggle.checked;
    const grayscale = grayscaleToggle.checked;
    const reminderVal = parseInt(reminderSelect.value, 10);

    const watchLimitEnabled = watchLimitToggle.checked;
    const watchLimitVal = parseInt(watchLimitSelect.value, 10);

    const settings = await StorageManager.getSettings();
    settings.extensionEnabled = enabled;
    settings.blockRecommendations = recs;
    settings.blockAutoplay = autoplay;
    settings.blockShorts = shorts;
    settings.hideComments = comments;
    settings.hideThumbnails = thumbnails;
    settings.grayscaleMode = grayscale;
    
    settings.softReminder = {
      enabled: reminderVal > 0,
      intervalMinutes: reminderVal > 0 ? reminderVal : (settings.softReminder ? settings.softReminder.intervalMinutes : 60)
    };

    settings.watchLimit = {
      enabled: watchLimitEnabled,
      limitMinutes: watchLimitVal
    };

    await StorageManager.saveSettings(settings);

    // Toggle dropdown visibility inline
    watchLimitDropdownRow.style.display = watchLimitEnabled ? 'flex' : 'none';

    updateUIState(settings);
    updateStatsDisplay(settings);
  }

  // Bind change event listeners
  masterToggle.addEventListener('change', saveSettingsFromUI);
  recsToggle.addEventListener('change', saveSettingsFromUI);
  autoplayToggle.addEventListener('change', saveSettingsFromUI);
  shortsToggle.addEventListener('change', saveSettingsFromUI);
  commentsToggle.addEventListener('change', saveSettingsFromUI);
  thumbnailsToggle.addEventListener('change', saveSettingsFromUI);
  grayscaleToggle.addEventListener('change', saveSettingsFromUI);
  reminderSelect.addEventListener('change', saveSettingsFromUI);
  watchLimitToggle.addEventListener('change', saveSettingsFromUI);
  watchLimitSelect.addEventListener('change', saveSettingsFromUI);

  // Run initial population
  await loadSettings();

  // Periodically refresh stats counters while the popup is open
  setInterval(async () => {
    const settings = await StorageManager.getSettings();
    updateStatsDisplay(settings);
  }, 1000);
});