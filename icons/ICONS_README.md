# 🎨 YouTube Focus Guard Icons

This folder should contain the extension icons in PNG format with the following sizes:

## Required Icon Files
- `icon-16.png` - 16x16 pixels (toolbar icon)
- `icon-32.png` - 32x32 pixels (small icon)
- `icon-48.png` - 48x48 pixels (extension management)
- `icon-128.png` - 128x128 pixels (Chrome Web Store, high resolution)

## Design Guidelines

### Visual Identity
- **Primary Symbol**: 🎯 Target/focus symbol or ⏱️ timer
- **Color Scheme**: Blue (#2563eb) primary, white/dark mode compatible
- **Style**: Clean, minimal, professional
- **Recognition**: Should be instantly recognizable as a focus/productivity tool

### Design Specifications
- **Format**: PNG with transparency
- **Background**: Transparent for all sizes
- **Border**: 2px padding from edge minimum
- **Style**: Flat design or subtle gradient
- **Contrast**: High contrast for visibility in both light/dark themes

### Suggested Design Elements
1. **Shield + Timer**: Protective shield with clock/timer elements
2. **Target + Eye**: Bullseye target with eye symbol for focus
3. **Clock + Block**: Clock with prohibition symbol for time blocking
4. **YT + Guard**: Stylized YouTube logo with protective elements

## Creating Icons

### Option 1: Online Icon Generators
- **canva.com**: Free icon design tools
- **favicon.io**: Generate icons from text or image
- **IconFinder**: Professional icon marketplace

### Option 2: Design Software
- **Adobe Illustrator**: Vector-based for scalability
- **Figma**: Free web-based design tool
- **GIMP**: Free alternative to Photoshop

### Option 3: AI Generation
- Use AI tools like DALL-E, Midjourney, or Stable Diffusion
- Prompt: "Clean minimal icon for YouTube focus productivity app, target symbol, blue color, transparent background"

## Quick Setup Instructions

1. **Create or download** your icon design in at least 128x128 resolution
2. **Export/resize** to all required sizes (16, 32, 48, 128 pixels)
3. **Replace this folder** with the actual PNG files:
   ```
   icons/
   ├── icon-16.png
   ├── icon-32.png
   ├── icon-48.png
   └── icon-128.png
   ```
4. **Test the extension** - icons should appear in Firefox toolbar and about:addons

## Temporary Workaround

If you need to test the extension immediately:
1. Find any 128x128 PNG image
2. Resize it to create all four required sizes
3. Rename files to match the required names
4. Replace when you have proper icons ready

## Color Palette Reference

```css
/* Extension color scheme for reference */
--yfg-primary: #2563eb;      /* Blue primary */
--yfg-primary-dark: #1d4ed8; /* Darker blue */
--yfg-success: #059669;      /* Green accents */
--yfg-warning: #d97706;      /* Orange warnings */
--yfg-danger: #dc2626;       /* Red blocking */
--yfg-text: #111827;         /* Dark text */
--yfg-text-light: #6b7280;   /* Light text */
```

---

**Need help creating icons? Check online tutorials for browser extension icon design or hire a designer for professional results.**