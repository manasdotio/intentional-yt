/**
 * Timer and Toast Alert Component for Intentional YT
 * Passive session watch timer + soft toast reminder.
 */

class TimerToast {
  static trackingInterval = null;
  static sessionSeconds = 0;
  static unsavedSeconds = 0;
  static videoElement = null;
  static listenersAttached = false;
  static isTracking = false;

  /**
   * Start tracking watch time on the watch page.
   * Flushes any previous session state first.
   */
  static startTimer() {
    // If we are already tracking on the same video element, don't duplicate
    if (TimerToast.isTracking && TimerToast.videoElement && document.body.contains(TimerToast.videoElement)) {
      TimerToast.checkWatchLimit();
      return;
    }

    TimerToast.stopTimer(); // Flush any unsaved time and reset
    TimerToast.isTracking = true;
    TimerToast.sessionSeconds = 0;
    TimerToast.unsavedSeconds = 0;

    let attempts = 0;
    const locateInterval = setInterval(() => {
      attempts++;
      const video = document.querySelector('video');
      
      if (video) {
        TimerToast.videoElement = video;
        TimerToast.attachVideoListeners();
        clearInterval(locateInterval);

        // Check watch limit
        TimerToast.checkWatchLimit();

        // If the video is already playing, start timer loop
        if (!video.paused && !video.ended) {
          TimerToast.startAccumulating();
        }
      }

      if (attempts >= 15) {
        clearInterval(locateInterval);
      }
    }, 400);
  }

  /**
   * Stop tracking, flush pending seconds, and clean listeners.
   */
  static stopTimer() {
    TimerToast.isTracking = false;
    TimerToast.stopAccumulating();
    TimerToast.flushPendingSeconds();
    TimerToast.detachVideoListeners();
    TimerToast.videoElement = null;
    TimerToast.sessionSeconds = 0;
  }

  /**
   * Attach playback state event listeners to the video element.
   */
  static attachVideoListeners() {
    if (!TimerToast.videoElement || TimerToast.listenersAttached) return;
    
    TimerToast.videoElement.addEventListener('play', TimerToast.handlePlay);
    TimerToast.videoElement.addEventListener('pause', TimerToast.handlePause);
    TimerToast.videoElement.addEventListener('ended', TimerToast.handleEnded);
    
    TimerToast.listenersAttached = true;
  }

  /**
   * Remove playback event listeners.
   */
  static detachVideoListeners() {
    if (!TimerToast.videoElement || !TimerToast.listenersAttached) return;
    
    TimerToast.videoElement.removeEventListener('play', TimerToast.handlePlay);
    TimerToast.videoElement.removeEventListener('pause', TimerToast.handlePause);
    TimerToast.videoElement.removeEventListener('ended', TimerToast.handleEnded);
    
    TimerToast.listenersAttached = false;
  }

  static handlePlay = async () => {
    await TimerToast.checkWatchLimit();
    if (document.getElementById('iy-limit-overlay')) {
      const video = TimerToast.videoElement || document.querySelector('video');
      if (video) {
        video.pause();
      }
      return;
    }
    TimerToast.startAccumulating();
  };

  static handlePause = () => {
    TimerToast.stopAccumulating();
    TimerToast.flushPendingSeconds();
  };

  static handleEnded = () => {
    TimerToast.stopAccumulating();
    TimerToast.flushPendingSeconds();
    TimerToast.sessionSeconds = 0; // Reset session count for new video replay
  };

  /**
   * Start the 1-second watch timer loop.
   */
  static startAccumulating() {
    if (TimerToast.trackingInterval) return;

    TimerToast.trackingInterval = setInterval(async () => {
      const video = TimerToast.videoElement;
      
      // Ensure the video is actively playing (not buffering, paused, or ended)
      if (video && !video.paused && !video.ended && video.readyState >= 3) {
        TimerToast.sessionSeconds++;
        TimerToast.unsavedSeconds++;

        // Batch storage updates every 10 seconds
        if (TimerToast.unsavedSeconds >= 10) {
          await TimerToast.flushPendingSeconds();
        }

        // Check soft reminder criteria
        const settings = await StorageManager.getSettings();
        if (settings.extensionEnabled && settings.softReminder && settings.softReminder.enabled) {
          const intervalSecs = settings.softReminder.intervalMinutes * 60;
          if (intervalSecs > 0 && TimerToast.sessionSeconds >= intervalSecs) {
            TimerToast.showToast(settings.softReminder.intervalMinutes);
            TimerToast.sessionSeconds = 0; // Reset session interval count after showing toast
          }
        }
      }
    }, 1000);
  }

  /**
   * Pause the watch timer loop.
   */
  static stopAccumulating() {
    if (TimerToast.trackingInterval) {
      clearInterval(TimerToast.trackingInterval);
      TimerToast.trackingInterval = null;
    }
  }

