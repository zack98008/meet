# Google Meet Enhancement Tool Browser Extension

This browser extension enables the Google Meet Enhancement Tool web application to integrate with Google Meet sessions for recording, participant tracking, and analytics.

## Features

- Detect Google Meet sessions automatically
- Record meeting audio
- Track participant information
- Communicate with the web application

## Installation

### For Development

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `browser-extension` directory
5. The extension should now be installed and active

### For Production

1. Download the extension from the Chrome Web Store (link to be added)
2. Follow the installation prompts

## Usage

1. Install the extension
2. Open a Google Meet session
3. The extension will automatically detect the meeting
4. Use the Google Meet Enhancement Tool web application to control recording and view analytics

## Development

### Building the Extension

```bash
# Zip the extension for distribution
zip -r google-meet-enhancement-tool.zip browser-extension/
```

### Testing

1. Make changes to the extension code
2. Go to `chrome://extensions/`
3. Find the Google Meet Enhancement Tool extension
4. Click the refresh icon to reload the extension
5. Test your changes in a Google Meet session

## Security

This extension requests the following permissions:

- `activeTab`: To interact with the Google Meet tab
- `storage`: To store settings and temporary data
- `tabs`: To detect Google Meet tabs
- `https://meet.google.com/*`: To access Google Meet sessions

The extension does not collect any personal data beyond what is necessary for the functionality of the Google Meet Enhancement Tool.

## Support

For support, please contact support@tempolabs.ai or visit our help center at https://tempolabs.ai/help.
