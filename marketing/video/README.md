# Intentional YT promo

`intentional-yt-promo-15s.mp4`: 15 seconds, 1920 × 1080, 30 fps, H.264 video and stereo AAC audio. Final composition holds from 13 to 15 seconds.

Direction: distracting feed cards → focus controls → “Your YouTube. A little calmer.”
Uses the project logo, actual extension screenshot, and existing landscape artwork (see `../hero-visual-notes.md`). Feature callouts and browser scene are illustrations. The 45-minute limit is an example, not captured usage data.

The soundtrack and transition sounds are synthesized by the renderer, without third-party audio. The HTML preview is silent; the exported MP4 includes audio.

## Narrated version

`intentional-yt-promo-15s-voiceover.mp4` adds an English neural voiceover (Microsoft Jenny) timed to the three scenes, with the original music lowered beneath it. Narration source audio and the timed script are in `narration/`. This is a synthetic voice, not a human recording.

To regenerate narration and mix, set `IYT_TTS_MODULE` to an external `msedge-tts` module directory and `IYT_FFMPEG` to FFmpeg, then run `node scripts/add-promo-voiceover.mjs`. Speech generation sends only the public narration script to Microsoft's Read Aloud service. The original music-only video is retained.

Editable composition: `../promo-animation.html`. Open via a local static server for a repeating preview.

To render, set `IYT_PLAYWRIGHT_MODULE` to an external Playwright module directory and `IYT_FFMPEG` to an FFmpeg executable supporting libx264. Run `node scripts/generate-promo-video.mjs` from the repository. No extension or website dependencies are added.

The renderer verifies duration, resolution, frame rate, audio presence, and full-file decoding. `storyboard.jpg` contains four representative frames.
