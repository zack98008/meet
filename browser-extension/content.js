// Content script for Google Meet Enhancement Tool

// State variables
let meetingDetected = false;
let meetingId = null;
let meetingTitle = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let participantsObserver = null;

// Function to extract meeting ID from URL
function extractMeetingInfo() {
  const url = window.location.href;
  const urlObj = new URL(url);

  // Format: https://meet.google.com/abc-defg-hij
  if (!urlObj.hostname.includes("meet.google.com")) {
    return null;
  }

  // Extract the meeting code from the path
  const meetingCode = urlObj.pathname.replace("/", "");
  if (!meetingCode || !/^[a-z]+-[a-z]+-[a-z]+$/.test(meetingCode)) {
    return null;
  }

  return {
    meetingId: meetingCode,
    meetingCode: meetingCode,
    url: url,
  };
}

// Function to get meeting title
function getMeetingTitle() {
  // Try to find the meeting title in the DOM
  const titleElement = document.querySelector("[data-meeting-title]");
  if (titleElement) {
    return titleElement.getAttribute("data-meeting-title");
  }

  // Fallback: try to find it in other common elements
  const h1Elements = document.querySelectorAll("h1, h2, h3");
  for (const element of h1Elements) {
    if (element.textContent && element.textContent.trim().length > 0) {
      return element.textContent.trim();
    }
  }

  // If we can't find a title, use the meeting code
  const meetingInfo = extractMeetingInfo();
  return meetingInfo
    ? `Google Meet: ${meetingInfo.meetingCode}`
    : "Google Meet";
}

// Function to get participants
function getParticipants() {
  const participants = [];

  // Try to find the participants panel
  // Google Meet's DOM structure changes frequently, so we need to try multiple selectors
  const participantContainers = [
    // Main participants panel
    document.querySelectorAll('[aria-label="Participants"] [role="listitem"]'),
    // Fallback: try other common selectors
    document.querySelectorAll("[data-participant-id]"),
    document.querySelectorAll("[data-participant-name]"),
    // Another common pattern in Google Meet
    document.querySelectorAll('[jsname="r4nke"]'),
  ];

  // Use the first non-empty container
  let participantElements = [];
  for (const container of participantContainers) {
    if (container && container.length > 0) {
      participantElements = container;
      break;
    }
  }

  // If we still don't have participants, try to find them in the video grid
  if (participantElements.length === 0) {
    const videoElements = document.querySelectorAll("video");
    videoElements.forEach((video, index) => {
      // Try to find the participant name near the video
      let name = "Unknown";
      const nameElement =
        video.closest("[data-participant-name]") ||
        video.closest('[jsname="r4nke"]');

      if (nameElement) {
        name =
          nameElement.getAttribute("data-participant-name") ||
          nameElement.textContent ||
          `Participant ${index + 1}`;
      }

      participants.push({
        id: `video-participant-${index}`,
        name: name.trim(),
        isHost: false, // Can't reliably determine from video grid
        isMuted: video.muted,
        hasCamera: true,
        isCameraOn: !video.paused,
        joinTime: new Date().toISOString(),
      });
    });
  } else {
    // Process the participant elements we found
    participantElements.forEach((element, index) => {
      // Try different ways to get the participant ID
      const id =
        element.getAttribute("data-participant-id") ||
        element.getAttribute("id") ||
        `participant-${index}`;

      // Try different ways to get the name
      let name = "Unknown";
      const nameElement =
        element.querySelector("[data-participant-name]") ||
        element.querySelector(".participant-name") ||
        element;

      if (nameElement) {
        name =
          nameElement.getAttribute("data-participant-name") ||
          nameElement.textContent ||
          `Participant ${index + 1}`;
      }

      // Check for host status
      const isHost =
        element.classList.contains("is-host") ||
        element.querySelector(".host-badge") !== null ||
        name.includes("(You)") ||
        name.includes("(Host)");

      // Check for mute status
      const isMuted =
        element.classList.contains("is-muted") ||
        element.querySelector(".muted-icon") !== null ||
        element.querySelector('[aria-label*="muted"]') !== null;

      // Check for camera status
      const cameraElement = element.querySelector('[aria-label*="camera"]');
      const hasCamera = cameraElement !== null;
      const isCameraOn =
        hasCamera && !cameraElement.getAttribute("aria-label").includes("off");

      participants.push({
        id,
        name: name.trim(),
        isHost,
        isMuted,
        hasCamera,
        isCameraOn,
        joinTime: new Date().toISOString(),
      });
    });
  }

  // If we still have no participants but we're in a meeting, add at least the current user
  if (participants.length === 0 && meetingDetected) {
    participants.push({
      id: "current-user",
      name: "You",
      isHost: true,
      isMuted: false,
      hasCamera: true,
      isCameraOn: true,
      joinTime: new Date().toISOString(),
    });
  }

  return participants;
}

