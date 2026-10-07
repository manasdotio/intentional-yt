# Hero visual assets

The hero combines an illustrated YouTube watch page with screenshots of the actual Intentional YT extension. The browser scene is an illustration, not a screenshot of a live video. Its caption identifies this distinction.

- `public/screenshots/hero-calm-landscape.webp`: original landscape artwork, generated with the built-in image_gen tool, resized to 1,000 pixels wide and encoded as WebP.
- `public/screenshots/hero-extension-light.webp` and `hero-extension-dark.webp`: real extension Block tab captures at 2x resolution, in a fresh temporary browser profile. No personal browsing data is shown.
- `src/components/HeroShowcase.jsx`: responsive composition, with theme styles in `src/index.css`.

## Generation prompt

Use case: stylized-concept. Asset type: landscape still inside a video player on a thoughtfully designed browser-extension landing page. Create a sophisticated, serene editorial landscape illustration: a winding blue river through soft sage-green hills, distant misty mountains, a warm pale apricot sky, one small sun, and a few subtle dark green trees in the foreground. Beautiful layered paper-like forms, soft painterly grain, natural subdued colors with deep teal-blue water, premium travel journal art direction. Wide landscape composition, generous open sky, calm and inviting, balanced visual depth. This image will occupy only the video region of a browser mockup, so fill the entire canvas with the landscape. No interface, no browser chrome, no typography, no labels, no logos, no watermark. Aim for 3:2 landscape.

## Capture notes

Load a temporary Chromium-compatible copy of the source extension with only `background.service_worker`. Open its real `ui/popup.html`, dismiss the welcome banner through its button, move the pointer away from the controls, wait for fonts, and capture `#shell` at a 540 × 530 CSS-pixel viewport with device scale factor 2. Capture each system color scheme separately. Encode screenshots as WebP at quality 90. Extension source files remain unchanged.
