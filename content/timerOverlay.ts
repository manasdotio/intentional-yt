/**
 * Ambient Intent Banner & Breathing Breaks for YouTube Focus Guard
 * Shows active intention, session watch time, and handles periodic breathing breaks.
 */

class TimerOverlay {
  private static instance: TimerOverlay;
  private banner: HTMLElement | null = null;
  private checkInOverlay: HTMLElement | null = null;
  private trackingInterval: number | null = null;
  private storage: any;
  private trackingEnabled: boolean = false;

  private sessionStart: number = Date.now();
  private elapsedSeconds: number = 0;
  private continuousPlaySeconds: number = 0;
  private isBreathingActive: boolean = false;

  static getInstance(): TimerOverlay {
    if (!TimerOverlay.instance) {
      TimerOverlay.instance = new TimerOverlay();
    }
    return TimerOverlay.instance;
  }

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.storage = (window as any).StorageManager.getInstance();
    this.createBanner();
    this.startTrackingLoop();
  }

  private createBanner(): void {
    if (document.getElementById('yfg-ambient-banner')) {
      return;
    }

    this.banner = document.createElement('div');
    this.banner.id = 'yfg-ambient-banner';
    this.banner.className = 'yfg-timer-overlay'; // Reuses styles from theme, customized with overrides
    this.banner.innerHTML = `
      <div class="yfg-timer-content" style="display: flex; align-items: center; gap: 10px; padding: 6px 12px; border-radius: 99px;">
        <span class="yfg-banner-pill-icon">🎯</span>
        <span class="yfg-banner-pill-text" id="yfg-banner-text" style="font-size: 12px; font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Focusing...</span>
        <span class="yfg-banner-pill-timer" id="yfg-banner-timer" style="font-family: monospace; font-size: 12px; opacity: 0.8; margin-left: 4px;">00:00</span>
        <button class="yfg-timer-btn" id="yfg-banner-options-btn" style="min-height: 20px; padding: 0 4px; border-radius: 4px; font-size: 10px; cursor: pointer; opacity: 0.7;">⚙️</button>
        
        <div id="yfg-banner-dropdown" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 8px; width: 220px; padding: 12px; border-radius: var(--yfg-radius-md); background: var(--yfg-color-surface-strong); border: 1px solid var(--yfg-color-border-strong); flex-direction: column; gap: 8px; box-shadow: var(--yfg-shadow-lg); z-index: 100000000000;">
          <input type="text" id="yfg-change-intent-input" class="input-field" placeholder="Change intention..." style="padding: 6px 8px; font-size: 12px;" />
          <div style="display: flex; gap: 6px;">
            <button class="yfg-btn yfg-btn-primary" id="yfg-change-intent-btn" style="flex: 1; min-height: 24px; font-size: 11px; padding: 4px;">Change</button>
            <button class="yfg-btn yfg-btn-danger" id="yfg-finish-intent-btn" style="flex: 1; min-height: 24px; font-size: 11px; padding: 4px; background: var(--yfg-color-danger) !important; color: #fff;">Finish</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.banner);
    this.banner.style.display = 'none';

    // Bind dropdown controls
    const optionsBtn = this.banner.querySelector('#yfg-banner-options-btn');
    const dropdown = this.banner.querySelector('#yfg-banner-dropdown') as HTMLElement;
    const changeInput = this.banner.querySelector('#yfg-change-intent-input') as HTMLInputElement;
    const changeBtn = this.banner.querySelector('#yfg-change-intent-btn');
    const finishBtn = this.banner.querySelector('#yfg-finish-intent-btn');

    optionsBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', () => {
      if (dropdown) dropdown.style.display = 'none';
    });

    dropdown?.addEventListener('click', (e) => e.stopPropagation());

    const updateIntention = async () => {
      const newText = changeInput.value.trim();
      if (newText) {
        await this.storage.setIntention(newText);
        changeInput.value = '';
        dropdown.style.display = 'none';
        
        await browser.runtime.sendMessage({
          type: 'intent-status-changed',
          data: { isIntentional: true }
        });
        
        window.location.reload();
      }
    };

    changeBtn?.addEventListener('click', () => void updateIntention());
    changeInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') void updateIntention();
    });

    finishBtn?.addEventListener('click', async () => {
      await this.storage.setIntention("");
      dropdown.style.display = 'none';
      
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: false }
      });
      
      window.location.href = 'https://www.youtube.com/';
    });
  }

  private startTrackingLoop(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }

    this.trackingInterval = setInterval(() => {
      if (this.trackingEnabled) {
        this.updateTime();
      }
    }, 1000) as any;
  }

  private async updateTime(): Promise<void> {
    const settings = await this.storage.getSettings();
    if (!settings.activeIntention) {
      this.hide();
      return;
    }

    // Initialize/sync elapsed time since session start
    const now = Date.now();
    const startTime = settings.intentionStartTime || now;
    this.elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));

    // Update banner UI text
    const textEl = document.getElementById('yfg-banner-text');
    const timerEl = document.getElementById('yfg-banner-timer');
    if (textEl) textEl.textContent = `Focusing on: "${settings.activeIntention}"`;
    if (timerEl) {
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = this.elapsedSeconds % 60;
      timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Monitor playback state for breathing break interval
    const video = document.querySelector('video') as HTMLVideoElement | null;
    const isPlaying = Boolean(video && !video.paused && !video.ended && video.readyState > 2);

    if (isPlaying && !this.isBreathingActive) {
      this.continuousPlaySeconds++;
      
      // Load configuration for breathing breaks
      const limitMinutes = settings.breathingBreaks?.intervalMinutes || 20;
      if (this.continuousPlaySeconds >= limitMinutes * 60) {
        this.triggerBreathingBreak();
      }
    }
  }

  private triggerBreathingBreak(): void {
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (video) {
      video.pause();
    }

    this.isBreathingActive = true;
    this.continuousPlaySeconds = 0;

    // Create Breathing overlay
    this.checkInOverlay = document.createElement('div');
    this.checkInOverlay.id = 'yfg-breathing-overlay';
    this.checkInOverlay.className = 'yfg-modal-overlay yfg-modal-page';
    this.checkInOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(11, 13, 18, 0.96);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      color: #fff;
    `;

    this.checkInOverlay.innerHTML = `
      <div class="yfg-modal-content" style="text-align: center; max-width: 480px; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 24px;">
        <h2 style="font-size: 22px; font-weight: 700; margin: 0;">💨 Mindful Check-in</h2>
        <p style="font-size: 14px; color: var(--yfg-color-text-muted); margin: 0;">Let's take a 30-second breathing break to break the screen trance.</p>
        
        <div class="yfg-breathing-animation-circle" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid var(--yfg-color-primary); display: flex; align-items: center; justify-content: center; position: relative; animation: yfg-inhale-exhale 8s infinite ease-in-out;">
          <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--yfg-color-primary); opacity: 0.6;"></div>
        </div>
        
        <div class="yfg-breathing-guide-text" style="font-size: 18px; font-weight: 700; color: var(--yfg-color-primary);">Inhale...</div>
        <div class="yfg-breathing-countdown" style="font-family: monospace; font-size: 13px; opacity: 0.7;">Breathing space: 30s left</div>

        <div class="yfg-check-in-questions" style="display: none; flex-direction: column; gap: 16px; width: 100%;">
          <p style="font-size: 14px; margin: 0; font-weight: 600;">You've been watching for a while. Is this video still matching your focus?</p>
          <div style="display: flex; gap: 12px; width: 100%;">
            <button class="yfg-btn yfg-btn-primary" id="yfg-break-resume-btn" style="flex: 1;">Yes, Keep Watching</button>
            <button class="yfg-btn yfg-btn-secondary" id="yfg-break-close-btn" style="flex: 1;">No, Close YouTube</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.checkInOverlay);

    // Style the custom breathing scale animation dynamically
    if (!document.getElementById('yfg-breathing-animation-style')) {
      const style = document.createElement('style');
      style.id = 'yfg-breathing-animation-style';
      style.textContent = `
        @keyframes yfg-inhale-exhale {
          0%, 100% { transform: scale(0.8); }
          50% { transform: scale(1.3); }
        }
      `;
      document.head.appendChild(style);
    }

    const animCircle = this.checkInOverlay.querySelector('.yfg-breathing-animation-circle') as HTMLElement;
    const guideText = this.checkInOverlay.querySelector('.yfg-breathing-guide-text') as HTMLElement;
    const countdownEl = this.checkInOverlay.querySelector('.yfg-breathing-countdown') as HTMLElement;
    const questionsBox = this.checkInOverlay.querySelector('.yfg-check-in-questions') as HTMLElement;

    // Breathing text switcher
    let textState = 0;
    const textInterval = setInterval(() => {
      textState = (textState + 1) % 3;
      if (guideText) {
        if (textState === 0) guideText.textContent = 'Inhale...';
        else if (textState === 1) guideText.textContent = 'Hold...';
        else guideText.textContent = 'Exhale...';
      }
    }, 4000);

    // 30 seconds timer
    let timeLeft = 30;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      if (countdownEl) countdownEl.textContent = `Breathing space: ${timeLeft}s left`;
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        clearInterval(textInterval);
        if (animCircle) animCircle.style.animation = 'none';
        if (guideText) guideText.textContent = 'Relaxed';
        if (countdownEl) countdownEl.style.display = 'none';
        if (questionsBox) questionsBox.style.display = 'flex';
      }
    }, 1000);

    // Bind checks buttons
    const resumeBtn = this.checkInOverlay.querySelector('#yfg-break-resume-btn');
    const closeBtn = this.checkInOverlay.querySelector('#yfg-break-close-btn');

    resumeBtn?.addEventListener('click', () => {
      clearInterval(countdownInterval);
      clearInterval(textInterval);
      this.checkInOverlay?.remove();
      this.checkInOverlay = null;
      this.isBreathingActive = false;
      if (video) {
        video.play();
      }
    });

    closeBtn?.addEventListener('click', async () => {
      clearInterval(countdownInterval);
      clearInterval(textInterval);
      this.checkInOverlay?.remove();
      this.checkInOverlay = null;
      this.isBreathingActive = false;
      
      await this.storage.setIntention("");
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: false }
      });

      window.location.href = 'https://www.youtube.com/';
    });
  }

  public startNewVideoSession(): void {
    this.sessionStart = Date.now();
    this.elapsedSeconds = 0;
    this.continuousPlaySeconds = 0;
    this.isBreathingActive = false;
    if (this.checkInOverlay) {
      this.checkInOverlay.remove();
      this.checkInOverlay = null;
    }
  }

  public setTrackingEnabled(enabled: boolean): void {
    this.trackingEnabled = enabled;
  }

  public show(): void {
    if (this.banner) {
      this.banner.style.display = 'block';
      this.attachOverlayToPlayer();
    }
  }

  public hide(): void {
    if (this.banner) {
      this.banner.style.display = 'none';
    }
  }

  private attachOverlayToPlayer(): void {
    if (!this.banner) return;
    
    // Position fixed to the window top right is best for a top-bar banner
    this.banner.style.cssText = `
      position: fixed;
      top: 12px;
      right: 180px;
      z-index: 100000000000;
      background: var(--yfg-color-surface-strong);
      border: 1px solid var(--yfg-color-border-strong);
      box-shadow: var(--yfg-shadow-sm);
      border-radius: 99px;
      backdrop-filter: var(--yfg-glass-backdrop);
    `;
    
    if (this.banner.parentNode !== document.body) {
      document.body.appendChild(this.banner);
    }
  }

  destroy(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    if (this.banner) {
      this.banner.remove();
    }
    if (this.checkInOverlay) {
      this.checkInOverlay.remove();
    }
  }
}

// Make available globally
(window as any).TimerOverlay = TimerOverlay;