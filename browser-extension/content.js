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

  // Try to find participant elements in the DOM
  // Note: This is a simplified version and would need to be adapted to Google Meet's actual DOM structure
  const participantElements = document.querySelectorAll(
    "[data-participant-id]",
  );

  participantElements.forEach((element) => {
    const id = element.getAttribute("data-participant-id");
    const name =
      element.querySelector(".participant-name")?.textContent || "Unknown";
    const isHost = element.classList.contains("is-host");
    const isMuted = element.querySelector(".muted-icon") !== null;

    participants.push({
      id,
      name,
      isHost,
      isMuted,
      joinTime: new Date().toISOString(),
    });
  });

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

// Inject a small UI indicator
const indicator = document.createElement("div");
indicator.style.position = "fixed";
indicator.style.bottom = "10px";
indicator.style.right = "10px";
indicator.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
indicator.style.color = "white";
indicator.style.padding = "5px 10px";
indicator.style.borderRadius = "4px";
indicator.style.fontSize = "12px";
indicator.style.zIndex = "9999";
indicator.style.display = "none";
document.body.appendChild(indicator);

// Update indicator status
function updateIndicator() {
  if (meetingDetected) {
    indicator.style.display = "block";
    indicator.textContent = isRecording
      ? "🔴 Recording"
      : "🟢 Meet Enhancer Connected";
    indicator.style.backgroundColor = isRecording
      ? "rgba(255, 0, 0, 0.7)"
      : "rgba(0, 0, 0, 0.7)";
  } else {
    indicator.style.display = "none";
  }
}

// Update indicator periodically
setInterval(updateIndicator, 1000);
