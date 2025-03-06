// Background script for Google Meet Enhancement Tool

// Store active meeting information
let activeMeeting = null;
let appConnection = null;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "MEETING_DETECTED") {
    // Store meeting info
    activeMeeting = {
      meetingId: message.meetingId,
      meetingCode: message.meetingCode,
      title: message.title,
      url: message.url,
      startTime: new Date().toISOString(),
      participants: message.participants || [],
      hostEmail: message.hostEmail,
    };

    // If we have an active connection to the web app, send the meeting info
    if (appConnection) {
      appConnection.postMessage({
        type: "MEETING_STARTED",
        meeting: activeMeeting,
      });
    }

    // Update extension icon to show active state
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "MEETING_ENDED") {
    // If we have an active connection to the web app, send the meeting ended event
    if (appConnection && activeMeeting) {
      appConnection.postMessage({
        type: "MEETING_ENDED",
        meetingId: activeMeeting.meetingId,
      });
    }

    // Clear active meeting
    activeMeeting = null;

    // Update extension icon
    chrome.action.setBadgeText({ text: "" });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "PARTICIPANTS_UPDATED") {
    // Update participants list
    if (activeMeeting) {
      activeMeeting.participants = message.participants;

      // If we have an active connection to the web app, send the updated participants
      if (appConnection) {
        appConnection.postMessage({
          type: "PARTICIPANTS_UPDATED",
          meetingId: activeMeeting.meetingId,
          participants: message.participants,
        });
      }
    }

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "GET_MEETING_INFO") {
    sendResponse({ meeting: activeMeeting });
    return true;
  }

  if (message.type === "START_RECORDING") {
    // Forward the recording command to the content script
    chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "START_RECORDING" });
      }
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    // Forward the stop recording command to the content script
    chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "STOP_RECORDING" });
      }
    });

    sendResponse({ success: true });
    return true;
  }
});

// Listen for external connections (from our web app)
chrome.runtime.onConnectExternal.addListener((port) => {
  console.log("External connection established with:", port.sender.url);

  // Store the connection
  appConnection = port;

  // If we already have an active meeting, send the info immediately
  if (activeMeeting) {
    port.postMessage({
      type: "MEETING_STARTED",
      meeting: activeMeeting,
    });
  }

  // Listen for messages from the web app
  port.onMessage.addListener((message) => {
    console.log("Received message from web app:", message);

    if (message.type === "START_RECORDING" && activeMeeting) {
      // Forward the recording command to the content script
      chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "START_RECORDING" });
        }
      });
    }

    if (message.type === "STOP_RECORDING" && activeMeeting) {
      // Forward the stop recording command to the content script
      chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "STOP_RECORDING" });
        }
      });
    }
  });

  // Handle disconnection
  port.onDisconnect.addListener(() => {
    console.log("Web app disconnected");
    appConnection = null;
  });
});

// When the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Google Meet Enhancement Tool installed/updated");
});
