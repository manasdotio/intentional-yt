---
title: "How to Block YouTube Channels from Search Results"
slug: "block-youtube-channels-from-search-results"
date: "2026-10-07"
modified: "2026-10-10"
author: "Manas"
description: "Learn how to block YouTube channels from search results on Chrome, Firefox, or Edge, find the right channel handle, and fix results that still appear."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to block YouTube channels from search results

If the same unwanted channel keeps turning up when you search for a tutorial, you can hide its videos with Intentional YT. On desktop, open the extension's **Filters** tab and add the channel's name or `@handle` to **Channel Blocklist**.

I develop Intentional YT. These instructions are for version 2.4.0 in desktop Chrome, Firefox, and Edge.

## What about YouTube's "Don't recommend channel" option?

On pages such as Home and Watch Next, you can open a video's menu and choose **Don't recommend channel**. [YouTube uses that feedback to tune your recommendations](https://support.google.com/youtube/answer/6342839?hl=en). The channel can still appear in search results.

Try that first if you only want fewer suggestions from a creator. The extension's blocklist is useful when you also want their videos out of your searches.

## Block a channel in Chrome, Firefox, or Edge

1. [Install Intentional YT](/) in the desktop browser where you use YouTube. Open YouTube, or reload the tab if it's already open.
2. Open the extension from your browser toolbar and select **Filters**.
3. Enter the channel's name or `@handle` under **Channel Blocklist**. A channel URL containing its `@handle` or `/channel/` ID also works.
4. Press **Enter** or select **Add**.
5. Return to your search and check whether the channel's videos have disappeared. Reload the page if needed.

![Intentional YT Filters tab showing @examplecreator in Channel Blocklist and spoiler in Keyword Blocklist](/screenshots/channel-keyword-filters.webp "The Filters tab with example entries. Use the handle of the channel you want to hide.")

An exact `@handle` helps distinguish channels with similar names. Capital letters don't matter. The list stays saved in your browser, and you can remove an entry with the **×** beside it.

For a quicker way to add channels, turn on **Show Block buttons** in Filters. When you see a **Block** button beside a channel name on a video card, click it. An undo option appears briefly in case you pick the wrong channel.

### Find the right channel handle

Click the creator's name to open their channel page. In an address such as `youtube.com/@examplecreator`, the handle is `@examplecreator`. Copy the actual channel address or handle into the blocklist. A link containing `watch?v=...` points to a video, so it won't give you the channel entry you need.

Some video cards don't include a handle the extension can read. If yours doesn't work, try the channel's displayed name or its **Block** button. Two channels with the same display name can both match, so check which videos disappear.

### Check that the channel is hidden

Use a search where you've just seen a video from the channel. Add the channel, then repeat that search. Its matching video cards should disappear while unrelated results remain.

To undo the change, remove the entry from Filters. Those videos can appear again, though YouTube may reorder or change the results between searches.

## Hide videos by title keyword

In **Filters**, add a word or phrase to **Keyword Blocklist** and press **Enter** or **Add**.

You might want to keep a creator's tutorials while avoiding their finale discussions. A phrase such as `season finale` lets you do that without blocking the whole channel. The filter reads the visible title; it can't catch a spoiler mentioned only in the description or the video itself.

Matching ignores capital letters. Entries of up to three characters match whole words, while longer entries can match part of a word.

With example titles, that looks like this:

| Entry | Example title | Hidden? |
| --- | --- | --- |
| `car` | Car repair basics | Yes: the short entry matches a whole word |
| `car` | Oscar predictions | No: those letters are inside another word |
| `spoiler` | SPOILERS: the ending explained | Yes: longer entries match parts of words and ignore case |
| `season finale` | Season finale explained | Yes: the phrase appears together |
| `season finale` | Finale recap for the season | No: the words are in a different order |

Start with one phrase. A broad entry such as `news` can catch unrelated titles containing those letters, and `spoiler` also matches "no spoilers." If videos you wanted disappear, remove the entry or use a more specific phrase.

Keywords work across creators, so they're useful for filtering a subject. A channel entry matches an exact name or identifier and hides that creator's videos regardless of title. Similar words in another channel's name won't be enough to match.

## Where the filters work

The same blocklist applies to supported video cards in search results, your home feed, and suggestions beside a video. There's no search-only setting, so blocking a creator here can also hide their videos elsewhere on YouTube.

You can still open a direct link to a video. The extension hides results in your browser; it doesn't delete videos or change your YouTube account's recommendations. It also doesn't affect the phone app, and each browser profile keeps its own list. This is a personal browsing tool, not parental control software.

If you'd rather hide recommendations altogether, the [Shorts and recommendations guide](/blog/hide-youtube-shorts-and-recommendations) walks through those controls.

## Still seeing a blocked channel?

- Make sure the extension's main switch is on, then reload YouTube. This helps with tabs that were open before an installation or update.
- Try the exact `@handle` or the channel URL in Filters if a display name isn't working.
- If the popup says **Protections Snoozed**, choose **Resume Now** to turn filtering back on.
- Look at what's still showing. A channel heading or a special search section may not be handled like an ordinary video card.

YouTube changes its layouts, and I sometimes need to update the extension to handle them. If a video still slips through, [send me the page type, browser, and extension version](https://forms.gle/EFixUed5F5bmVvFX7). A cropped screenshot of the result helps too; leave out private account details.

To put a limit on how long you watch, [set a daily watch limit](/blog/set-youtube-daily-time-limit).
