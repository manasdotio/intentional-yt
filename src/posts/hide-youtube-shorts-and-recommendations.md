---
title: "Hide YouTube Shorts and Recommendations"
slug: "hide-youtube-shorts-and-recommendations"
date: "2026-09-28"
modified: "2026-09-29"
author: "Manas"
description: "Use a YouTube Shorts blocker to hide Shorts and remove recommendations in Chrome, Firefox, or Edge. Keep search and subscriptions with Intentional YT."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to hide YouTube Shorts and recommendations on desktop

Open the Intentional YT extension popup and enable **Hide Shorts**, **Hide home feed**, or **Hide recommended sidebar**. Each control works separately, so you can hide the parts of YouTube that distract you and keep ordinary videos, search, and subscriptions.

I develop Intentional YT. These steps cover version 2.3.0 on desktop. The extension does not change the YouTube mobile app.

## 1. Install a YouTube Shorts blocker for your browser

Use the official [Chrome Web Store](https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg), [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb), or [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/) listing. Pin the extension if you want quick access to its popup, then open YouTube in that browser.

## 2. Hide YouTube recommendations and Shorts separately

Open Intentional YT and find the **Feed** controls. Enable only the settings you need:

| Control | What it does | When to use it |
| --- | --- | --- |
| Hide Shorts | Hides Shorts entry points across the sidebar, feeds, search results, and channels | You want ordinary videos without short-form browsing |
| Hide home feed | Hides the algorithmic homepage feed | You prefer searching for a specific video |
| Hide recommended sidebar | Hides recommendations beside a video | You want to finish a tutorial without choosing the next suggested video |
| Limit home feed (anti-doomscroll) | Limits the home feed to 15 videos and disables infinite scroll | You want a smaller feed instead of hiding it completely |

Leave **Hide subscriptions** off if you want to browse channels you follow. If you choose the limited feed, leave **Hide home feed** off so that feed can remain visible.

## 3. Check your usual YouTube pages

Visit the homepage, try a search, and open a video. Check that the parts you chose to hide are gone and that you can still find what you want to watch. Reload any page that was open before you installed the extension.

If you want to open a Shorts link in the standard watch view with playback controls, enable **Redirect Shorts to normal player**. This is separate from hiding Shorts links around YouTube.

## What if Shorts or recommendations still appear?

Check that the extension is enabled and has access to YouTube. Review any scheduled blocking hours or selected preset that may affect your rules. Update the extension and reload the page. YouTube experiments with different layouts, so a selector can occasionally need an update. Report the affected page type and browser in the [issue tracker](https://github.com/manasdotio/intentional-yt/issues); avoid including private account information.

## Does this work inside the YouTube phone app?

No. These instructions apply to the YouTube website in a supported desktop browser. Installing the extension does not change the native YouTube app on a phone or tablet.

## Add a watch budget if hiding feeds is not enough

You can hide every recommendation and still spend longer than planned on a playlist. Follow the [daily YouTube time-limit guide](/blog/set-youtube-daily-time-limit) to set a watch budget. If you are still choosing an extension, [compare Intentional YT with Unhook and UnTrap](/blog/intentional-yt-vs-unhook-vs-untrap).
