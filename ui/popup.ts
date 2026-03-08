/**
 * Popup Controller for YouTube Focus Guard
 * Handles the extension popup interface and settings
 */

class PopupController {
  private storage: any;
  private timeUtils: any;
  private updateInterval: number | null = null;
  private activeTab: 'control' | 'research' | 'settings' = 'control';

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    await this.waitForDependencies();
    
    this.storage = (window as any).StorageManager.getInstance();
    this.timeUtils = (window as any).TimeUtils.getInstance();
    
    this.setupEventListeners();
    await this.loadSettings();
    this.startProgressUpdates();
  }

  private async waitForDependencies(): Promise<void> {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if ((window as any).StorageManager && (window as any).TimeUtils) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  private setupEventListeners(): void {
    const tabButtons = document.querySelectorAll<HTMLElement>('[data-tab]');
    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab') as 'control' | 'research' | 'settings' | null;
        if (tabName) {
          this.setActiveTab(tabName);
        }
      });
    });

    const settingsShortcut = document.getElementById('open-settings-tab');
    settingsShortcut?.addEventListener('click', () => this.setActiveTab('settings'));

    // Extension toggle
    const extensionToggle = document.getElementById('extension-toggle');
    extensionToggle?.addEventListener('click', this.toggleExtension.bind(this));

    // Night lock toggle
    const nightlockToggle = document.getElementById('nightlock-toggle');
    nightlockToggle?.addEventListener('click', this.toggleNightlock.bind(this));

    // Night lock time inputs
    const nightlockStart = document.getElementById('nightlock-start') as HTMLInputElement;
    const nightlockEnd = document.getElementById('nightlock-end') as HTMLInputElement;
    
    nightlockStart?.addEventListener('change', this.updateNightlockTimes.bind(this));
    nightlockEnd?.addEventListener('change', this.updateNightlockTimes.bind(this));

    // Entertainment limit
    const entertainmentLimit = document.getElementById('entertainment-limit') as HTMLInputElement;
    entertainmentLimit?.addEventListener('change', this.updateEntertainmentLimit.bind(this));

    const browsingDuration = document.getElementById('browsing-duration') as HTMLInputElement;
    browsingDuration?.addEventListener('change', this.updateBrowsingDuration.bind(this));

    // Quick action buttons
    const startResearchBtn = document.getElementById('start-research');
    const resetDailyBtn = document.getElementById('reset-daily');
    const saveTopicBtn = document.getElementById('save-topic');
    const clearTopicBtn = document.getElementById('clear-topic');
    const addResearchChannelBtn = document.getElementById('add-research-channel');
    const currentTopicInput = document.getElementById('current-topic') as HTMLInputElement | null;
    const researchChannelInput = document.getElementById('research-channel-input') as HTMLInputElement | null;
    const researchChannelList = document.getElementById('research-channel-list');
    
    startResearchBtn?.addEventListener('click', this.startResearchSession.bind(this));
    resetDailyBtn?.addEventListener('click', this.resetDailyStats.bind(this));
    saveTopicBtn?.addEventListener('click', this.saveCurrentTopic.bind(this));
    clearTopicBtn?.addEventListener('click', this.clearCurrentTopic.bind(this));
    addResearchChannelBtn?.addEventListener('click', this.addResearchChannelFromInput.bind(this));

    currentTopicInput?.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.saveCurrentTopic();
      }
    });

    currentTopicInput?.addEventListener('input', () => {
      this.setTopicStatus('Press Enter or Apply to save changes.');
    });

    researchChannelInput?.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void this.addResearchChannelFromInput();
      }
    });

    researchChannelList?.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement | null;
      const channelName = target?.getAttribute('data-channel');
      if (target?.matches('[data-action="remove-channel"]') && channelName) {
        void this.removeResearchChannel(channelName);
      }
    });

    const modeResearchBtn = document.getElementById('mode-research');
    const modeEntertainmentBtn = document.getElementById('mode-entertainment');
    const stopBrowsingBtn = document.getElementById('stop-browsing');
    modeResearchBtn?.addEventListener('click', () => this.switchMode('research'));
    modeEntertainmentBtn?.addEventListener('click', () => this.switchMode('entertainment'));
    stopBrowsingBtn?.addEventListener('click', this.stopBrowsing.bind(this));
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.storage.getSettings();
    
    this.updateToggle('extension-toggle', settings.extensionEnabled !== false);
    this.updateToggle('nightlock-toggle', settings.nightLock.enabled);
    
    // Update time inputs
    const nightlockStart = document.getElementById('nightlock-start') as HTMLInputElement;
    const nightlockEnd = document.getElementById('nightlock-end') as HTMLInputElement;
    
    if (nightlockStart) nightlockStart.value = settings.nightLock.startTime;
    if (nightlockEnd) nightlockEnd.value = settings.nightLock.endTime;

    // Update entertainment limit
    const entertainmentLimit = document.getElementById('entertainment-limit') as HTMLInputElement;
    if (entertainmentLimit) entertainmentLimit.value = settings.entertainment.dailyLimit.toString();

    // Update stats
    this.updateStats(settings);
    await this.updateCurrentSession(settings);
    this.updateCurrentTopic(settings);
    this.updateBrowsingStatus(settings);
    this.updateAllowedChannels(settings);
    this.updateLimits(settings);
    this.updateBrowsingSettings(settings);
  }

  private updateToggle(toggleId: string, isActive: boolean): void {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  }

  private updateStats(settings: any): void {
    const totalWatchTime = document.getElementById('total-watch-time');
    const researchTime = document.getElementById('research-time');
    const entertainmentTime = document.getElementById('entertainment-time');
    const entertainmentUsed = document.getElementById('entertainment-used');

    if (totalWatchTime) {
      totalWatchTime.textContent = this.timeUtils.formatDuration(Math.round(settings.stats.todayWatchTime / 60));
    }
    
    if (researchTime) {
      researchTime.textContent = this.timeUtils.formatDuration(Math.round(settings.stats.todayResearchTime / 60));
    }

    if (entertainmentTime) {
      entertainmentTime.textContent = this.timeUtils.formatDuration(Math.round(settings.stats.todayEntertainmentTime / 60));
    }
    
    if (entertainmentUsed) {
      const used = settings.entertainment.todayUsed;
      const limit = settings.entertainment.dailyLimit;
      entertainmentUsed.textContent = `${used}/${limit}m used today`;
    }
  }

  private async updateCurrentSession(settings: any): Promise<void> {
    const headerMode = document.getElementById('header-mode');
    const headerTopic = document.getElementById('header-topic');
    const currentMode = document.getElementById('current-mode');
    const sessionTopic = document.getElementById('session-topic');
    const sessionTime = document.getElementById('session-time');
    const modeResearchBtn = document.getElementById('mode-research');
    const modeEntertainmentBtn = document.getElementById('mode-entertainment');
    const currentTopic = Array.isArray(settings.research.currentTopic) ? settings.research.currentTopic : [];
    const topicText = currentTopic.length > 0 ? this.formatTopic(currentTopic) : 'No active topic';
    const sessionStats = await this.getActiveTabSessionStats();

    if (settings.browsingMode && settings.browsingMode.active) {
      modeResearchBtn?.classList.remove('yfg-btn-mode-active');
      modeEntertainmentBtn?.classList.remove('yfg-btn-mode-active');
      const remainingSeconds = Math.max(0, Math.ceil((settings.browsingMode.startTime + settings.browsingMode.duration - Date.now()) / 1000));
      if (headerMode) {
        headerMode.textContent = 'Browsing';
        headerMode.classList.add('is-browsing');
      }
      if (headerTopic) {
        headerTopic.textContent = 'Temporary browsing session in progress';
      }
      if (currentMode) {
        currentMode.textContent = 'Browsing';
      }
      if (sessionTopic) {
        sessionTopic.textContent = 'Intentional browsing window';
      }
      if (sessionTime) {
        sessionTime.textContent = remainingSeconds > 0 ? this.timeUtils.formatTime(remainingSeconds) : 'Waiting';
      }
      document.body.dataset.mode = 'browsing';
      return;
    }

    const mode = settings.research.mode;
    const modeLabel = this.getModeLabel(mode);

    if (headerMode) {
      headerMode.textContent = modeLabel;
      headerMode.classList.remove('is-browsing');
    }

    if (headerTopic) {
      headerTopic.textContent = topicText;
    }

    if (currentMode) {
      currentMode.textContent = modeLabel;
    }

    if (sessionTopic) {
      sessionTopic.textContent = topicText;
    }

    if (modeResearchBtn) {
      modeResearchBtn.classList.toggle('yfg-btn-mode-active', mode === 'research');
      modeResearchBtn.setAttribute('aria-pressed', mode === 'research' ? 'true' : 'false');
    }
    if (modeEntertainmentBtn) {
      modeEntertainmentBtn.classList.toggle('yfg-btn-mode-active', mode === 'entertainment');
      modeEntertainmentBtn.setAttribute('aria-pressed', mode === 'entertainment' ? 'true' : 'false');
    }

    if (sessionTime) {
      const watchTimeSeconds = sessionStats?.currentWatchTimeSeconds ?? settings.watchTimer.currentWatchTime ?? 0;
      if (sessionStats || watchTimeSeconds > 0) {
        sessionTime.textContent = this.timeUtils.formatDuration(Math.floor(watchTimeSeconds / 60));
      } else {
        sessionTime.textContent = '--';
      }
    }

    document.body.dataset.mode = mode || 'idle';
  }

  private async getActiveTabSessionStats(): Promise<{ currentWatchTimeSeconds: number; isPlaying: boolean; mode: 'research' | 'entertainment' | null; lastActivity: number; } | null> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTabId = tabs[0]?.id;

      if (!activeTabId) {
        return null;
      }

      return await browser.runtime.sendMessage({
        type: 'get-session-stats',
        data: { tabId: activeTabId }
      });
    } catch {
      return null;
    }
  }

  private updateCurrentTopic(settings: any): void {
    const topicInput = document.getElementById('current-topic') as HTMLInputElement | null;
    const topicStatus = document.getElementById('current-topic-status');
    const currentTopic = Array.isArray(settings.research.currentTopic) ? settings.research.currentTopic : [];
    const joinedTopic = currentTopic.join(', ');

    if (topicInput && document.activeElement !== topicInput) {
      topicInput.value = joinedTopic;
    }

    if (topicStatus) {
      topicStatus.classList.remove('is-error');
      if (settings.research.mode === 'research' && currentTopic.length > 0) {
        topicStatus.textContent = `${currentTopic.length} topic keyword${currentTopic.length === 1 ? '' : 's'} active.`;
      } else if (settings.research.mode === 'research') {
        topicStatus.textContent = 'Research mode is active, but no topic is set yet.';
      } else if (currentTopic.length > 0) {
        topicStatus.textContent = 'Saved topic keywords will be used when Research mode is active.';
      } else {
        topicStatus.textContent = 'Used by Research mode drift detection.';
      }
    }
  }

  private updateBrowsingStatus(settings: any): void {
    const container = document.getElementById('browsing-status') as HTMLElement | null;
    const timeRemaining = document.getElementById('browsing-remaining');

    if (!container) {
      return;
    }

    if (settings.browsingMode && settings.browsingMode.active) {
      const remainingSeconds = Math.max(0, Math.ceil((settings.browsingMode.startTime + settings.browsingMode.duration - Date.now()) / 1000));
      container.hidden = false;
      if (timeRemaining) {
        timeRemaining.textContent = remainingSeconds > 0 ? this.timeUtils.formatTime(remainingSeconds) : 'Awaiting choice';
      }
      return;
    }

    container.hidden = true;
  }

  private updateLimits(settings: any): void {
    const nightLockStatus = document.getElementById('night-lock-status');
    const nightLockWindow = document.getElementById('night-lock-window');
    const limitSummary = document.getElementById('entertainment-limit-summary');

    if (nightLockStatus) {
      nightLockStatus.textContent = settings.nightLock.enabled ? 'On' : 'Off';
      nightLockStatus.classList.toggle('is-off', !settings.nightLock.enabled);
    }

    if (nightLockWindow) {
      nightLockWindow.textContent = `${this.formatClock(settings.nightLock.startTime)} → ${this.formatClock(settings.nightLock.endTime)}`;
    }

    if (limitSummary) {
      limitSummary.textContent = `${settings.entertainment.dailyLimit} minutes per day`;
    }
  }

  private updateBrowsingSettings(settings: any): void {
    const browsingDuration = document.getElementById('browsing-duration') as HTMLInputElement | null;
    const browsingExtensionsSummary = document.getElementById('browsing-extensions-summary');
    const remainingExtensions = Math.max(0, 2 - (settings.browsingMode.extensionsUsed || 0));

    if (browsingDuration) {
      browsingDuration.value = Math.max(1, Math.round((settings.browsingMode.duration || (15 * 60 * 1000)) / 60000)).toString();
    }

    if (browsingExtensionsSummary) {
      browsingExtensionsSummary.textContent = `${remainingExtensions} left before cooldown, 2 maximum total`;
    }
  }

  private setActiveTab(tabName: 'control' | 'research' | 'settings'): void {
    this.activeTab = tabName;

    const tabButtons = document.querySelectorAll<HTMLElement>('[data-tab]');
    tabButtons.forEach((button) => {
      const isActive = button.getAttribute('data-tab') === tabName;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    const tabPanels = document.querySelectorAll<HTMLElement>('[data-tab-panel]');
    tabPanels.forEach((panel) => {
      const isActive = panel.getAttribute('data-tab-panel') === tabName;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  private updateAllowedChannels(settings: any): void {
    const listContainer = document.getElementById('research-channel-list') as HTMLElement | null;
    const status = document.getElementById('research-channel-status');
    const channels = Array.isArray(settings.research.allowedChannels) ? settings.research.allowedChannels : [];

    if (!listContainer) {
      return;
    }

    status?.classList.remove('is-error');

    if (channels.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'yfg-allowlist-empty';
      emptyState.textContent = 'No allowed research channels yet.';
      listContainer.replaceChildren(emptyState);
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const channel of channels) {
      const item = document.createElement('div');
      item.className = 'yfg-allowlist-item';

      const name = document.createElement('span');
      name.className = 'yfg-allowlist-name';
      name.textContent = channel;

      const removeButton = document.createElement('button');
      removeButton.className = 'yfg-allowlist-remove';
      removeButton.type = 'button';
      removeButton.dataset.action = 'remove-channel';
      removeButton.dataset.channel = channel;
      removeButton.setAttribute('aria-label', `Remove ${channel}`);
      removeButton.textContent = '×';

      item.append(name, removeButton);
      fragment.appendChild(item);
    }

    listContainer.replaceChildren(fragment);
  }

  private normalizeTopicInput(value: string): string[] {
    const parts = value.includes(',') || value.includes('\n')
      ? value.split(/[\n,]+/)
      : value.split(/\s+/);

    return [...new Set(parts.map((part) => part.trim().toLowerCase()).filter(Boolean))];
  }

  private normalizeChannelName(value: string): string {
    return (value || '').toLowerCase().trim();
  }

  private setResearchChannelStatus(message: string, isError: boolean = false): void {
    const status = document.getElementById('research-channel-status') as HTMLElement | null;
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  private setTopicStatus(message: string, isError: boolean = false): void {
    const status = document.getElementById('current-topic-status') as HTMLElement | null;
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle('is-error', isError);
  }

  private async saveAllowedChannels(channels: string[]): Promise<string[]> {
    const normalizedChannels = [...new Set((channels || []).map((channel) => this.normalizeChannelName(channel)).filter(Boolean))];
    await this.storage.updateResearchSettings({ allowedChannels: normalizedChannels });

    await this.notifyResearchSettingsUpdated();

    return normalizedChannels;
  }

  private async notifyResearchSettingsUpdated(): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id, { type: 'research-settings-updated' });
      }
    } catch {
      // Ignore when the active tab does not have the content script.
    }
  }

  private async addResearchChannel(channelName: string): Promise<void> {
    const normalizedChannel = this.normalizeChannelName(channelName);
    if (!normalizedChannel) {
      this.setResearchChannelStatus('Enter a channel name first.', true);
      return;
    }

    const settings = await this.storage.getSettings();
    const channels = Array.isArray(settings.research.allowedChannels) ? settings.research.allowedChannels : [];
    if (channels.includes(normalizedChannel)) {
      this.setResearchChannelStatus(`Already allowed: ${normalizedChannel}`);
      return;
    }

    await this.saveAllowedChannels([...channels, normalizedChannel]);
    this.setResearchChannelStatus(`Added allowed channel: ${normalizedChannel}`);
    await this.loadSettings();
  }

  private async addResearchChannelFromInput(): Promise<void> {
    const input = document.getElementById('research-channel-input') as HTMLInputElement | null;
    if (!input) return;

    await this.addResearchChannel(input.value);
    input.value = '';
  }

  private async removeResearchChannel(channelName: string): Promise<void> {
    const normalizedChannel = this.normalizeChannelName(channelName);
    const settings = await this.storage.getSettings();
    const channels = Array.isArray(settings.research.allowedChannels) ? settings.research.allowedChannels : [];
    const nextChannels = channels.filter((channel: string) => channel !== normalizedChannel);

    await this.saveAllowedChannels(nextChannels);
    this.setResearchChannelStatus(`Removed allowed channel: ${normalizedChannel}`);
    await this.loadSettings();
  }

  private async saveCurrentTopic(): Promise<void> {
    const topicInput = document.getElementById('current-topic') as HTMLInputElement | null;
    if (!topicInput) return;

    const settings = await this.storage.getSettings();
    const currentTopic = this.normalizeTopicInput(topicInput.value);

    await this.storage.saveSettings({
      research: {
        mode: settings.research.mode,
        currentTopic: currentTopic,
        sessionStart: settings.research.sessionStart
      }
    });

    if (settings.research.mode) {
      await this.notifyActiveTabModeChange(settings.research.mode);
    }

    this.setTopicStatus(currentTopic.length > 0 ? 'Research topic saved.' : 'Topic cleared.');
    await this.loadSettings();
  }

  private async clearCurrentTopic(): Promise<void> {
    const settings = await this.storage.getSettings();

    await this.storage.saveSettings({
      research: {
        mode: settings.research.mode,
        currentTopic: [],
        sessionStart: settings.research.sessionStart
      }
    });

    if (settings.research.mode) {
      await this.notifyActiveTabModeChange(settings.research.mode);
    }

    this.setTopicStatus('Topic cleared.');
    await this.loadSettings();
  }

  private async switchMode(mode: 'research' | 'entertainment'): Promise<void> {
    const settings = await this.storage.getSettings();
    const topicInput = document.getElementById('current-topic') as HTMLInputElement | null;
    const editedTopic = topicInput ? this.normalizeTopicInput(topicInput.value) : settings.research.currentTopic;

    if (settings.browsingMode && settings.browsingMode.active) {
      await this.storage.updateBrowsingMode({
        active: false,
        startTime: 0,
        duration: 15 * 60 * 1000,
        extensionsUsed: 0,
      });
      await this.notifyStopBrowsing();
    }

    await this.storage.saveSettings({
      research: {
        mode: mode,
        currentTopic: mode === 'entertainment' ? [] : editedTopic,
        sessionStart: settings.research.sessionStart || Date.now()
      }
    });

    await this.notifyActiveTabModeChange(mode);
    await this.loadSettings();
  }

  private async notifyActiveTabModeChange(mode: 'research' | 'entertainment'): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id, { type: 'mode-change', data: { mode } });
      }
    } catch {
      // Ignore when the active tab does not have the content script.
    }
  }

  private async notifyStopBrowsing(): Promise<void> {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await browser.tabs.sendMessage(tabs[0].id, { type: 'stop-browsing' });
      }
    } catch {
      // Ignore when the active tab does not have the content script.
    }
  }

  private async stopBrowsing(): Promise<void> {
    await this.storage.updateBrowsingMode({
      active: false,
      startTime: 0,
      duration: 15 * 60 * 1000,
      extensionsUsed: 0,
    });
    await this.notifyStopBrowsing();
    await this.loadSettings();
  }

  private async toggleExtension(): Promise<void> {
    const toggle = document.getElementById('extension-toggle');
    const isCurrentlyActive = Boolean(toggle?.classList.contains('active'));
    const newState = !isCurrentlyActive;
    this.updateToggle('extension-toggle', newState);
    await this.storage.saveSettings({ extensionEnabled: newState });
    await this.loadSettings();
  }

  private async toggleNightlock(): Promise<void> {
    const settings = await this.storage.getSettings();
    const newState = !settings.nightLock.enabled;
    
    await this.storage.saveSettings({
      nightLock: {
        enabled: newState,
        startTime: settings.nightLock.startTime,
        endTime: settings.nightLock.endTime
      }
    });
    
    this.updateToggle('nightlock-toggle', newState);
    await this.loadSettings();
  }

  private async updateNightlockTimes(): Promise<void> {
    const nightlockStart = document.getElementById('nightlock-start') as HTMLInputElement;
    const nightlockEnd = document.getElementById('nightlock-end') as HTMLInputElement;
    
    if (!nightlockStart || !nightlockEnd) return;

    const startTime = nightlockStart.value;
    const endTime = nightlockEnd.value;
    
    await this.storage.saveSettings({
      nightLock: {
        enabled: true,
        startTime: startTime,
        endTime: endTime
      }
    });

    await this.loadSettings();
  }

  private async updateEntertainmentLimit(): Promise<void> {
    const entertainmentLimit = document.getElementById('entertainment-limit') as HTMLInputElement;
    
    if (!entertainmentLimit) return;

    const limit = parseInt(entertainmentLimit.value, 10);
    
    if (limit >= 5 && limit <= 180) {
      const settings = await this.storage.getSettings();
      await this.storage.saveSettings({
        entertainment: {
          dailyLimit: limit,
          todayUsed: settings.entertainment.todayUsed,
          lastResetDate: settings.entertainment.lastResetDate
        }
      });
      await this.loadSettings();
    }
  }

  private async updateBrowsingDuration(): Promise<void> {
    const browsingDuration = document.getElementById('browsing-duration') as HTMLInputElement | null;
    if (!browsingDuration) return;

    const minutes = parseInt(browsingDuration.value, 10);
    if (minutes >= 5 && minutes <= 60) {
      const settings = await this.storage.getSettings();
      await this.storage.updateBrowsingMode({
        active: settings.browsingMode.active,
        startTime: settings.browsingMode.startTime,
        duration: minutes * 60 * 1000,
        extensionsUsed: settings.browsingMode.extensionsUsed,
        cooldownUntil: settings.browsingMode.cooldownUntil
      });
      await this.loadSettings();
    }
  }

  private async startResearchSession(): Promise<void> {
    const topicInput = document.getElementById('current-topic') as HTMLInputElement | null;
    const topicValue = topicInput?.value.trim() || '';
    const settings = await this.storage.getSettings();
    const currentTopic = topicValue ? this.normalizeTopicInput(topicValue) : settings.research.currentTopic;
    const query = topicValue || (Array.isArray(currentTopic) ? currentTopic.join(' ') : '');

    if (!query.trim() || !Array.isArray(currentTopic) || currentTopic.length === 0) {
      this.setTopicStatus('Enter a research topic before starting a session.', true);
      this.setActiveTab('research');
      topicInput?.focus();
      return;
    }

    await this.storage.saveSettings({
      research: {
        mode: 'research',
        currentTopic: currentTopic,
        sessionStart: Date.now()
      }
    });

    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    await browser.tabs.create({ url: searchUrl });
    window.close();
  }

  private async resetDailyStats(): Promise<void> {
    if (confirm('Reset today\'s watch time statistics? This cannot be undone.')) {
      await this.storage.resetDailyLimits();
      
      // Reload settings to update UI
      await this.loadSettings();
    }
  }

  private startProgressUpdates(): void {
    // Update stats every 5 seconds
    this.updateInterval = setInterval(async () => {
      const settings = await this.storage.getSettings();
      this.updateStats(settings);
      await this.updateCurrentSession(settings);
      this.updateCurrentTopic(settings);
      this.updateBrowsingStatus(settings);
      this.updateAllowedChannels(settings);
      this.updateLimits(settings);
      this.updateBrowsingSettings(settings);
    }, 5000) as any;
  }

    private getModeLabel(mode: 'research' | 'entertainment' | null): string {
      if (mode === 'research') {
        return 'Research';
      }

      if (mode === 'entertainment') {
        return 'Entertainment';
      }

      return 'Idle';
    }

    private formatTopic(topicParts: string[]): string {
      const joined = Array.isArray(topicParts) ? topicParts.join(', ') : '';
      if (!joined) {
        return 'No active topic';
      }

      return joined.length > 40 ? `${joined.slice(0, 37)}...` : joined;
    }

    private formatClock(timeValue: string): string {
      if (!timeValue || !timeValue.includes(':')) {
        return timeValue || '--';
      }

      const [hoursText, minutes] = timeValue.split(':');
      const hours = parseInt(hoursText, 10);
      const suffix = hours >= 12 ? 'PM' : 'AM';
      const normalizedHours = hours % 12 || 12;
      return `${normalizedHours}:${minutes} ${suffix}`;
    }

  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize popup controller when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
  });
} else {
  new PopupController();
}