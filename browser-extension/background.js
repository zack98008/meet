// Background script for Google Meet Enhancement Tool

// Store active meeting information
let activeMeeting = null;
let appConnection = null;
let isRecording = false;

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  // Handle legacy message types
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
    isRecording = false;

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
        chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
      }
    });

    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    // Forward the stop recording command to the content script
    chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "stopRecording" });
      }
    });

    sendResponse({ success: true });
    return true;
  }

  // Handle new message types from content.js
  if (message.action === "meetingDetected") {
    // Store meeting info
    activeMeeting = {
      meetingId: message.meetingId,
      meetingCode: message.meetingId, // Using meetingId as meetingCode
      title: message.meetingTitle,
      url: message.url,
      startTime: new Date().toISOString(),
      participants: [],
      hostEmail: "", // Will be updated if available
    };

    // Update extension icon
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });

    // Notify popup about meeting update
    chrome.runtime.sendMessage({
      type: "MEETING_UPDATED",
      meeting: activeMeeting,
    });

    // If we have an active connection to the web app, send the meeting info
    if (appConnection) {
      appConnection.postMessage({
        type: "MEETING_STARTED",
        meeting: activeMeeting,
      });
    }

    sendResponse({ success: true });
    return true;
  }

  if (message.action === "participantsUpdated") {
    if (activeMeeting && activeMeeting.meetingId === message.meetingId) {
      activeMeeting.participants = message.participants;

      // Notify popup
      chrome.runtime.sendMessage({
        type: "MEETING_UPDATED",
        meeting: activeMeeting,
      });

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

  if (message.action === "recordingStarted") {
    isRecording = true;

    // Notify popup
    chrome.runtime.sendMessage({
      type: "RECORDING_STATUS_CHANGED",
      isRecording: true,
    });

    // If we have an active connection to the web app, send recording status
    if (appConnection) {
      appConnection.postMessage({
        type: "RECORDING_STARTED",
        meetingId: message.meetingId,
      });
    }

    sendResponse({ success: true });
    return true;
  }

  if (message.action === "recordingStopped") {
    isRecording = false;

    // Notify popup
    chrome.runtime.sendMessage({
      type: "RECORDING_STATUS_CHANGED",
      isRecording: false,
    });

    // If we have an active connection to the web app, send recording status
    if (appConnection) {
      appConnection.postMessage({
        type: "RECORDING_STOPPED",
        meetingId: message.meetingId,
      });
    }

    sendResponse({ success: true });
    return true;
  }

  // Default response
  sendResponse({ success: false, error: "Unknown message type" });
  return true;
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

    // If recording is in progress, also send that info
    if (isRecording) {
      port.postMessage({
        type: "RECORDING_STARTED",
        meetingId: activeMeeting.meetingId,
      });
    }
  }

  // Listen for messages from the web app
  port.onMessage.addListener((message) => {
    console.log("Received message from web app:", message);

    if (message.type === "START_RECORDING" && activeMeeting) {
      // Forward the recording command to the content script
      chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
        }
      });
    }

    if (message.type === "STOP_RECORDING" && activeMeeting) {
      // Forward the stop recording command to the content script
      chrome.tabs.query({ url: "https://meet.google.com/*" }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "stopRecording" });
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

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the URL is a Google Meet URL and if we need to inject the content script
  if (
    tab.url &&
    tab.url.includes("meet.google.com") &&
    changeInfo.status === "complete"
  ) {
    console.log("Google Meet tab detected:", tab.url);

    // We don't need to explicitly inject the content script if it's already
    // specified in the manifest.json, but we can send a message to wake it up
    chrome.tabs.sendMessage(tabId, { action: "checkMeeting" }, (response) => {
      // If there's an error, the content script might not be loaded yet
      if (chrome.runtime.lastError) {
        console.log("Content script not ready yet");
      }
    });
  }
});
