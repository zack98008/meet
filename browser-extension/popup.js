// Popup script for Google Meet Enhancement Tool

// DOM elements
const statusIndicator = document.getElementById("statusIndicator");
const statusText = document.getElementById("statusText");
const statusDetails = document.getElementById("statusDetails");
const meetingInfo = document.getElementById("meetingInfo");
const meetingTitle = document.getElementById("meetingTitle");
const meetingId = document.getElementById("meetingId");
const meetingStartTime = document.getElementById("meetingStartTime");
const participantCount = document.getElementById("participantCount");
const noMeetingMessage = document.getElementById("noMeetingMessage");
const controls = document.getElementById("controls");
const startRecordingBtn = document.getElementById("startRecordingBtn");
const stopRecordingBtn = document.getElementById("stopRecordingBtn");

// State
let isRecording = false;
let activeMeeting = null;

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Update UI based on meeting status
function updateUI() {
  if (activeMeeting) {
    // We have an active meeting
    statusIndicator.className = isRecording
      ? "status-indicator recording"
      : "status-indicator active";
    statusText.textContent = isRecording
      ? "Recording in progress"
      : "Meeting in progress";
    statusDetails.textContent = `Connected to ${activeMeeting.title}`;

    // Show meeting info
    meetingInfo.style.display = "block";
    meetingTitle.textContent = activeMeeting.title;
    meetingId.textContent = activeMeeting.meetingId;
    meetingStartTime.textContent = formatDate(activeMeeting.startTime);
    participantCount.textContent = activeMeeting.participants
      ? activeMeeting.participants.length
      : "0";

    // Show controls, hide no meeting message
    controls.style.display = "flex";
    noMeetingMessage.style.display = "none";

    // Show appropriate recording button
    startRecordingBtn.style.display = isRecording ? "none" : "flex";
    stopRecordingBtn.style.display = isRecording ? "flex" : "none";
  } else {
    // No active meeting
    statusIndicator.className = "status-indicator inactive";
    statusText.textContent = "No active meeting";
    statusDetails.textContent = "Open a Google Meet session to get started";

    // Hide meeting info and controls, show no meeting message
    meetingInfo.style.display = "none";
    controls.style.display = "none";
    noMeetingMessage.style.display = "block";
  }
}

// Get meeting info from background script
function getMeetingInfo() {
  chrome.runtime.sendMessage({ type: "GET_MEETING_INFO" }, (response) => {
    activeMeeting = response.meeting;
    updateUI();
  });
}

// Start recording
function startRecording() {
  if (!activeMeeting) return;

  chrome.runtime.sendMessage({ type: "START_RECORDING" }, (response) => {
    if (response.success) {
      isRecording = true;
      updateUI();
    }
  });
}

// Stop recording
function stopRecording() {
  if (!activeMeeting || !isRecording) return;

  chrome.runtime.sendMessage({ type: "STOP_RECORDING" }, (response) => {
    if (response.success) {
      isRecording = false;
      updateUI();
    }
  });
}

// Event listeners
startRecordingBtn.addEventListener("click", startRecording);
stopRecordingBtn.addEventListener("click", stopRecording);

// Open dashboard link
document.querySelector(".footer a").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({
    url: "https://nice-hofstadter8-blhvp.dev.tempolabs.ai",
  });
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  getMeetingInfo();
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "RECORDING_STATUS_CHANGED") {
    isRecording = message.isRecording;
    updateUI();
  }

  if (message.type === "MEETING_UPDATED") {
    activeMeeting = message.meeting;
    updateUI();
  }
});
