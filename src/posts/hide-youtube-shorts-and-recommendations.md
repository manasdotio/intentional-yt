---
title: "Hide YouTube Shorts and Recommendations"
slug: "hide-youtube-shorts-and-recommendations"
date: "2026-09-28"
modified: "2026-10-10"
author: "Manas"
description: "Use a YouTube Shorts blocker to hide Shorts and remove recommendations in Chrome, Firefox, or Edge. Keep search and subscriptions with Intentional YT."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to hide YouTube Shorts and recommendations on desktop

Open the Intentional YT extension popup and enable **Hide Shorts**, **Hide home feed**, or **Hide recommended sidebar**. Each control works separately, so you can hide the parts of YouTube that distract you and keep ordinary videos, search, and subscriptions.

I develop Intentional YT. These steps cover version 2.4.0 on desktop. The extension does not change the YouTube mobile app.

## 1. Install a YouTube Shorts blocker for your browser

Use the official [Chrome Web Store](https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg), [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb), or [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/) listing. Pin the extension if you want quick access to its popup, then open YouTube in that browser.

## 2. Hide YouTube recommendations and Shorts separately

Open Intentional YT, select **Block**, and expand **Feeds & Shorts** (shown as **Feed** in the screenshot below). Enable only the settings you need:

| Control | What it does | When to use it |
| --- | --- | --- |
| Hide Shorts | Hides Shorts entry points across the sidebar, feeds, search results, and channels | You want ordinary videos without short-form browsing |
| Hide home feed | Hides the algorithmic homepage feed | You prefer searching for a specific video |
| Hide recommended sidebar | Hides recommendations beside a video | You want to finish a tutorial without choosing the next suggested video |
| Limit home feed (anti-doomscroll) | Limits the home feed to 15 videos and disables infinite scroll | You want a smaller feed instead of hiding it completely |

Leave **Hide subscriptions** off if you want to browse channels you follow. If you choose the limited feed, leave **Hide home feed** off so that feed can remain visible.

![Intentional YT Block tab showing the Feed controls for hiding the home feed, recommended sidebar, and Shorts](/screenshots/product-overview.webp "Example settings: hide distractions while keeping subscriptions available")

For a tutorial-focused setup, enable **Hide Shorts**, **Hide home feed**, and **Hide recommended sidebar**, then leave **Hide subscriptions** off. Search for the tutorial you need or open it from your subscriptions. To browse a small selection of recommendations instead, turn off **Hide home feed** and enable **Limit home feed (anti-doomscroll)**.

## 3. Check your usual YouTube pages

Visit the homepage, try a search, and open a video. Check that the parts you chose to hide are gone and that you can still find what you want to watch. Reload any page that was open before you installed the extension.

If you want to open a Shorts link in the standard watch view with playback controls, enable **Redirect Shorts to normal player**. This is separate from hiding Shorts links around YouTube.

## What if Shorts or recommendations still appear?

First identify where the distraction appears. Hiding the sidebar does not also hide suggestions inside the video player:

| What you still see | Setting to check |
| --- | --- |
| Suggested videos beside the player | Hide recommended sidebar |
| A grid of videos after playback ends | Hide end screen recommendations |
| Clickable video or playlist cards near the end of a video | Hide end screen cards |
| Another video starts automatically | Disable autoplay |
| A Shorts link opens the vertical player | Redirect Shorts to normal player |

The player controls are in the **Block** tab. You can use the popup's setting search to find a control by name. Hiding a recommendation and disabling autoplay solve different problems; enable both if you want a clear stopping point after a video.

If the matching control is already on:

1. Check the extension's main switch and its access to YouTube in your browser's extension settings.
2. If the popup says **Protections Snoozed**, choose **Resume Now** to reapply your rules.
3. Review the selected preset and any active focus session or schedule, then reload YouTube. A Strict Focus session can apply more hiding rules than your usual setup.
4. Check for an extension update. If the problem remains, note whether it happens on the homepage, a search page, a channel, or a watch page.

YouTube experiments with different layouts, so a new page design can need an extension update. [Send feedback](https://forms.gle/EFixUed5F5bmVvFX7) with the page type, browser, extension version, and setting that did not work. A cropped screenshot can help; leave out private account information.

## Keep subscriptions or a course playlist available

For a course made of several videos, leave **Hide playlist panel** off so you can choose the next lesson yourself. Keep **Disable autoplay** on if you want to pause between lessons. Leave **Hide subscriptions** off to retain access to channels you follow.

If one of these areas disappears despite your usual settings, check whether a Strict Focus session or schedule is active. These modes can hide additional parts of the page. Finish the session or adjust its schedule if that setup does not fit your course.

## Does this work inside the YouTube phone app?

No. These instructions apply to the YouTube website in a supported desktop browser. Installing the extension does not change the native YouTube app on a phone or tablet.

## Add a watch budget if hiding feeds is not enough

The [Intentional YT YouTube distraction blocker](/) includes an interactive demo and links to all three browser stores if you want to explore the controls before installing.

You can hide every recommendation and still spend longer than planned on a playlist. Follow the [daily YouTube time-limit guide](/blog/set-youtube-daily-time-limit) to set a watch budget. If unwanted creators still appear in search, see [how to block YouTube channels from search results](/blog/block-youtube-channels-from-search-results). If you are still choosing an extension, [compare Intentional YT with Unhook and UnTrap](/blog/intentional-yt-vs-unhook-vs-untrap).
