---
title: "YouTube Time Limit Extension: Setup Guide"
slug: "set-youtube-daily-time-limit"
date: "2026-09-28"
author: "Manas"
description: "Set a daily watch budget with a free YouTube time limit extension for Chrome, Firefox, and Edge. Learn how playback tracking and Focus Lock work."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# YouTube Time Limit Extension: Setup Guide

Open the Intentional YT extension, go to **Focus & Limits**, enable **Daily limit**, and choose a watch budget. When tracked playback reaches that daily threshold, the extension pauses the video.

I develop Intentional YT. This guide describes version 2.3.0 for YouTube in a supported desktop browser. It is a personal focus tool; it does not impose a device-wide limit or control the YouTube phone app.

## How to set a daily YouTube time limit

1. [Install Intentional YT for your browser](/) and open YouTube.
2. Open the extension popup and select **Focus & Limits**.
3. Under **Mindful Time & Limits**, switch on **Daily limit**.
4. Choose 15, 30, 45, 60, 90, or 120 minutes. Choose **Custom** for another budget between 1 and 1,440 minutes.
5. Check the watch-time status in the popup to see your tracked time and configured limit.

For example, a 45-minute budget gives you a daily boundary for tutorials or entertainment. Choose a budget that accommodates the videos you intend to watch; a long lecture may need a larger allowance.

## What does the timer count?

The counter tracks active YouTube video playback, rather than simply counting how long a browser tab is open. The daily counter resets at midnight. Settings and counters are kept in local browser storage; they do not synchronize into one shared budget across your devices or browser profiles.

At the threshold, playback pauses. This is not an operating-system restriction: you remain in control of your browser and can disable or uninstall the extension.

## Daily limits, reminders, and schedules are different

| Control | Purpose |
| --- | --- |
| Daily limit | Pause playback when the daily watch budget is reached |
| Break reminders | Prompt you to take a break during watching |
| Scheduled blocking | Apply blocking rules during selected days and hours |
| Focus Lock | Add a PIN and cooldown before changing protected settings |

Use a schedule for a recurring study session. Use a daily budget when you want an overall viewing boundary. Focus Lock can add a pause before changing protected preferences, but it cannot stop you from removing the extension.

## Check the setup before relying on it

Temporarily choose a short custom budget, play a video, and observe the counter and pause behavior. Restore your intended budget afterward. If the counter is not advancing, confirm the extension has access to YouTube, the video is playing, and the extension is enabled. Reload an existing tab after installing or updating.

If behavior differs from these steps, include your browser, extension version, and reproduction steps in a [GitHub issue](https://github.com/manasdotio/intentional-yt/issues).

## Reduce the temptation to start another video

A timer is easier to use alongside a calmer page. Follow the [Shorts and recommendations setup guide](/blog/hide-youtube-shorts-and-recommendations) to remove the homepage feed or suggested-video sidebar while keeping search and subscriptions available. Read the [privacy policy](/privacy) for details about local storage.
