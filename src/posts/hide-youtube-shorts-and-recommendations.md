---
title: "How to Hide YouTube Shorts and Recommendations on Desktop"
slug: "hide-youtube-shorts-and-recommendations"
date: "2026-09-28"
author: "Manas"
description: "Use a YouTube Shorts blocker to hide Shorts and remove recommendations in Chrome, Firefox, or Edge. Keep search and subscriptions with Intentional YT."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to Hide YouTube Shorts and Recommendations on Desktop

To remove YouTube distractions with Intentional YT, open the extension popup and enable **Hide Shorts**, **Hide home feed**, or **Hide recommended sidebar**. These are separate controls: you can keep ordinary videos, search, and subscriptions while hiding the surfaces that distract you.

I develop Intentional YT. The steps below describe the controls in version 2.3.0, rather than settings in the YouTube mobile app.

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

## 3. Check the pages you actually use

Visit the homepage, run a search, and open an ordinary watch page. Confirm that the distracting elements are hidden and the content you need is still available. If a page was open before installation, reload it.

**Redirect Shorts to normal player** is a separate option. It is useful when you want a Shorts link to open in the standard watch view with playback controls. Hiding entry points and redirecting a direct link serve different purposes.

## What if Shorts or recommendations still appear?

Check that the extension is enabled and has access to YouTube. Review any scheduled blocking hours or selected preset that may affect your rules. Update the extension and reload the page. YouTube experiments with different layouts, so a selector can occasionally need an update. Report the affected page type and browser in the [issue tracker](https://github.com/manasdotio/intentional-yt/issues); avoid including private account information.

## Does this work inside the YouTube phone app?

No. These instructions apply to the YouTube website in a supported desktop browser. Installing the extension does not change the native YouTube app on a phone or tablet.

## Add a watch budget if hiding feeds is not enough

Visual controls and time controls solve different problems. You can hide recommendations and still spend longer than intended watching a single playlist. Follow the [daily YouTube time-limit guide](/blog/set-youtube-daily-time-limit) to add a playback budget, or [compare Intentional YT with Unhook and UnTrap](/blog/intentional-yt-vs-unhook-vs-untrap) before choosing a tool.
