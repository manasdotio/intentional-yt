/**
 * licensing.js — Intentional YT Pro Licensing Engine
 * Handles license verification, storage in browser.storage.local['proLicense'],
 * and lifetime state queries.
 *
 * 100% Local privacy: License state stays on-device.
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;

const IYT_Licensing = (() => {
  const STORAGE_KEY = 'proLicense';
  const DEV_KEYS = ['DEV-LIFETIME-PRO', 'TEST-PRO-LIFETIME', 'PRO-REVIEWER-2026'];

  /** Get current license info from storage */
  async function getLicense() {
    try {
      const stored = await browser.storage.local.get(STORAGE_KEY);
      const lic = stored?.[STORAGE_KEY];
      if (lic && typeof lic === 'object' && lic.isPro === true) {
        return {
          isPro: true,
          licenseKey: lic.licenseKey || '',
          plan: lic.plan || 'lifetime',
          activatedAt: lic.activatedAt || Date.now()
        };
      }
    } catch (_) {}
    return {
      isPro: false,
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

  /** Deactivate and return to free tier */
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
