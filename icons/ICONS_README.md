# Icons

This directory contains the application icons for Intentional YT:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)
- `icon-512.png` (512x512)
- `icon.svg` (source SVG)

The mark uses a filled blue rounded square, a bold white focus arc, and a
solid play symbol for legibility at favicon and pinned-toolbar sizes.
`icon.png` is the 128px copy used by the popup.

After editing `icons/icon.svg`, run `node scripts/generate-icons.cjs`.
This regenerates the PNGs, copies the source and assets to `public/icons/`,
and updates both favicon.ico files with 16px, 32px, 48px, and 96px images.
Favicons use `icons/favicon.svg`, with an edge-to-edge blue background and
a centered mark for circular crops. The generator also exports this source
to `public/favicon.svg` and creates `public/favicon-96.png`.
Sharp is used only by this build script; extension runtime scripts remain
dependency-free.
