# Store upload assets

The upload files are in `marketing/store-assets/`.

## Screenshots (upload in this order)

1. `screenshots/01-calmer-youtube.png` — Shorts and recommendation controls.
2. `screenshots/02-channel-keyword-filters.png` — Example channel and title keyword filters.
3. `screenshots/03-daily-watch-limit.png` — A 45-minute daily playback budget and 30-minute reminders.
4. `screenshots/04-scheduled-focus.png` — An example weekday study schedule.
5. `screenshots/05-focus-lock.png` — Focus Lock with a 10-minute cooldown, in dark mode.

All five are exactly **1280 × 800 pixels**, **24-bit RGB PNG**, **no alpha**.
The interface is captured from the real extension in a temporary profile.
Names and settings are examples; no personal account or usage data is included.

## Small promo tile

`promo-tile-440x280.png` is exactly **440 × 280 pixels**, **24-bit RGB PNG**, **no alpha**.
Upload it in the small promotional tile field, separately from the five screenshots.

## Marquee image

`marquee-1400x560.png` is exactly **1400 × 560 pixels**, **24-bit RGB PNG**, **no alpha**.
It combines the updated logo, an illustrated watch page, and the real extension interface.

## Regenerate

Run `node scripts/generate-store-assets.mjs` with `IYT_PLAYWRIGHT_MODULE`
set to an external Playwright or playwright-core module directory. Chromium must
be available to that installation. Sharp comes from the existing project tooling.
The script checks dimensions, channel count, transparency, and the PNG's
8-bit-per-channel truecolor header before saving each final image.

Run `node scripts/generate-marquee.mjs` with the same environment to regenerate the marquee.

The downloadable archive is `marketing/intentional-yt-store-assets.zip`.
