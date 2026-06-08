/**
 * Popup Control Panel (Intent-First Mindful Assistant)
 * Manages active focus sessions, statistics visualization, and options toggles.
 */

class PopupManager {
  private storage: any;
  private timerInterval: number | null = null;
  private activeStartTime: number = 0;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.storage = (window as any).StorageManager.getInstance();
    
    await this.loadAndRender();
    this.setupEventListeners();
  }

  private async loadAndRender(): Promise<void> {
    const settings = await this.storage.getSettings();

    // 1. Sync Toggles and Settings
    this.setToggleState('extension-toggle', settings.extensionEnabled);
    this.setToggleState('shorts-block-toggle', settings.shortsBlocked);
    
    const select = document.getElementById('breathing-break-select') as HTMLSelectElement | null;
    if (select) {
      if (!settings.breathingBreaks.enabled) {
        select.value = "0";
      } else {
        select.value = settings.breathingBreaks.intervalMinutes.toString();
      }
    }

    // 2. Render Focus Area (Active vs Idle input)
    const activeBox = document.getElementById('active-intent-box');
    const noBox = document.getElementById('no-intent-box');
    const activeText = document.getElementById('active-intent-text');
    const inputField = document.getElementById('popup-intent-input') as HTMLInputElement | null;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (settings.activeIntention) {
      if (activeBox) activeBox.style.display = 'flex';
      if (noBox) noBox.style.display = 'none';
      if (activeText) activeText.textContent = `"${settings.activeIntention}"`;
      
      this.activeStartTime = settings.intentionStartTime || Date.now();
      this.startTimerUpdate();
    } else {
      if (activeBox) activeBox.style.display = 'none';
      if (noBox) noBox.style.display = 'flex';
      if (inputField) {
        inputField.value = '';
        inputField.focus();
      }
    }

    // 3. Render Today's Balance Statistics & SVG Ring
    const intentionalStat = document.getElementById('stat-intentional-time');
    const driftStat = document.getElementById('stat-drift-time');
    const totalStat = document.getElementById('stat-total-time');
    const indexText = document.getElementById('yfg-popup-ring-text');

    const todayWatch = settings.stats.todayWatchTime || 0;
    const todayIntentional = settings.stats.todayIntentionalTime || 0;
    const todayDrift = settings.stats.todayDriftTime || 0;
    
    const index = todayWatch > 0 
      ? Math.round((todayIntentional / todayWatch) * 100) 
      : 100;

    if (intentionalStat) intentionalStat.textContent = `${Math.round(todayIntentional / 60)}m`;
    if (driftStat) driftStat.textContent = `${Math.round(todayDrift / 60)}m`;
    if (totalStat) totalStat.textContent = `${Math.round(todayWatch / 60)}m`;
    if (indexText) indexText.textContent = `${index}%`;

    this.setProgressOffset(index);

    // 4. Render Today's Timeline History
    const historyList = document.getElementById('intent-history-list');
    if (historyList) {
      historyList.innerHTML = '';
      const history = settings.intentionHistory || [];
      const today = new Date().toDateString();
      const todayHistory = history.filter((h: any) => h.date === today);

      if (todayHistory.length === 0) {
        historyList.innerHTML = `<p style="font-size: 11px; color: var(--yfg-color-text-muted); font-style: italic; margin: 0; text-align: center;">No focus sessions logged today.</p>`;
      } else {
        todayHistory.forEach((h: any) => {
          const item = document.createElement('div');
          item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 4px;
            border: 1px solid var(--yfg-color-border);
          `;
          item.innerHTML = `
            <span style="font-weight: 500; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 200px;">🎯 ${h.text}</span>
            <span style="color: var(--yfg-color-primary); font-weight: bold;">${h.durationMinutes}m</span>
          `;
          historyList.appendChild(item);
        });
      }
    }
  }

  private setupEventListeners(): void {
    const extToggle = document.getElementById('extension-toggle');
    const shortsToggle = document.getElementById('shorts-block-toggle');
    const breakSelect = document.getElementById('breathing-break-select');
    
    const startBtn = document.getElementById('popup-start-intent-btn');
    const inputField = document.getElementById('popup-intent-input') as HTMLInputElement | null;
    
    const changeBtn = document.getElementById('popup-change-intent-btn');
    const finishBtn = document.getElementById('popup-finish-intent-btn');
    const resetBtn = document.getElementById('reset-stats-btn');

    // Enable/Disable toggles
    extToggle?.addEventListener('click', async () => {
      const settings = await this.storage.getSettings();
      const nextVal = !settings.extensionEnabled;
      await this.storage.saveSettings({ extensionEnabled: nextVal });
      this.setToggleState('extension-toggle', nextVal);
      this.notifyTabsOfChange();
    });

    shortsToggle?.addEventListener('click', async () => {
      const settings = await this.storage.getSettings();
      const nextVal = !settings.shortsBlocked;
      await this.storage.saveSettings({ shortsBlocked: nextVal });
      this.setToggleState('shorts-block-toggle', nextVal);
      this.notifyTabsOfChange();
    });

    breakSelect?.addEventListener('change', async (e) => {
      const select = e.target as HTMLSelectElement;
      const val = parseInt(select.value);
      await this.storage.saveSettings({
        breathingBreaks: {
          enabled: val > 0,
          intervalMinutes: val > 0 ? val : 20
        }
      });
      this.notifyTabsOfChange();
    });

    // Intention actions
    const triggerStart = async () => {
      if (!inputField) return;
      const text = inputField.value.trim();
      if (text) {
        await this.storage.setIntention(text);
        
        await browser.runtime.sendMessage({
          type: 'intent-status-changed',
          data: { isIntentional: true }
        });

        await this.loadAndRender();
        this.notifyTabsOfChange();
      }
    };

    startBtn?.addEventListener('click', () => void triggerStart());
    inputField?.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') void triggerStart();
    });

    changeBtn?.addEventListener('click', async () => {
      const settings = await this.storage.getSettings();
      // Remove active state temporarily so user can edit in input
      if (inputField) {
        inputField.value = settings.activeIntention;
      }
      
      const activeBox = document.getElementById('active-intent-box');
      const noBox = document.getElementById('no-intent-box');
      if (activeBox) activeBox.style.display = 'none';
      if (noBox) noBox.style.display = 'flex';
      if (inputField) inputField.focus();
    });

    finishBtn?.addEventListener('click', async () => {
      await this.storage.setIntention("");
      
      await browser.runtime.sendMessage({
        type: 'intent-status-changed',
        data: { isIntentional: false }
      });

      await this.loadAndRender();
      this.notifyTabsOfChange();
    });

    // Reset daily statistics
    resetBtn?.addEventListener('click', async () => {
      const confirmed = confirm('Are you sure you want to reset today\'s intention statistics?');
      if (confirmed) {
        await this.storage.resetDailyStats();
        
        await browser.runtime.sendMessage({
          type: 'intent-status-changed',
          data: { isIntentional: false }
        });

        await this.loadAndRender();
        this.notifyTabsOfChange();
      }
    });
  }

  private startTimerUpdate(): void {
    const timerText = document.getElementById('active-intent-timer');
    const update = () => {
      if (!timerText) return;
      const elapsedSecs = Math.max(0, Math.floor((Date.now() - this.activeStartTime) / 1000));
      const mins = Math.floor(elapsedSecs / 60);
      const secs = elapsedSecs % 60;
      timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} elapsed`;
    };
    
    update();
    this.timerInterval = setInterval(update, 1000) as any;
  }

  private setToggleState(id: string, active: boolean): void {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.classList.toggle('is-active', active);
      const thumb = toggle.querySelector('.yfg-toggle-button-thumb') as HTMLElement | null;
      if (thumb) {
        thumb.style.transform = active ? 'translateX(16px)' : 'translateX(0)';
      }
    }
  }

  private setProgressOffset(percent: number): void {
    const circle = document.getElementById('yfg-popup-ring-fill') as SVGCircleElement | null;
    if (!circle) return;
    const radius = 28;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (percent / 100) * circumference;
    circle.style.strokeDashoffset = offset.toString();
  }

  private notifyTabsOfChange(): void {
    browser.tabs.query({ url: ['*://www.youtube.com/*', '*://youtube.com/*'] }).then((tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          browser.tabs.sendMessage(tab.id, { type: 'intent-updated' }).catch(() => {});
        }
      }
    });
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});