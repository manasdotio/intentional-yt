---
title: "How to Whitelist YouTube Channels (And Block Everything Else)"
slug: "whitelist-youtube-channels-allowlist-guide"
date: "2026-11-05"
author: "Manas"
description: "How to allow only specific YouTube channels on desktop and block the rest. A practical guide to channel allowlists, dim mode, and PIN-locking your setup."
image: "/screenshots/intentional_yt_marquee_1400x560.png"
---

# How to whitelist YouTube channels and block everything else

Blocking channels one by one works when you only want to hide a couple of specific creators. It fails when you need YouTube to stay quiet while you study or when you want to set up a computer for someone else. Whenever you block three sensational channels, YouTube's recommendation engine pulls five similar ones into the empty slot.

A whitelist fixes this by flipping the approach. Instead of keeping a list of things to ban, you block recommendations by default and approve only the handful of channels you actually trust.

I built Intentional YT to solve this on desktop browsers. Starting in version 2.6.0, the extension includes a local **Allowlist Mode**. Here is how to configure it on Chrome, Edge, Brave, and Firefox, along with how to prevent yourself or others from turning it right back off.

## Why YouTube does not have an official whitelist on the web

YouTube's business model runs on ad impressions and watch time. The recommendation algorithm exists to keep viewers browsing beyond their original search. Offering an easy toggle that restricts recommendations to a small, handpicked list of creators would run counter to how the platform operates.

Because of that, Google provides only one official whitelist tool: the "Approved content only" setting inside the mobile **YouTube Kids** app. That option has two clear practical limits:
* It is restricted to mobile devices and tablets. It does not exist on desktop web browsers.
* The interface is aimed at toddlers and young children, so older kids, students, and adults will not use it.

Network routers and DNS filters like Pi-hole or NextDNS cannot fill the gap either. Modern web traffic is encrypted with HTTPS. A router can see that your computer opened `youtube.com`, but it cannot see the page path, video title, or channel handle. A router can only let all of YouTube through or block the domain entirely.

Filtering down to individual creators on a computer has to happen directly inside the browser DOM after the page loads.

## How Allowlist Mode works in Intentional YT

The extension offers two filtering modes:

* **Blocklist Mode (Default):** YouTube behaves normally, but channels and keywords on your blocklist are stripped out.
* **Allowlist Mode:** YouTube's recommendations, search results, and sidebar suggestions are hidden or dimmed by default, unless the creator matches your approved list.

When Allowlist Mode is active, the extension checks each video container on the page against your saved channel handles (`@creator`) and channel IDs. Videos from unapproved channels are either removed from the layout entirely or dimmed out.

Everything runs on your computer using `browser.storage.local`. Your list of allowed channels stays private on your machine and is never sent to external servers.

## Setting up an allowlist step by step

### 1. Install the extension
If you do not have it installed yet, add Intentional YT to your browser:
* [Chrome Web Store](https://chromewebstore.google.com/detail/intentional-yt/plhapakjiekkfhpjmhmjaplnbckpndbg)
* [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/intentional-yt-youtube-/jjgijacfockomgkhljkhalhapnloonbb)
* [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/intentional-yt/)

### 2. Switch from Blocklist to Allowlist
Click the Intentional YT icon in your browser toolbar to open the menu. Select the **Blocklists** tab. Under **Content Filtering**, change the filter mode from **Blocklist** to **Allowlist**.

### 3. Add your trusted channels
In the **Allowed Channels** box, enter the channel handle, URL, or creator name:
* `@3blue1brown`
* `@mitocw`
* `@khanacademy`

Press **Enter** or click **Add**.

Handles (`@handle`) give you the most consistent match because YouTube keeps handles unique. Multiple creators can share the same display name, which makes handles the safer choice.

### 4. Pick how unapproved videos should look: Hide vs. Dim

Under the allowlist settings, choose what happens to videos that are not on your list:

* **Hide:** Non-approved videos disappear from the page layout entirely. Your home feed and search lists only show your approved channels.
* **Dim:** Non-approved cards remain on the page, but their thumbnails and titles fade to 18% opacity with color removed.

Dim mode is useful when you need to research unfamiliar subjects without getting pulled into colorful clickbait thumbnails. Approved educational channels stay bright and full-color, while distracting suggestions fade into the background.

## Adding channels directly from video cards

You do not need to open the popup and paste handles manually every time you find a creator you like.

Under the **Blocklists** tab, turn on **Show Quick Action buttons**. When browsing YouTube in Allowlist Mode, an **Allow** button (`+ Allow`) appears right next to the channel name on each video card. Clicking it adds that creator to your local list immediately. If you click it by accident, an **Undo** prompt stays on the screen for five seconds.

## Adding topic keywords to your allowlist

You can allow entire topics alongside specific channels.

If you are studying organic chemistry, add terms like `organic chemistry`, `reaction mechanism`, or `stereochemistry` to your **Keyword Allowlist**. Videos matching those terms will stay visible in search results, even if they come from creators you have not yet added to your channel list.

## Optional: Lock your allowlist with a PIN

If you find yourself toggling filters off when fatigue sets in, or if you are preparing a study laptop for a student, you can lock the settings using **Focus Lock**:

1. Open the Intentional YT popup and switch to the **Protect** tab.
2. Turn on **Focus Lock**.
3. Choose a 4-digit PIN and set an unlock cooldown (such as 10, 20, or 30 minutes).
4. Save the lock.

With Focus Lock turned on:
* Switching back to Blocklist Mode requires the PIN.
* You cannot remove channels from your allowlist or increase daily watch limits without waiting through the cooldown timer.
* Closing the browser or restarting the operating system does not bypass the cooldown.

For more details on PIN security, read [how to password-lock your YouTube blocker with Focus Lock](/blog/password-lock-youtube-blocker-focus-lock).

## Comparing whitelist methods

| Feature | YouTube Kids | Router / DNS Blocker | Intentional YT Allowlist |
| --- | --- | --- | --- |
| Works on desktop web browsers | No | Yes | Yes |
| Restricts regular YouTube | No (separate app) | No (blocks the whole domain) | Yes |
| Needs a Google login | Yes | No | No |
| PIN lock support | In-app passcode | Router admin login | Focus Lock |
| Can dim instead of hide | No | No | Yes |

## Common questions

### Does this require a YouTube account?
No. Intentional YT evaluates page elements directly in the browser DOM. It works whether you are signed into an account, logged out on a shared guest profile, or browsing in private windows.

### What happens when I search for something?
In **Hide** mode, search results from channels not on your allowlist are removed from the list. In **Dim** mode, unapproved results appear washed out, while your allowed creators stay clearly visible.

### Can I temporarily view an unlisted video?
If Focus Lock is not active, click **Snooze** in the extension popup to pause filtering for 15, 30, or 60 minutes. When the timer runs out, Allowlist Mode resumes automatically.

### Related guides

* [How to block YouTube channels from search results](/blog/block-youtube-channels-from-search-results)
* [How to block YouTube channels without signing in](/blog/block-youtube-channels-without-signing-in)
* [How to use YouTube for studying without distractions](/blog/use-youtube-for-studying-without-distractions)
* [How to set a daily YouTube time limit](/blog/set-youtube-daily-time-limit)
