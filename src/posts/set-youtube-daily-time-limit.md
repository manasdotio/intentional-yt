---
title: "YouTube Time Limit Extension: Setup Guide"
slug: "set-youtube-daily-time-limit"
date: "2026-09-28"
modified: "2026-10-10"
author: "Manas"
description: "Set a daily watch budget with a free YouTube time limit extension for Chrome, Firefox, and Edge. Learn how playback tracking and Focus Lock work."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to set a daily YouTube watch limit

Open the Intentional YT extension, go to **Focus**, enable **Daily limit**, and choose how many minutes you want to watch each day. The extension pauses the video when your tracked playback reaches that limit.

I develop Intentional YT. This guide describes version 2.4.0 for YouTube in a supported desktop browser. It is a personal focus tool; it does not impose a device-wide limit or control the YouTube phone app.

## How to set a daily YouTube time limit

1. [Install Intentional YT for your browser](/) and open YouTube.
2. Open the extension popup and select **Focus**.
3. Under **Watch time & limits**, switch on **Daily limit**.
4. Choose 15, 30, 45, 60, 90, or 120 minutes. Choose **Custom** for another budget between 1 and 1,440 minutes.
5. Check the watch-time status in the popup to see your tracked time and configured limit.

You might start with 45 minutes for tutorials or entertainment. If you plan to watch a long lecture, allow enough time to finish it.

![Intentional YT Focus tab with Daily limit enabled and Stop after set to 45 minutes](/screenshots/product-limits.webp "Example settings: a 45-minute daily budget with a separate 30-minute break reminder")

The screenshot shows two separate controls: **Break reminder** displays a prompt, while **Daily limit** pauses playback at your budget. Enable the daily limit if you want playback to stop; a reminder alone does not set that limit.

## What does the timer count?

The timer counts active YouTube video playback. Leaving a tab open without playing a video does not use your budget. The counter resets at midnight, and your settings and watch time stay in local browser storage. Each browser profile keeps its own budget; it is not shared across devices.

At the threshold, playback pauses. This is not an operating-system restriction: you remain in control of your browser and can disable or uninstall the extension.

### Playback speed and multiple tabs

The budget measures time spent playing, rather than the video's full running time. A 20-minute video watched at 2× speed uses about 10 minutes of your budget, assuming uninterrupted playback. Jumping forward in the video does not spend the skipped minutes. Buffering and detected YouTube ad playback are excluded.

Playback from multiple tabs is added together. Two videos playing for five minutes each can use about ten minutes of your daily budget, even if they play at the same time. Pause other YouTube tabs when checking the timer or trying to stay within a budget.

## What happens when the limit is reached?

The player pauses and shows **Daily Limit Reached**. Choose **Stop Watching (Go Home)** to leave the watch page. For an eligible video already in progress, the overlay may offer **Finish this video**; that option is not always available, including for live streams.

When Focus Lock is off, **Dismiss for today** lets you continue past the budget for that day. If you want more friction before bypassing the limit, configure Focus Lock before your session. You can still disable or uninstall the extension through your browser.

## Daily limits, reminders, and schedules are different

| Control | Purpose |
| --- | --- |
| Daily limit | Pause playback when the daily watch budget is reached |
| Break reminders | Prompt you to take a break during watching |
| Scheduled blocking | Apply blocking rules during selected days and hours |
| Focus Lock | Add a PIN and cooldown before changing protected settings |

A schedule can cover a recurring study session, while a daily budget caps your total watch time. Focus Lock makes you wait before changing protected settings. You can still remove the extension.

## Check the setup before relying on it

1. Check how much watch time the popup already shows today. The daily limit includes earlier viewing; changing the limit does not start a fresh session timer.
2. Pause other YouTube tabs. Set a custom budget one or two whole minutes above today's displayed watch time, and play a regular video.
3. Check that the counter advances. Continue until playback pauses and the limit overlay appears.
4. Set your intended daily budget after the check. The time spent testing still counts toward today's total.

Run this check before enabling Focus Lock, since raising a protected limit can require its unlock process. If you already dismissed the limit for today, test enforcement after the daily reset instead.

| What happens | What to check |
| --- | --- |
| The video pauses immediately | Today's accumulated watch time may already exceed the budget you selected |
| The counter does not advance | Confirm the video is playing rather than paused, buffering, or showing an ad; check the main switch and reload after an extension update |
| Watch time rises faster than expected | Pause any other YouTube tabs that are also playing |
| Playback continues beyond the budget | Check that Daily limit is on, protections are not snoozed, and you have not dismissed today's limit or chosen Finish this video |
| The budget differs in another browser | Settings and counters belong to each browser profile; configure the other profile separately |

If it does not work as described, [send feedback](https://forms.gle/EFixUed5F5bmVvFX7) with your browser, extension version, and the steps that led to the problem.

## Reduce the temptation to start another video

A timer is easier to use alongside a calmer page. Follow the [Shorts and recommendations setup guide](/blog/hide-youtube-shorts-and-recommendations) to remove the homepage feed or suggested-video sidebar while keeping search and subscriptions available. Read the [privacy policy](/privacy) for details about local storage.

See the [Intentional YT distraction blocker and daily limit demo](/) for an overview of how these controls work together and links to the official browser stores.
