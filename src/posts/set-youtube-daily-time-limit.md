---
title: "YouTube Time Limit Extension: Setup Guide"
slug: "set-youtube-daily-time-limit"
date: "2026-09-28"
author: "Manas"
description: "Set a daily watch budget with a free YouTube time limit extension for Chrome, Firefox, and Edge. Learn how playback tracking and Focus Lock work."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to set a daily YouTube watch limit

Open the Intentional YT extension, go to **Focus & Limits**, enable **Daily limit**, and choose how many minutes you want to watch each day. The extension pauses the video when your tracked playback reaches that limit.

I develop Intentional YT. This guide describes version 2.3.0 for YouTube in a supported desktop browser. It is a personal focus tool; it does not impose a device-wide limit or control the YouTube phone app.

## How to set a daily YouTube time limit

1. [Install Intentional YT for your browser](/) and open YouTube.
2. Open the extension popup and select **Focus & Limits**.
3. Under **Mindful Time & Limits**, switch on **Daily limit**.
4. Choose 15, 30, 45, 60, 90, or 120 minutes. Choose **Custom** for another budget between 1 and 1,440 minutes.
5. Check the watch-time status in the popup to see your tracked time and configured limit.

You might start with 45 minutes for tutorials or entertainment. If you plan to watch a long lecture, allow enough time to finish it.

## What does the timer count?

The timer counts active YouTube video playback. Leaving a tab open without playing a video does not use your budget. The counter resets at midnight, and your settings and watch time stay in local browser storage. Each browser profile keeps its own budget; it is not shared across devices.

At the threshold, playback pauses. This is not an operating-system restriction: you remain in control of your browser and can disable or uninstall the extension.

## Daily limits, reminders, and schedules are different

| Control | Purpose |
| --- | --- |
| Daily limit | Pause playback when the daily watch budget is reached |
| Break reminders | Prompt you to take a break during watching |
| Scheduled blocking | Apply blocking rules during selected days and hours |
| Focus Lock | Add a PIN and cooldown before changing protected settings |

A schedule can cover a recurring study session, while a daily budget caps your total watch time. Focus Lock makes you wait before changing protected settings. You can still remove the extension.

## Check the setup before relying on it

Try a short custom budget and play a video. Check that the counter advances and playback pauses at the limit, then set the budget you want to keep. If the counter stays still, check that the extension is enabled, has access to YouTube, and that a video is playing. Reload an existing tab after installing or updating.

If it does not work as described, open a [GitHub issue](https://github.com/manasdotio/intentional-yt/issues) with your browser, extension version, and the steps that led to the problem.

## Reduce the temptation to start another video

A timer is easier to use alongside a calmer page. Follow the [Shorts and recommendations setup guide](/blog/hide-youtube-shorts-and-recommendations) to remove the homepage feed or suggested-video sidebar while keeping search and subscriptions available. Read the [privacy policy](/privacy) for details about local storage.
