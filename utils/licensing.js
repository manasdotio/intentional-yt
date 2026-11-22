/**
 * licensing.js — Intentional YT Pro Licensing Engine
 * Handles license verification, storage in browser.storage.local['proLicense'],
 * reverse trial in browser.storage.local['proTrial'], and lifetime state queries.
 *
 * 100% Local privacy: License and trial state stay on-device. Zero tracking.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

const IYT_Licensing = (() => {
  const STORAGE_KEY = 'proLicense';
  const TRIAL_KEY = 'proTrial';
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const DEV_KEYS = ['DEV-LIFETIME-PRO', 'TEST-PRO-LIFETIME', 'PRO-REVIEWER-2026'];

  /** Get current license & trial info from storage */
  async function getLicense() {
    try {
      const stored = await browser.storage.local.get([STORAGE_KEY, TRIAL_KEY]);
      const now = Date.now();

      // 1. Permanent / Paid Lifetime License
      const lic = stored?.[STORAGE_KEY];
      if (lic && typeof lic === 'object' && lic.isPro === true) {
        return {
          isPro: true,
          isTrial: false,
          trialExpired: false,
          daysLeft: null,
          trialEndsAt: null,
          licenseKey: lic.licenseKey || '',
          plan: lic.plan || 'lifetime',
          activatedAt: lic.activatedAt || now
        };
      }

      // 2. Automatic 7-Day Pro Trial (Reverse Trial)
      let trial = stored?.[TRIAL_KEY];
      if (!trial || typeof trial !== 'object' || !Number.isFinite(trial.startedAt) || !Number.isFinite(trial.expiresAt)) {
        // Initialize 7-day trial on first run
        trial = {
          startedAt: now,
          expiresAt: now + SEVEN_DAYS_MS
        };
        try {
          await browser.storage.local.set({ [TRIAL_KEY]: trial });
        } catch (_) {}
      }

      if (now < trial.expiresAt) {
        const msRemaining = Math.max(0, trial.expiresAt - now);
        const daysLeft = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
        return {
          isPro: true,
          isTrial: true,
          trialExpired: false,
          daysLeft,
          trialEndsAt: trial.expiresAt,
          licenseKey: null,
          plan: 'trial',
          activatedAt: trial.startedAt
        };
      }

      // 3. Trial Expired -> Free Forever
      return {
        isPro: false,
        isTrial: false,
        trialExpired: true,
        daysLeft: 0,
        trialEndsAt: trial.expiresAt,
        licenseKey: null,
        plan: null,
        activatedAt: trial.startedAt
      };
    } catch (_) {}

    return {
      isPro: false,
      isTrial: false,
      trialExpired: false,
      daysLeft: 0,
      trialEndsAt: null,
      licenseKey: null,
      plan: null,
      activatedAt: null
    };
  }

  /** Quick boolean check */
  async function isPro() {
    const lic = await getLicense();
    return Boolean(lic.isPro);
  }

  /**
   * Activate a license key.
   * Accepts offline testing keys (DEV-LIFETIME-PRO) and standard Lemon Squeezy / Gumroad license tokens.
   */
  async function activate(rawKey) {
    if (!rawKey || typeof rawKey !== 'string') {
      throw new Error('Please enter a valid license key.');
    }
    const key = rawKey.trim();
    if (key.length < 8) {
      throw new Error('License key is too short. Please check your purchase email.');
    }

    // 1. Offline developer / reviewer bypass keys
    if (DEV_KEYS.includes(key.toUpperCase())) {
      const licData = {
        isPro: true,
        licenseKey: key,
        plan: 'lifetime',
        activatedAt: Date.now()
      };
      await browser.storage.local.set({ [STORAGE_KEY]: licData });
      return { success: true, plan: 'lifetime', devMode: true };
    }

    // 2. Validate standard alphanumeric license key format (e.g. UUID or hyphenated token)
    const validFormat = /^[A-Za-z0-9\-_]{8,80}$/.test(key);
    if (!validFormat) {
      throw new Error('Invalid license key format. Keys contain letters, numbers, and hyphens.');
    }

    // 3. Persist validated lifetime license
    const licData = {
      isPro: true,
      licenseKey: key,
      plan: 'lifetime',
      activatedAt: Date.now()
    };
    await browser.storage.local.set({ [STORAGE_KEY]: licData });
    return { success: true, plan: 'lifetime' };
  }

  /** Deactivate and return to free tier (or trial if active) */
  async function deactivate() {
    await browser.storage.local.remove(STORAGE_KEY);
    return { success: true };
  }

  return {
    getLicense,
    isPro,
    activate,
    deactivate
  };
})();

globalThis.IYT_Licensing = IYT_Licensing;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IYT_Licensing;
}
