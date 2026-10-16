---
title: "Hide YouTube Shorts and Recommendations"
slug: "hide-youtube-shorts-and-recommendations"
date: "2026-09-28"
modified: "2026-10-16"
author: "Manas"
description: "Hide YouTube's home feed, Shorts, and suggested videos on desktop. Set up Intentional YT for Chrome, Firefox, or Edge while keeping search and subscriptions."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to hide YouTube Shorts and recommendations on desktop

You open YouTube to look up one thing. Before you've typed anything, a thumbnail catches your eye. That's an easy detour to take, especially when you only came for a quick answer.

If you'd rather skip that feed, open Intentional YT and set **Home page videos** to **Hide all**. You can still search for videos and visit your subscriptions. **Hide Shorts** and **Hide suggested videos beside the player** are separate switches, so you can decide how much to hide.

I'm Manas, the developer of Intentional YT. Below, I'll walk through those settings for the YouTube website on desktop. They won't change the YouTube phone app.

<div class="table-card" style="padding: 20px; margin: 24px 0;">
<p><strong>Want to try this setup?</strong><br>Choose your browser below. Once installed, you can pick which parts of YouTube to hide. You don't need an account.</p>
<div style="display: flex; flex-wrap: wrap; gap: 12px;">
<a class="btn btn-primary" href="https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg">Install for Chrome</a>
<a class="btn btn-secondary" href="https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/">Install for Firefox</a>
<a class="btn btn-secondary" href="https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb">Install for Edge</a>
</div>
</div>

## 1. Install the extension and open its controls

Install Intentional YT from your browser's store using one of the links above. Then open YouTube and click the extension in your browser toolbar. If you're opening it for the first time, follow the setup prompts, then go to the **Block** tab.

It helps to pin the extension to your toolbar if you expect to change these settings often.

## 2. Hide the YouTube home feed and keep subscriptions

Set **Home page videos** to **Hide all**. In **Home & browsing**, leave **Hide subscriptions** off. On older versions, enable **Hide home feed** under **Feeds & Shorts** instead.

With this setting, the recommended videos on YouTube's main homepage disappear. You can still type a search, open a link someone sent you, or visit a favorite channel. The **Home** tab on a channel's page should stay available too.

| Where you browse | Before hiding the home feed | With Home page videos set to Hide all |
| --- | --- | --- |
| YouTube homepage | A feed of recommended videos | Homepage videos are hidden |
| Search | Search for a video or topic | Search remains available |
| Subscriptions | Browse uploads from channels you follow | Available when Hide subscriptions is off |
| Channel pages | Browse a creator's videos | Channel browsing remains available |
| A direct video link | Open and play a video | Video playback remains available |

If more disappears than you expected, check your other settings and whether a Strict Focus session is running. If hiding the home feed also blanks a channel's Home tab, check for an extension update. If it's still happening, send me the channel URL through the feedback link below.

### Hide Shorts and video recommendations too

You don't have to turn everything on. Pick the distractions you actually want to remove:

| Control | Choose this when |
| --- | --- |
| Hide Shorts | You want to hide Shorts entry points in supported feeds, search results, and channel pages |
| Home page videos: Hide all | You want to search or visit subscriptions instead of browsing homepage recommendations |
| Hide suggested videos beside the player | You want to finish a video without browsing the suggested sidebar |
| Home page videos: Show only the first 15 | You want a smaller homepage feed with a stopping point |

![Intentional YT popup showing controls for hiding feeds, suggested videos, and Shorts](/screenshots/product-overview.webp "Example popup; older versions use separate Hide home feed and Limit home feed controls.")

For following a tutorial, a useful starting point is to hide the home feed, Shorts, and suggestions beside the player. That leaves fewer things competing with the lesson. If you miss browsing recommendations, you can switch **Home page videos** back to **Show all**, or try **Show only the first 15**.

On older versions, the sidebar switch is called **Hide recommended sidebar**.

## 3. Check your usual YouTube pages

Give it a quick check: visit the homepage, search for something, and open a video. You should be able to get to what you came for without seeing the feeds you hid. If YouTube was already open when you installed the extension, refresh the page first.

If someone sends you a Shorts link, **Redirect Shorts to normal player** lets you open it in the regular video player. Hiding Shorts links and changing how they play are separate settings.

## What if Shorts or recommendations still appear?

YouTube puts recommendations in several places. If you've hidden the sidebar but still see a grid of videos when a video ends, there's another setting for that:

| What you still see | Setting to check |
| --- | --- |
| Suggested videos beside the player | Hide suggested videos beside the player |
| A grid of videos after playback ends | Hide end screen recommendations |
| Clickable video or playlist cards near the end of a video | Hide end screen cards |
| Another video starts automatically | Disable autoplay |
| A Shorts link opens the vertical player | Redirect Shorts to normal player |

You'll find these controls in the **Block** tab. The popup's search can help you find a setting by name. To stop YouTube from starting another video on its own, turn on **Disable autoplay** as well.

If the matching control is already on:

1. Check the extension's main switch and its access to YouTube in your browser's extension settings.
2. If the popup says **Protections Snoozed**, choose **Resume Now** to reapply your rules.
3. Review the selected preset and any active focus session or schedule, then reload YouTube. A Strict Focus session can apply more hiding rules than your usual setup.
4. Check for an extension update. If the problem remains, note whether it happens on the homepage, a search page, a channel, or a watch page.

YouTube changes its layouts, and sometimes the extension needs an update to catch up. If something still slips through, [send me feedback](https://forms.gle/EFixUed5F5bmVvFX7). Tell me which page it happens on, your browser and extension version, and which setting you turned on. A cropped screenshot helps too; leave out private account details.

## Keep subscriptions or a course playlist available

Working through a course? Leave **Hide playlist panel** off so the next lesson is easy to find. You can keep **Disable autoplay** on and start each lesson when you're ready. Likewise, leave **Hide subscriptions** off if that's how you keep up with your favorite creators.

If your playlist or subscriptions disappear despite those settings, check for an active Strict Focus session or schedule. Those modes can hide more of the page than your usual setup.

## Does this work inside the YouTube phone app?

No. This setup works on the YouTube website in Chrome, Firefox, or Edge on desktop. It won't change what you see in the YouTube app on your phone or tablet.

## If you're still watching longer than you meant to

Hiding recommendations removes a few ways to get sidetracked, but a good playlist can still keep you watching. If that's the part you struggle with, the [daily YouTube time-limit guide](/blog/set-youtube-daily-time-limit) walks through setting a watch budget.

For unwanted creators in your search results, see [how to block YouTube channels](/blog/block-youtube-channels-from-search-results).

Still deciding whether to install? Try the [interactive demo](/), or read the [comparison with Unhook and UnTrap](/blog/intentional-yt-vs-unhook-vs-untrap) to see which controls fit how you use YouTube.