// Function to detect if we're in a Google Meet
function detectMeeting() {
  const meetingInfo = extractMeetingInfo();

  if (meetingInfo && !meetingDetected) {
    console.log("Google Meet detected:", meetingInfo);
    meetingId = meetingInfo.meetingId;
    meetingTitle = getMeetingTitle();

    // Notify background script
    chrome.runtime.sendMessage(
      {
        type: "MEETING_DETECTED",
        meetingId: meetingInfo.meetingId,
        meetingCode: meetingInfo.meetingCode,
        title: meetingTitle,
        url: meetingInfo.url,
        participants: getParticipants(),
      },
      (response) => {
        console.log("Meeting detection response:", response);
      },
    );

    meetingDetected = true;
    setupParticipantObserver();
  } else if (!meetingInfo && meetingDetected) {
    console.log("Google Meet ended");

    // Notify background script
    chrome.runtime.sendMessage({
      type: "MEETING_ENDED",
      meetingId,
    });

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Reset state
    meetingDetected = false;
    meetingId = null;
    meetingTitle = null;

    // Clean up observers
    if (participantsObserver) {
      participantsObserver.disconnect();
      participantsObserver = null;
    }
  }
}

// Function to set up observer for participant changes
function setupParticipantObserver() {
  // Find the container that holds participants
  // This is a simplified example - you'd need to adapt to Google Meet's actual DOM structure
  const participantsContainer = document.querySelector(
    "[data-participants-container]",
  );

  if (participantsContainer && !participantsObserver) {
    participantsObserver = new MutationObserver(() => {
      const participants = getParticipants();

      // Notify background script of participant changes
      chrome.runtime.sendMessage({
        type: "PARTICIPANTS_UPDATED",
        participants,
      });
    });

    participantsObserver.observe(participantsContainer, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }
}

// Function to start recording
async function startRecording() {
  if (isRecording) return;

  try {
    console.log("Starting recording...");

    // Request media stream with audio
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Create media recorder
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    // Set up event handlers
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      console.log("Recording stopped, processing data...");

      // Create blob from recorded chunks
      const blob = new Blob(recordedChunks, { type: "audio/webm" });

      // Send the recording to the background script
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;

        chrome.runtime.sendMessage({
          type: "RECORDING_COMPLETED",
          meetingId,
          title: meetingTitle,
          recording: base64data,
          duration: Math.floor((Date.now() - recordingStartTime) / 1000),
          mimeType: "audio/webm",
        });
      };

      // Clean up
      stream.getTracks().forEach((track) => track.stop());
      isRecording = false;
    };

    // Start recording
    const recordingStartTime = Date.now();
    mediaRecorder.start(1000); // Collect data every second
    isRecording = true;

    console.log("Recording started");
  } catch (error) {
    console.error("Error starting recording:", error);
  }
}

// Function to stop recording
function stopRecording() {
  if (!isRecording || !mediaRecorder) return;

  console.log("Stopping recording...");
  mediaRecorder.stop();
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);

  if (message.type === "START_RECORDING") {
    startRecording();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "STOP_RECORDING") {
    stopRecording();
    sendResponse({ success: true });
    return true;
  }
});

