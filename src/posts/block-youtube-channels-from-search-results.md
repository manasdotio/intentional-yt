---
title: "How to Block YouTube Channels from Search Results"
slug: "block-youtube-channels-from-search-results"
date: "2026-10-07"
author: "Manas"
description: "Block YouTube channels from search results and hide videos by title keyword in Chrome, Firefox, or Edge. A step-by-step desktop guide with limits explained."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to block YouTube channels from search results

If the same channel keeps showing up when you search YouTube, you can hide its video cards with Intentional YT. Open the extension's **Filters** tab and add the channel's name or `@handle` to **Channel Blocklist**. You can also hide titles containing a word or phrase with **Keyword Blocklist**.

I develop Intentional YT. This guide covers version 2.4.0 on desktop Chrome, Firefox, and Edge. The filters apply in the browser where you install it. They don't block a channel across your YouTube account or act as parental controls.

## What about YouTube's "Don't recommend channel" option?

That option is available on certain Home and Watch Next recommendations. [YouTube describes it as a way to tune recommendations](https://support.google.com/youtube/answer/6342839?hl=en). It doesn't set a rule to remove every search result from a channel.

If fewer recommendations would solve your problem, try YouTube's option first. For filtering search results, use the steps below.

## Add a channel to your blocklist

1. [Install Intentional YT](/) in the desktop browser where you use YouTube. Open YouTube, or reload the tab if it's already open.
2. Open the extension from your browser toolbar and select **Filters**.
3. Enter the channel's name or `@handle` under **Channel Blocklist**. A channel URL containing its `@handle` or `/channel/` ID also works.
4. Press **Enter** or select **Add**.
5. Search for a video from that channel to check that its card is hidden.

![Intentional YT Filters tab showing @examplecreator in Channel Blocklist and spoiler in Keyword Blocklist](/screenshots/channel-keyword-filters.webp "Example entries in the Filters tab. Replace @examplecreator with your channel and spoiler with a title keyword you want to hide.")

Use the exact `@handle` if several channels have similar names. Capital letters don't matter. Your list is saved in your browser; select the **×** beside an entry to remove it.

There's also a shortcut. Leave **Show Block buttons** enabled at the top of Filters. When a video card has a **Block** button beside the channel name, select it to add the channel without opening the popup. An undo option appears briefly afterward.

## Hide videos by title keyword

In **Filters**, add a word or phrase to **Keyword Blocklist** and press **Enter** or **Add**.

For example, `spoiler` hides video cards with that word in the title. The filter checks the visible title only. It doesn't read descriptions or transcripts, or try to work out what a video is about.

Matching ignores capital letters. Entries of three characters or fewer match whole words; longer entries can match part of a title. If a keyword hides videos you still want, try a more specific phrase. You can remove keywords from Filters at any time.

## Where the filters work

Intentional YT checks supported video cards in search results, the home feed, and suggestions beside a video. It needs the channel or title information shown on the card to find a match.

The filters won't stop you from opening a direct video link. They don't delete videos, change your YouTube account's recommendations, or affect the phone app. Each browser profile keeps its own settings.

To hide the whole recommendations feed or Shorts, see the [Shorts and recommendations guide](/blog/hide-youtube-shorts-and-recommendations).

## Still seeing a blocked channel?

Check these before adding the channel again:

- Make sure the extension's main switch is on, then reload YouTube. This helps with tabs that were open before an installation or update.
- Check the entry in Filters. Try the exact `@handle` or the channel URL if a display name isn't working.
- If you use a schedule, check that your blocking settings apply at the current time.

YouTube changes its layout from time to time, and a new card design may need an extension update. If the channel still appears, [report the page and browser](https://forms.gle/EFixUed5F5bmVvFX7). Please leave out private account details.

If you also want help stopping after a certain amount of watching, you can [set a daily watch limit](/blog/set-youtube-daily-time-limit).
