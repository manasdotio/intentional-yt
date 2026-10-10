/**
 * Global App Constants & Configuration
 * Single source of truth for versioning, links, and metadata.
 */
export const APP_CONFIG = {
  name: 'Intentional YT - YouTube Distraction Blocker & Daily Time Limit',
  shortName: 'Intentional YT',
  version: '2.4.1',
  versionShort: 'v2.4.1',
  description: 'Distraction-Free YouTube Extension for Deep Focus',
  chromeWebStoreUrl: 'https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg',
  edgeAddonUrl: 'https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb',
  firefoxAddonUrl: 'https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/',
  chromeZipUrl: '/intentional-yt.zip',
  chromeZipFilename: 'intentional-yt-v2.4.1.zip',
  liveWebsiteUrl: 'https://www.intentionalyt.me/',
  feedbackFormUrl: 'https://forms.gle/EFixUed5F5bmVvFX7',
  uninstallUrl: 'https://www.intentionalyt.me/uninstall',
  uninstallFeedbackFormUrl: 'https://forms.gle/f3gpgv98ZrgfZPYdA',
  uninstallFeedbackConfig: {
    formUrl: 'https://forms.gle/f3gpgv98ZrgfZPYdA',
    formActionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScZ0nuuKLw2LsQny80f2lHtGaW0uv3n9OErJEdyzWhokiyq_A/formResponse',
    reasonEntryId: 'entry.193768948',
    fallbackFormUrl: 'https://forms.gle/f3gpgv98ZrgfZPYdA'
  }
}

export const APP_VERSION = APP_CONFIG.version
export const APP_VERSION_SHORT = APP_CONFIG.versionShort
export const CHROME_WEBSTORE_URL = APP_CONFIG.chromeWebStoreUrl
export const EDGE_ADDON_URL = APP_CONFIG.edgeAddonUrl
export const FIREFOX_AMO_URL = APP_CONFIG.firefoxAddonUrl
export const CHROME_ZIP_URL = APP_CONFIG.chromeZipUrl
export const CHROME_ZIP_FILENAME = APP_CONFIG.chromeZipFilename
export const FEEDBACK_FORM_URL = APP_CONFIG.feedbackFormUrl
export const UNINSTALL_URL = APP_CONFIG.uninstallUrl
export const UNINSTALL_FEEDBACK_FORM_URL = APP_CONFIG.uninstallFeedbackFormUrl
export const UNINSTALL_FEEDBACK_CONFIG = APP_CONFIG.uninstallFeedbackConfig
