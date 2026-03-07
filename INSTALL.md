# YouTube Focus Guard Installation Instructions

## Prerequisites
- Firefox Browser (v60 or later recommended)
- Basic familiarity with loading extensions in Firefox

## Installation Steps

### Method 1: Development Installation (Temporary)

1. **Download the Extension**
   - Download or clone this repository to your computer
   - Extract if downloaded as ZIP

2. **Open Firefox Developer Tools**
   - Open Firefox
   - Type `about:debugging` in the address bar and press Enter
   - Click "This Firefox" in the left sidebar

3. **Load the Extension**
   - Click "Load Temporary Add-on"
   - Navigate to the extension folder
   - Select the `manifest.json` file
   - Click "Open"

4. **Verify Installation**
   - The extension should appear in the list of temporary extensions
   - Look for the Focus Guard icon in your Firefox toolbar
   - Click the icon to open the popup and configure settings

### Method 2: Permanent Installation

1. **Create Extension Package**
   - Zip the entire extension folder
   - Rename the .zip file to have a .xpi extension (e.g., `youtube-focus-guard.xpi`)

2. **Install via File**
   - Open Firefox
   - Type `about:addons` in the address bar
   - Click the gear icon (⚙️) and select "Install Add-on From File"
   - Select your .xpi file

3. **Grant Permissions**
   - Firefox will ask for permissions to:
     - Access data for youtube.com
     - Store data locally
     - Manage tabs
   - Click "Accept" to grant these permissions

## First Time Setup

### 1. Configure Night Lock
- Click the extension icon in the toolbar
- Toggle "Sleep Protection" on (if not already enabled)
- Set your sleep schedule:
  - **Start time**: When YouTube should be blocked (default: 23:30)
  - **End time**: When YouTube should be unblocked (default: 06:00)

### 2. Set Entertainment Limit
- Adjust the daily entertainment limit (default: 30 minutes)
- This limit only applies when not in Research Mode

### 3. Test the Extension
- Visit YouTube.com
- You should see the home feed is hidden
- Try searching for a topic to trigger Research Mode
- The timer overlay should appear when watching videos

## Troubleshooting

### Extension Not Working
- Ensure you're on youtube.com (not m.youtube.com)
- Try refreshing the YouTube page
- Check browser console for any errors (F12 → Console)

### Timer Overlay Not Showing
- The overlay only appears on video watch pages (`/watch`)
- Try clicking a video to start watching

### Night Lock Not Working
- Check that the current time is within your configured lock hours
- Verify the extension has proper permissions
- Try disabling and re-enabling the night lock

### Settings Not Saving
- Ensure Firefox has permission to store local data
- Try closing and reopening the popup

## Usage Tips

### Research Mode
- Search for specific topics on YouTube
- A popup will ask if you're here for "Research" or "Entertainment"
- Choose "Research" for unlimited, topic-focused watching
- Choose "Entertainment" to have the daily limit enforced

### Break Management
- Take breaks when prompted - they help maintain focus
- Use the "Take a Break" button in the timer overlay
- The break timer will count down 5 minutes

### Daily Limits
- Entertainment watching is limited to your configured daily minutes
- Research mode has no time limits
- Limits reset at midnight each day

## Uninstalling

### Temporary Installation
- Go to `about:debugging`
- Click "Remove" next to YouTube Focus Guard

### Permanent Installation  
- Go to `about:addons`
- Find YouTube Focus Guard
- Click "Remove"

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Ensure you're using a supported Firefox version
3. Try disabling other YouTube-related extensions temporarily
4. Check the browser console for error messages

## Privacy

This extension:
- ✅ Only works on YouTube pages
- ✅ Stores all data locally (no external servers)
- ✅ No data collection or tracking
- ✅ No network requests to third parties