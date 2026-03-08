class BlockedPageController {
  constructor() {
    this.storage = null;
    this.timeUtils = null;
    this.content = null;
    this.init();
  }

  async init() {
    await this.waitForDependencies();

    this.storage = window.StorageManager.getInstance();
    this.timeUtils = window.TimeUtils.getInstance();
    this.content = document.getElementById('blocked-content');
    this.setupActions();

    const reason = this.getBlockReason();
    await this.renderBlockedContent(reason);

    if (reason === 'nightlock') {
      this.startCountdown();
    } else if (reason === 'browsing-cooldown') {
      this.startBrowsingCooldownCountdown();
    }
  }

  async waitForDependencies() {
    return new Promise((resolve) => {
      const checkDependencies = () => {
        if (window.StorageManager && window.TimeUtils) {
          resolve();
        } else {
          setTimeout(checkDependencies, 100);
        }
      };
      checkDependencies();
    });
  }

  getBlockReason() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('reason') || 'unknown';
  }

  setupActions() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      const action = target && target.getAttribute ? target.getAttribute('data-action') : null;

      if (!action) {
        return;
      }

      if (action === 'go-home') {
        window.location.href = 'https://www.youtube.com';
      } else if (action === 'reload') {
        window.location.reload();
      }
    });
  }

  formatClock(timeValue) {
    if (!timeValue || !timeValue.includes(':')) {
      return timeValue || '--';
    }

    const [hoursText, minutes] = timeValue.split(':');
    const hours = parseInt(hoursText, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${minutes} ${suffix}`;
  }

  async renderBlockedContent(reason) {
    let content;

    switch (reason) {
      case 'nightlock':
        content = await this.getNightLockContent();
        break;
      case 'entertainment-limit':
        content = this.getEntertainmentLimitContent();
        break;
      case 'shorts':
        content = this.getShortsBlockContent();
        break;
      case 'session-limit':
        content = this.getSessionLimitContent();
        break;
      case 'browsing-cooldown':
        content = await this.getBrowsingCooldownContent();
        break;
      default:
        content = this.getGenericBlockContent();
    }

    if (this.content && content) {
      this.content.replaceChildren(content);
    }
  }

  createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (typeof textContent === 'string') {
      element.textContent = textContent;
    }
    return element;
  }

  createList(items) {
    const list = this.createElement('ul', 'yfg-blocked-list');
    for (const itemText of items) {
      const item = document.createElement('li');
      item.textContent = itemText;
      list.appendChild(item);
    }
    return list;
  }

  createPanel(label, items) {
    const panel = this.createElement('div', 'yfg-blocked-panel');
    panel.append(this.createElement('div', 'yfg-detail-label', label), this.createList(items));
    return panel;
  }

  createActions(actions) {
    const actionContainer = this.createElement('div', 'yfg-blocked-actions');
    for (const actionConfig of actions) {
      const button = this.createElement('button', actionConfig.className, actionConfig.label);
      button.type = 'button';
      button.dataset.action = actionConfig.action;
      actionContainer.appendChild(button);
    }
    return actionContainer;
  }

  createCountdown(label, id, initialValue, note) {
    const wrap = this.createElement('div', 'yfg-blocked-countdown-wrap');
    const countdown = this.createElement('div', 'yfg-blocked-countdown', initialValue);
    countdown.id = id;
    wrap.append(
      this.createElement('div', 'yfg-blocked-countdown-label', label),
      countdown,
      this.createElement('div', 'yfg-inline-note', note)
    );
    return wrap;
  }

  createBlockedView(config) {
    const fragment = document.createDocumentFragment();
    fragment.append(
      this.createElement('div', 'yfg-blocked-icon', config.icon),
      this.createElement('div', 'yfg-blocked-eyebrow', config.eyebrow),
      this.createElement('h1', 'yfg-blocked-title', config.title),
      this.createElement('p', 'yfg-blocked-message', config.message)
    );

    if (config.meta) {
      fragment.appendChild(this.createElement('p', 'yfg-blocked-meta', config.meta));
    }

    if (config.countdown) {
      fragment.appendChild(this.createCountdown(
        config.countdown.label,
        config.countdown.id,
        config.countdown.initialValue,
        config.countdown.note
      ));
    }

    if (config.actions && config.actions.length > 0) {
      fragment.appendChild(this.createActions(config.actions));
    }

    if (config.panel) {
      fragment.appendChild(this.createPanel(config.panel.label, config.panel.items));
    }

    return fragment;
  }

  async getNightLockContent() {
    const settings = await this.storage.getSettings();
    const endTime = settings.nightLock.endTime;
    const currentTime = this.timeUtils.getCurrentTime();

    return this.createBlockedView({
      icon: '🌙',
      eyebrow: 'Night Lock',
      title: 'YouTube Locked',
      message: 'YouTube is blocked during your sleep hours so late-night scrolling does not steal tomorrow\'s focus.',
      meta: `Current time: ${currentTime}`,
      countdown: {
        label: 'Unlocks in',
        id: 'countdown',
        initialValue: '--',
        note: `Available again at ${this.formatClock(endTime)}`
      },
      panel: {
        label: 'Reset instead',
        items: [
          'Dim the lights and put the phone away.',
          'Read something slow and low-stimulation.',
          'Try a short stretch or breathing routine.',
          'Skip caffeine and bright screens before bed.'
        ]
      }
    });
  }

  getEntertainmentLimitContent() {
    return this.createBlockedView({
      icon: '⏰',
      eyebrow: 'Daily Limit',
      title: 'Daily Limit Reached',
      message: 'You have used all of today\'s entertainment time. The limit resets at midnight.',
      panel: {
        label: 'Better next step',
        items: [
          'Start a focused research session.',
          'Read or write for 10 minutes first.',
          'Take a walk or stretch before returning.',
          'Come back with one intentional search.'
        ]
      }
    });
  }

  getShortsBlockContent() {
    return this.createBlockedView({
      icon: '🚫',
      eyebrow: 'Shorts Guard',
      title: 'Shorts Blocked',
      message: 'Shorts are disabled to keep YouTube from collapsing into an endless swipe loop.',
      actions: [
        { className: 'yfg-btn yfg-btn-primary', action: 'go-home', label: 'Go to YouTube Home' }
      ],
      panel: {
        label: 'Try instead',
        items: [
          'Search for one specific topic.',
          'Watch a full tutorial or lecture.',
          'Queue one intentional long-form video.',
          'Use playlists instead of swiping feeds.'
        ]
      }
    });
  }

  getSessionLimitContent() {
    return this.createBlockedView({
      icon: '🛑',
      eyebrow: 'Session Limit',
      title: 'Session Limit Reached',
      message: 'You hit the maximum continuous watch time. Take a real pause before you come back.',
      actions: [
        { className: 'yfg-btn yfg-btn-primary', action: 'go-home', label: 'I\'ve Taken a Break' }
      ],
      panel: {
        label: 'Reset your focus',
        items: [
          'Step away for five to ten minutes.',
          'Move your body and hydrate.',
          'Decide what you actually need from YouTube next.'
        ]
      }
    });
  }

  async getBrowsingCooldownContent() {
    const settings = await this.storage.getSettings();
    const remainingMs = Math.max(0, settings.browsingMode.cooldownUntil - Date.now());
    const remainingMinutes = Math.ceil(remainingMs / 60000);

    return this.createBlockedView({
      icon: '⏳',
      eyebrow: 'Browsing Cooldown',
      title: 'Browsing Session Ended',
      message: 'Browsing is paused after two extensions. Give the algorithm some distance before coming back.',
      countdown: {
        label: 'Available again in',
        id: 'browsing-cooldown-countdown',
        initialValue: `${remainingMinutes}m`,
        note: 'Browsing is blocked for 30 minutes after two extensions.'
      },
      panel: {
        label: 'Reset the loop',
        items: [
          'Leave YouTube entirely for a while.',
          'Do one offline task before coming back.',
          'Return with a specific purpose.'
        ]
      }
    });
  }

  getGenericBlockContent() {
    return this.createBlockedView({
      icon: '🎯',
      eyebrow: 'Focus Guard',
      title: 'Focus Guard Active',
      message: 'YouTube is currently restricted to protect attention and reduce passive drift.',
      panel: {
        label: 'Alternatives',
        items: [
          'Read something useful.',
          'Work on your current task list.',
          'Move, stretch, or go outside.',
          'Return later with one clear query.'
        ]
      }
    });
  }

  async startCountdown() {
    const settings = await this.storage.getSettings();
    const endTime = settings.nightLock.endTime;

    const updateCountdown = () => {
      const { hours, minutes } = this.timeUtils.timeUntilUnlock(endTime);
      const countdownElement = document.getElementById('countdown');

      if (!countdownElement) {
        return;
      }

      if (hours === 0 && minutes === 0) {
        const isLockActive = this.timeUtils.isNightLockActive(
          settings.nightLock.startTime,
          settings.nightLock.endTime
        );

        if (!isLockActive) {
          window.location.href = 'https://www.youtube.com';
          return;
        }
      }

      countdownElement.textContent = this.timeUtils.getUnlockCountdown(endTime);
    };

    updateCountdown();
    setInterval(updateCountdown, 60000);
  }

  async startBrowsingCooldownCountdown() {
    const updateCountdown = async () => {
      const settings = await this.storage.getSettings();
      const remainingMs = Math.max(0, settings.browsingMode.cooldownUntil - Date.now());
      const countdownElement = document.getElementById('browsing-cooldown-countdown');

      if (!countdownElement) {
        return;
      }

      if (remainingMs <= 0) {
        await this.storage.updateBrowsingMode({ cooldownUntil: 0 });
        await this.storage.setBlocked(null);
        window.location.href = 'https://www.youtube.com';
        return;
      }

      countdownElement.textContent = this.timeUtils.formatTime(Math.ceil(remainingMs / 1000));
    };

    await updateCountdown();
    setInterval(() => {
      void updateCountdown();
    }, 1000);
  }
}

new BlockedPageController();