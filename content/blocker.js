/**
 * Blocker Component for Intentional YT
 * Handles CSS injection for layout blocking and autoplay disable features.
 */

class Blocker {
  /**
   * Inject the blocker stylesheet from the extension assets.
   */
  static injectCSS() {
    if (document.getElementById('iy-blocker-style')) {
      return;
    }
    
    const link = document.createElement('link');
    link.id = 'iy-blocker-style';
    link.rel = 'stylesheet';
    link.href = browser.runtime.getURL('styles/blocker.css');
    
    // Append to document.head, fallback to documentElement if head doesn't exist yet
    (document.head || document.documentElement).appendChild(link);
  }

  /**
   * Remove the blocker stylesheet to restore standard YouTube elements.
   */
  static removeCSS() {
    const link = document.getElementById('iy-blocker-style');
    if (link) {
      link.remove();
    }
    const html = document.documentElement;
    if (html) {
      html.classList.remove(
        'block-recommendations',
        'blockShorts',
        'hide-comments',
        'hide-thumbnails',
        'grayscale-mode'
      );
    }
  }

  /**
   * Toggle CSS blocker classes on document.documentElement.
   */
  static updateToggles(settings) {
    const html = document.documentElement;
    if (!html) return;

    const enabled = settings.extensionEnabled;

    html.classList.toggle('block-recommendations', !!(enabled && settings.blockRecommendations));
    html.classList.toggle('blockShorts', !!(enabled && settings.blockShorts));
    html.classList.toggle('hide-comments', !!(enabled && settings.hideComments));
    html.classList.toggle('hide-thumbnails', !!(enabled && settings.hideThumbnails));
    html.classList.toggle('grayscale-mode', !!(enabled && settings.grayscaleMode));
  }

  /**
   * Find and forcefully turn off YouTube's autoplay toggles and player parameters.
   */
  static disableAutoplay() {
    let attempts = 0;
    
    // Check at intervals since YouTube players load asynchronously
    const autoplayInterval = setInterval(() => {
      attempts++;
      
      const autoplayButton = document.querySelector(
        '.ytp-autonav-toggle-button, ' +
        '[data-tooltip-text*="autoplay" i], ' +
        'button[aria-label*="Autoplay" i]'
      );

      if (autoplayButton) {
        const isChecked = 
          autoplayButton.getAttribute('aria-checked') === 'true' || 
          autoplayButton.getAttribute('aria-pressed') === 'true' ||
          autoplayButton.classList.contains('ytp-autonav-toggle-button-checked'); // Fallback class check

        if (isChecked) {
          autoplayButton.click();
        }
        clearInterval(autoplayInterval);
      }

      // Also strip autoplay attribute from all video elements
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        video.removeAttribute('autoplay');
      });

      if (attempts >= 15) {
        clearInterval(autoplayInterval);
      }
    }, 400);
  }
}

// Export for global access in content script sandbox
window.Blocker = Blocker;
