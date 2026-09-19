/**
 * i18n.js — Intentional YT v3
 * Shared internationalization abstraction layer.
 * Supports automatic browser locale detection via browser.i18n.getMessage()
 * and manual userLanguage override with dynamic JSON catalog fetching and
 * full fallback chain to English (_locales/en/messages.json).
 */

'use strict';

var browser = globalThis.browser || globalThis.chrome;
if (typeof globalThis !== 'undefined' && !globalThis.browser && globalThis.chrome) {
  globalThis.browser = globalThis.chrome;
}

const I18N = (() => {
  let _currentLang = 'auto';
  let _messageCatalog = null;    // Parsed messages.json for explicit language override
  let _fallbackCatalog = null;   // Parsed _locales/en/messages.json for missing key fallbacks
  const _catalogCache = new Map();

  // Supported languages sorted alphabetically by native name
  const SUPPORTED_LANGUAGES = [
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'cs', name: 'Čeština' },
    { code: 'de', name: 'Deutsch' },
    { code: 'el', name: 'Ελληνικά' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pl', name: 'Polski' },
    { code: 'pt_BR', name: 'Português (Brasil)' },
    { code: 'ro', name: 'Română' },
    { code: 'sv', name: 'Svenska' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ru', name: 'Русский' },
    { code: 'uk', name: 'Українська' },
    { code: 'he', name: 'עברית' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'th', name: 'ไทย' },
    { code: 'ja', name: '日本語' },
    { code: 'zh_CN', name: '简体中文' },
    { code: 'zh_TW', name: '繁體中文' },
    { code: 'ko', name: '한국어' }
  ];

  /**
   * Fetch and parse a locale's messages.json catalog from extension assets
   */
  async function fetchCatalog(lang) {
    if (!lang || lang === 'auto') return null;
    if (_catalogCache.has(lang)) {
      return _catalogCache.get(lang);
    }
    try {
      const url = browser.runtime.getURL(`_locales/${lang}/messages.json`);
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        _catalogCache.set(lang, json);
        return json;
      }
    } catch (err) {
      console.warn(`[IYT] Could not fetch catalog for locale "${lang}":`, err);
    }
    return null;
  }

  /**
   * Set active language. If 'auto', clears custom catalogs.
   * If explicit code, loads that catalog and ensures English fallback catalog is ready.
   */
  async function setLanguage(lang) {
    _currentLang = (lang && typeof lang === 'string') ? lang : 'auto';
    if (_currentLang === 'auto') {
      _messageCatalog = null;
      return;
    }

    const [cat, enCat] = await Promise.all([
      fetchCatalog(_currentLang),
      _fallbackCatalog ? Promise.resolve(_fallbackCatalog) : fetchCatalog('en')
    ]);

    _messageCatalog = cat;
    if (enCat) _fallbackCatalog = enCat;
  }

  /**
   * Determine text direction ('ltr' or 'rtl') based on resolved language
   */
  function getDirection() {
    if (_currentLang === 'ar' || _currentLang === 'he') {
      return 'rtl';
    }
    if (_currentLang !== 'auto') {
      return 'ltr';
    }
    // In auto mode, check browser's native bidi indicator
    try {
      if (browser?.i18n?.getMessage) {
        const bidi = browser.i18n.getMessage('@@bidi_dir');
        if (bidi === 'rtl') return 'rtl';
      }
    } catch (e) {}
    return 'ltr';
  }

  /**
   * Format message entry with substitution arguments.
   * Handles:
   * 1. Named placeholders from entry.placeholders (e.g. $MINUTES$, $LIMIT$, $PERCENT$, $HOURS$)
   * 2. Positional placeholders ($1, $2)
   * 3. Bare $ placeholders
   */
  function formatMessage(entry, subs) {
    if (!entry) return null;
    let msg = typeof entry === 'string' ? entry : (entry.message || '');
    if (!subs) return msg;

    const subArr = Array.isArray(subs) ? subs : [subs];

    // 1. Replace named placeholders
    if (entry.placeholders && typeof entry.placeholders === 'object') {
      const phKeys = Object.keys(entry.placeholders);
      for (let i = 0; i < phKeys.length; i++) {
        const k = phKeys[i];
        if (i < subArr.length) {
          const val = String(subArr[i]);
          msg = msg.replace(new RegExp('\\$' + k + '\\$', 'gi'), val);
          const content = entry.placeholders[k]?.content;
          if (content && content.startsWith('$')) {
            msg = msg.replace(content, val);
          }
        }
      }
    }

    // 2. Replace positional placeholders $1, $2, etc.
    for (let i = 0; i < subArr.length; i++) {
      msg = msg.replace(new RegExp('\\$' + (i + 1), 'g'), String(subArr[i]));
    }

    // 3. Fallback: replace remaining bare $ in order
    for (let i = 0; i < subArr.length; i++) {
      if (msg.includes('$')) {
        msg = msg.replace('$', String(subArr[i]));
      }
    }

    return msg;
  }

  /**
   * Unified message retrieval function.
   * If auto: uses native browser.i18n.getMessage().
   * If explicit language: checks active catalog -> fallback English catalog -> native getMessage -> fallback string.
   */
  function getMessage(key, subs, fallback) {
    // Mode 1: Auto (match browser)
    if (_currentLang === 'auto') {
      try {
        if (browser?.i18n?.getMessage) {
          const m = browser.i18n.getMessage(key, subs);
          if (m) return m;
        }
      } catch (e) {}
      return fallback !== undefined ? fallback : null;
    }

    // Mode 2: Explicit language catalog
    if (_messageCatalog && _messageCatalog[key]) {
      const formatted = formatMessage(_messageCatalog[key], subs);
      if (formatted !== null && formatted !== '') return formatted;
    }

    // Mode 3: Fallback to English catalog if key was missing
    if (_fallbackCatalog && _fallbackCatalog[key]) {
      const formatted = formatMessage(_fallbackCatalog[key], subs);
      if (formatted !== null && formatted !== '') return formatted;
    }

    // Mode 4: Native browser getMessage fallback
    try {
      if (browser?.i18n?.getMessage) {
        const m = browser.i18n.getMessage(key, subs);
        if (m) return m;
      }
    } catch (e) {}

    // Mode 5: Hardcoded fallback string
    return fallback !== undefined ? fallback : null;
  }

  return {
    SUPPORTED_LANGUAGES,
    setLanguage,
    getLanguage: () => _currentLang,
    getDirection,
    getMessage
  };
})();

if (typeof globalThis !== 'undefined') {
  globalThis.I18N = I18N;
}
