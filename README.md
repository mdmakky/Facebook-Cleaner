# Facebook Cleaner Chrome Extension

A Chrome extension that helps you clean up your Facebook experience by hiding unnecessary components like friend suggestions, reels, sponsored content, and stories.

## Features

- 🧹 **Hide Friend Suggestions**: Remove "People You May Know" sections
- 🎬 **Hide Reels**: Remove Reels from your feed and sidebar  
- 💰 **Hide Sponsored Content**: Remove sponsored/promoted posts
- 📸 **Hide Stories**: Remove Stories from the top of your feed
- 🔄 **Toggle On/Off**: Easy toggle via extension icon or popup
- ⚙️ **Granular Control**: Enable/disable individual features
- 🚀 **Real-time**: Works on dynamically loaded content

## Installation

### Method 1: Load Unpacked Extension (Developer Mode)

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" button
5. Select the folder containing the extension files
6. The extension should now appear in your extensions list

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon.

## Usage

### Quick Toggle
- Click the Facebook Cleaner icon in your Chrome toolbar
- The badge shows "ON" (green) or "OFF" (red) status
- Click to toggle the entire extension on/off

### Detailed Controls
- Click the extension icon to open the popup
- Toggle individual features on/off:
  - Extension (master toggle)
  - Friend Suggestions
  - Reels  
  - Sponsored Posts
  - Stories
- Changes apply immediately (you may need to refresh Facebook)

## How It Works

The extension uses:
- **Content Scripts**: Inject CSS and JavaScript into Facebook pages
- **Background Script**: Handle extension state and icon clicks
- **Popup Interface**: Provide detailed controls for each feature
- **Mutation Observer**: Detect and hide dynamically loaded content

## File Structure

```
facebook-element-hider/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── content.js          # Content script for Facebook
├── styles.css          # CSS for hiding elements
├── popup.html          # Popup interface
├── popup.js            # Popup functionality
├── icon16.png          # 16x16 icon
├── icon48.png          # 48x48 icon
├── icon128.png         # 128x128 icon
└── README.md           # This file
```

## Permissions

The extension requires:
- `scripting`: To inject content scripts
- `storage`: To save user preferences
- `host_permissions`: Access to facebook.com

## Privacy

- No data is collected or transmitted
- All settings are stored locally on your device
- The extension only operates on Facebook pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Facebook
5. Submit a pull request

## Known Issues

- Some elements may reappear when Facebook updates their layout
- Very new UI elements might not be caught immediately
- Works best with English Facebook interface

## Troubleshooting

**Extension not working?**
- Refresh the Facebook page
- Check if the extension is enabled
- Try toggling individual features

**Still seeing unwanted content?**
- Facebook frequently changes their HTML structure
- Report issues with specific elements you're seeing

## License

MIT License - feel free to modify and distribute

## Support

If you encounter issues or have suggestions:
1. Check existing issues on GitHub
2. Create a new issue with details
3. Include screenshots if possible

---

**Note**: This extension is not affiliated with Facebook/Meta. It simply modifies the display of content on your local browser.