// Run detection on page load and periodically
detectMeeting();
setInterval(detectMeeting, 5000);

// Also detect on URL changes (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(detectMeeting, 1000); // Slight delay to let the page load
  }
}).observe(document, { subtree: true, childList: true });

// Inject a permanent UI overlay
const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.top = "10px";
overlay.style.right = "10px";
overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
overlay.style.color = "white";
overlay.style.padding = "10px 15px";
overlay.style.borderRadius = "8px";
overlay.style.fontSize = "14px";
overlay.style.zIndex = "9999";
overlay.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.3)";
overlay.style.display = "flex";
overlay.style.flexDirection = "column";
overlay.style.gap = "8px";
overlay.style.minWidth = "200px";
document.body.appendChild(overlay);

// Create controls for the overlay
const statusIndicator = document.createElement("div");
statusIndicator.style.display = "flex";
statusIndicator.style.alignItems = "center";
statusIndicator.style.gap = "8px";
overlay.appendChild(statusIndicator);

const statusDot = document.createElement("div");
statusDot.style.width = "12px";
statusDot.style.height = "12px";
statusDot.style.borderRadius = "50%";
statusDot.style.backgroundColor = "#4CAF50";
statusIndicator.appendChild(statusDot);

const statusText = document.createElement("div");
statusText.textContent = "Meet Enhancer Connected";
statusText.style.fontWeight = "bold";
statusIndicator.appendChild(statusText);

// Add recording controls
const controlsContainer = document.createElement("div");
controlsContainer.style.display = "flex";
controlsContainer.style.gap = "8px";
controlsContainer.style.marginTop = "5px";
overlay.appendChild(controlsContainer);

const recordButton = document.createElement("button");
recordButton.textContent = "Record";
recordButton.style.backgroundColor = "#f44336";
recordButton.style.color = "white";
recordButton.style.border = "none";
recordButton.style.borderRadius = "4px";
recordButton.style.padding = "5px 10px";
recordButton.style.cursor = "pointer";
recordButton.style.fontSize = "12px";
recordButton.style.fontWeight = "bold";
recordButton.onclick = () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
};
controlsContainer.appendChild(recordButton);

const settingsButton = document.createElement("button");
settingsButton.textContent = "Settings";
settingsButton.style.backgroundColor = "#2196F3";
settingsButton.style.color = "white";
settingsButton.style.border = "none";
settingsButton.style.borderRadius = "4px";
settingsButton.style.padding = "5px 10px";
settingsButton.style.cursor = "pointer";
settingsButton.style.fontSize = "12px";
settingsButton.style.fontWeight = "bold";
settingsButton.onclick = () => {
  window.open("https://nice-hofstadter8-blhvp.dev.tempolabs.ai", "_blank");
};
controlsContainer.appendChild(settingsButton);

// Add recording timer
const timerDisplay = document.createElement("div");
timerDisplay.style.fontSize = "12px";
timerDisplay.style.color = "#ccc";
timerDisplay.style.marginTop = "5px";
timerDisplay.style.display = "none";
overlay.appendChild(timerDisplay);

let recordingTimer = 0;
let timerInterval = null;

// Update overlay status
function updateOverlay() {
  if (meetingDetected) {
    overlay.style.display = "flex";
    statusText.textContent = isRecording
      ? "Recording in Progress"
      : "Meet Enhancer Connected";
    statusDot.style.backgroundColor = isRecording ? "#f44336" : "#4CAF50";
    recordButton.textContent = isRecording ? "Stop" : "Record";

    if (isRecording) {
      timerDisplay.style.display = "block";
      if (!timerInterval) {
        recordingTimer = 0;
        timerInterval = setInterval(() => {
          recordingTimer++;
          const minutes = Math.floor(recordingTimer / 60);
          const seconds = recordingTimer % 60;
          timerDisplay.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }, 1000);
      }
    } else {
      timerDisplay.style.display = "none";
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  } else {
    overlay.style.display = "none";
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
}

// Update overlay periodically
setInterval(updateOverlay, 1000);