  /**
   * Flush in-memory watch time directly to the browser storage.
   */
  static async flushPendingSeconds() {
    if (TimerToast.unsavedSeconds > 0) {
      const seconds = TimerToast.unsavedSeconds;
      TimerToast.unsavedSeconds = 0; // Reset to avoid double counts on race conditions
      
      try {
        await StorageManager.incrementWatchSeconds(seconds);
        await TimerToast.checkWatchLimit();
      } catch (error) {
        console.error('Failed to flush watch time seconds:', error);
        TimerToast.unsavedSeconds += seconds; // Restore on failure
      }
    }
  }

  /**
   * Check if today's watch limit is exceeded and apply pause + overlay.
   */
  static async checkWatchLimit() {
    if (window.location.pathname !== '/watch') {
      TimerToast.removeOverlay();
      return;
    }

    const settings = await StorageManager.getSettings();
    if (!settings.extensionEnabled) {
      TimerToast.removeOverlay();
      return;
    }

    const limitEnabled = settings.watchLimit && settings.watchLimit.enabled;
    if (!limitEnabled) {
      TimerToast.removeOverlay();
      return;
    }

    const todayWatchSeconds = (settings.stats && settings.stats.todayWatchSeconds) || 0;
    const limitMinutes = settings.watchLimit.limitMinutes || 60;
    const limitDismissed = settings.stats && settings.stats.limitDismissedToday;

    if (todayWatchSeconds / 60 >= limitMinutes) {
      if (!limitDismissed) {
        TimerToast.injectOverlay(limitMinutes);
      } else {
        TimerToast.removeOverlay();
      }
    } else {
      TimerToast.removeOverlay();
    }
  }

  /**
   * Inject the limit overlay into the video player.
   */
  static injectOverlay(limitMinutes) {
    if (document.getElementById('iy-limit-overlay')) {
      // Keep video paused
      const video = TimerToast.videoElement || document.querySelector('video');
      if (video && !video.paused) {
        video.pause();
      }
      return;
    }

    const playerContainer = document.getElementById('movie_player') || 
                            document.querySelector('.html5-video-player') || 
                            (TimerToast.videoElement ? TimerToast.videoElement.parentElement : null);
    if (!playerContainer) return;

    // Pause video
    const video = TimerToast.videoElement || document.querySelector('video');
    if (video && !video.paused) {
      video.pause();
    }

    const overlay = document.createElement('div');
    overlay.id = 'iy-limit-overlay';
    overlay.className = 'iy-limit-overlay';
    overlay.innerHTML = `
      <div class="iy-limit-message">
        You've reached your ${limitMinutes} min daily limit.
      </div>
      <button id="iy-limit-dismiss-btn" class="iy-limit-button">Dismiss for today</button>
    `;

    playerContainer.appendChild(overlay);

    const dismissBtn = overlay.querySelector('#iy-limit-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', async () => {
        try {
          const settings = await StorageManager.getSettings();
          if (!settings.stats) {
            settings.stats = {};
          }
          settings.stats.limitDismissedToday = true;
          await StorageManager.saveSettings(settings);
          overlay.remove();
        } catch (error) {
          console.error('Failed to dismiss watch limit:', error);
        }
      });
    }
  }

  /**
   * Remove the limit overlay.
   */
  static removeOverlay() {
    const overlay = document.getElementById('iy-limit-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  /**
   * Create and display the non-blocking, premium soft toast reminder.
   */
  static showToast(minutes) {
    const oldToast = document.getElementById('iy-soft-toast');
    if (oldToast) {
      oldToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'iy-soft-toast';
    toast.className = 'iy-toast-container';
    toast.innerHTML = `
      <div class="iy-toast-icon">⏳</div>
      <div class="iy-toast-message">You've been watching for ${minutes} minutes.</div>
      <div class="iy-toast-close">✕</div>
    `;

    document.body.appendChild(toast);

    // Subtle micro-animation to slide in
    setTimeout(() => {
      toast.classList.add('iy-toast-show');
    }, 50);

    const dismiss = () => {
      toast.classList.remove('iy-toast-show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    };

    // Auto-remove after 5 seconds
    const autoDismissTimer = setTimeout(dismiss, 5000);

    // Dismiss immediately on user click
    toast.addEventListener('click', (e) => {
      clearTimeout(autoDismissTimer);
      dismiss();
    });
  }
}

// Ensure flush runs on page leave or backgrounding
window.addEventListener('beforeunload', () => {
  TimerToast.flushPendingSeconds();
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    TimerToast.flushPendingSeconds();
  }
});

// Export for global access
window.TimerToast = TimerToast;
