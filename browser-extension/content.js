// Content script for Google Meet Enhancement Tool
// State variables
let meetingDetected = false;
let meetingId = null;
let meetingTitle = null;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let participantsObserver = null;
let currentParticipants = [];
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
        isScreenSharing: false, // Can't reliably determine from video
      });
    });
  } else {
    // Process participant elements from the participants panel
    participantElements.forEach((element, index) => {
      let name = element.textContent || `Participant ${index + 1}`;
      // Try to extract name from various attributes
      if (element.getAttribute("data-participant-name")) {
        name = element.getAttribute("data-participant-name");
      }

      // Check if host (look for host indicator)
      const isHost =
        element.querySelector('[aria-label*="host"]') !== null ||
        element.textContent.includes("(host)") ||
        element.textContent.includes("(Host)");

      // Check if muted (look for mute indicator)
      const isMuted =
        element.querySelector('[aria-label*="muted"]') !== null ||
        element.querySelector('[title*="muted"]') !== null;

      // Check if camera is on (look for camera indicator)
      const cameraElement =
        element.querySelector('[aria-label*="camera"]') ||
        element.querySelector('[title*="camera"]');
      const hasCamera = cameraElement !== null;
      const isCameraOn =
        hasCamera &&
        !(
          cameraElement.getAttribute("aria-label")?.includes("off") ||
          cameraElement.getAttribute("title")?.includes("off")
        );

      // Check if screen sharing
      const isScreenSharing =
        element.querySelector('[aria-label*="presenting"]') !== null ||
        element.querySelector('[title*="presenting"]') !== null ||
        element.textContent.includes("(presenting)");

      participants.push({
        id:
          element.getAttribute("data-participant-id") || `participant-${index}`,
        name: name.trim(),
        isHost,
        isMuted,
        hasCamera,
        isCameraOn,
        isScreenSharing,
      });
    });
  }

  return participants;
}

// Function to start observing changes in participants
function observeParticipantsChanges() {
  if (participantsObserver) {
    participantsObserver.disconnect();
  }

  // Find participant container
  const participantContainer =
    document.querySelector('[aria-label="Participants"]') ||
    document.querySelector('[jsname="r4nke"]');

  if (!participantContainer) {
    console.log("Participants container not found, will retry later");
    setTimeout(observeParticipantsChanges, 5000);
    return;
  }

  // Set up observer to detect when participants join or leave
  participantsObserver = new MutationObserver((mutations) => {
    const newParticipants = getParticipants();

    // Compare with current participants to detect changes
    if (
      JSON.stringify(newParticipants) !== JSON.stringify(currentParticipants)
    ) {
      // Detect who joined
      newParticipants.forEach((newP) => {
        if (
          !currentParticipants.some(
            (p) => p.id === newP.id || p.name === newP.name,
          )
        ) {
          console.log(`Participant joined: ${newP.name}`);
          // Send event
          chrome.runtime.sendMessage({
            action: "participantJoined",
            participant: newP,
            meetingId,
            meetingTitle,
          });
        }
      });

      // Detect who left
      currentParticipants.forEach((oldP) => {
        if (
          !newParticipants.some((p) => p.id === oldP.id || p.name === oldP.name)
        ) {
          console.log(`Participant left: ${oldP.name}`);
          // Send event
          chrome.runtime.sendMessage({
            action: "participantLeft",
            participant: oldP,
            meetingId,
            meetingTitle,
          });
        }
      });

      // Update current participants
      currentParticipants = newParticipants;

      // Send updated participants list
      chrome.runtime.sendMessage({
        action: "participantsUpdated",
        participants: currentParticipants,
        meetingId,
        meetingTitle,
      });
    }
  });

  participantsObserver.observe(participantContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  console.log("Observing participants changes");
}

// Function to start recording
function startRecording() {
  if (isRecording) {
    console.log("Already recording");
    return;
  }

  // Get video and audio streams
  navigator.mediaDevices
    .getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: true,
    })
    .then((stream) => {
      // Create a media recorder
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      // Handle data available event
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Combine recorded chunks into a blob
        const blob = new Blob(recordedChunks, {
          type: "video/webm",
        });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = `${meetingTitle || "Google Meet Recording"}_${new Date().toISOString()}.webm`;

        // Trigger download
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Notify that recording has stopped
        chrome.runtime.sendMessage({
          action: "recordingStopped",
          meetingId,
          meetingTitle,
        });

        isRecording = false;
      };

      // Start recording
      mediaRecorder.start();
      isRecording = true;

      // Notify that recording has started
      chrome.runtime.sendMessage({
        action: "recordingStarted",
        meetingId,
        meetingTitle,
      });

      console.log("Recording started");

      // Add UI indicator that recording is in progress
      const recordingIndicator = document.createElement("div");
      recordingIndicator.id = "meet-enhancement-recording-indicator";
      recordingIndicator.style =
        "position: fixed; top: 10px; right: 10px; background-color: #f44336; color: white; padding: 5px 10px; border-radius: 5px; z-index: 9999;";
      recordingIndicator.textContent = "● Recording";
      document.body.appendChild(recordingIndicator);

      // Add stop recording button
      const stopButton = document.createElement("button");
      stopButton.textContent = "Stop Recording";
      stopButton.style =
        "margin-left: 10px; background-color: white; color: #f44336; border: none; border-radius: 3px; padding: 2px 5px; cursor: pointer;";
      stopButton.onclick = stopRecording;
      recordingIndicator.appendChild(stopButton);
    })
    .catch((error) => {
      console.error("Error starting recording: ", error);
      alert("Could not start recording: " + error.message);
    });
}

// Function to stop recording
function stopRecording() {
  if (!isRecording || !mediaRecorder) {
    console.log("Not recording");
    return;
  }

  // Stop media recorder
  mediaRecorder.stop();

  // Stop all tracks
  mediaRecorder.stream.getTracks().forEach((track) => track.stop());

  // Remove recording indicator
  const indicator = document.getElementById(
    "meet-enhancement-recording-indicator",
  );
  if (indicator) {
    indicator.remove();
  }

  console.log("Recording stopped");
}

// Function to initialize the enhancement tool
function initializeEnhancementTool() {
  // Check if we're in a Google Meet
  const meetingInfo = extractMeetingInfo();
  if (!meetingInfo) {
    console.log("Not in a Google Meet");
    return;
  }

  meetingId = meetingInfo.meetingId;
  meetingTitle = getMeetingTitle();
  meetingDetected = true;

  console.log(`Google Meet detected: ${meetingTitle} (${meetingId})`);

  // Notify background script that we're in a meeting
  chrome.runtime.sendMessage({
    action: "meetingDetected",
    meetingId,
    meetingTitle,
    url: meetingInfo.url,
  });

  // Get initial participants
  currentParticipants = getParticipants();

  // Start observing participants
  observeParticipantsChanges();

  // Add UI elements
  addEnhancementUI();

  // Listen for commands from background script or popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startRecording") {
      startRecording();
      sendResponse({ success: true });
    } else if (message.action === "stopRecording") {
      stopRecording();
      sendResponse({ success: true });
    } else if (message.action === "getParticipants") {
      sendResponse({ participants: currentParticipants });
    } else if (message.action === "getMeetingInfo") {
      sendResponse({
        meetingId,
        meetingTitle,
        url: meetingInfo.url,
        isRecording,
        participants: currentParticipants,
      });
    }
    return true; // Keep the message channel open for async response
  });
}

// Function to add enhancement UI elements
function addEnhancementUI() {
  // Create toolbar
  const toolbar = document.createElement("div");
  toolbar.id = "meet-enhancement-toolbar";
  toolbar.style =
    "position: fixed; bottom: 70px; left: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); padding: 8px; z-index: 9999; display: flex; gap: 8px;";

  // Add record button
  const recordButton = document.createElement("button");
  recordButton.textContent = "Record Meeting";
  recordButton.style =
    "background-color: #1a73e8; color: white; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px;";
  recordButton.onclick = startRecording;
  toolbar.appendChild(recordButton);

  // Add participants button
  const participantsButton = document.createElement("button");
  participantsButton.textContent = "Participants";
  participantsButton.style =
    "background-color: #ffffff; color: #1a73e8; border: 1px solid #1a73e8; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px;";
  participantsButton.onclick = () => {
    const panel = document.getElementById(
      "meet-enhancement-participants-panel",
    );
    if (panel) {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      updateParticipantsList();
    } else {
      showParticipantsPanel();
    }
  };
  toolbar.appendChild(participantsButton);

  // Add the toolbar to the page
  document.body.appendChild(toolbar);

  console.log("Enhancement UI added");
}

// Function to show participants panel
function showParticipantsPanel() {
  const panel = document.createElement("div");
  panel.id = "meet-enhancement-participants-panel";
  panel.style =
    "position: fixed; top: 80px; right: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2); padding: 16px; z-index: 9998; width: 250px; max-height: 400px; overflow-y: auto;";

  // Add panel header
  const header = document.createElement("div");
  header.style =
    "display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;";

  const title = document.createElement("h3");
  title.textContent = "Participants";
  title.style =
    "margin: 0; font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 16px; color: #202124;";
  header.appendChild(title);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.style =
    "background: none; border: none; font-size: 20px; cursor: pointer; color: #5f6368;";
  closeButton.onclick = () => {
    panel.style.display = "none";
  };
  header.appendChild(closeButton);

  panel.appendChild(header);

  // Add participants list container
  const list = document.createElement("div");
  list.id = "meet-enhancement-participants-list";
  panel.appendChild(list);

  // Add the panel to the page
  document.body.appendChild(panel);

  // Populate the list
  updateParticipantsList();
}

// Function to update participants list in the panel
function updateParticipantsList() {
  const list = document.getElementById("meet-enhancement-participants-list");
  if (!list) return;

  // Clear current list
  list.innerHTML = "";

  // Add participants
  currentParticipants.forEach((participant) => {
    const item = document.createElement("div");
    item.style =
      "padding: 8px 0; border-bottom: 1px solid #f1f3f4; display: flex; align-items: center;";

    // Status indicators
    const indicators = document.createElement("div");
    indicators.style = "display: flex; margin-right: 8px;";

    // Host indicator
    if (participant.isHost) {
      const hostBadge = document.createElement("span");
      hostBadge.textContent = "Host";
      hostBadge.style =
        "background-color: #188038; color: white; font-size: 10px; padding: 2px 4px; border-radius: 2px; margin-right: 4px;";
      indicators.appendChild(hostBadge);
    }

    // Mute indicator
    const muteIcon = document.createElement("span");
    muteIcon.textContent = participant.isMuted ? "🔇" : "🔊";
    muteIcon.style = "margin-right: 4px;";
    indicators.appendChild(muteIcon);

    // Camera indicator
    const cameraIcon = document.createElement("span");
    cameraIcon.textContent = participant.isCameraOn ? "📹" : "❌";
    cameraIcon.style = "margin-right: 4px;";
    indicators.appendChild(cameraIcon);

    // Screen sharing indicator
    if (participant.isScreenSharing) {
      const screenIcon = document.createElement("span");
      screenIcon.textContent = "🖥️";
      screenIcon.style = "margin-right: 4px;";
      indicators.appendChild(screenIcon);
    }

    item.appendChild(indicators);

    // Participant name
    const name = document.createElement("span");
    name.textContent = participant.name;
    name.style =
      "font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px; color: #202124;";
    item.appendChild(name);

    list.appendChild(item);
  });

  // Add count
  const count = document.createElement("div");
  count.textContent = `Total: ${currentParticipants.length} participant${currentParticipants.length !== 1 ? "s" : ""}`;
  count.style =
    "margin-top: 12px; font-family: 'Google Sans', Roboto, Arial, sans-serif; font-size: 14px; color: #5f6368;";
  list.appendChild(count);
}

// Run on page load
window.addEventListener("load", () => {
  // Wait for Google Meet to fully load
  setTimeout(() => {
    initializeEnhancementTool();
  }, 3000);
});

// Listen for URL changes (for single-page app navigation)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Check if we're still in Google Meet
    setTimeout(() => {
      if (!meetingDetected) {
        initializeEnhancementTool();
      } else {
        // Check if we've navigated to a different meeting
        const newMeetingInfo = extractMeetingInfo();
        if (newMeetingInfo && newMeetingInfo.meetingId !== meetingId) {
          console.log("Navigated to a different meeting");
          // Clean up old meeting
          if (participantsObserver) {
            participantsObserver.disconnect();
          }
          if (isRecording) {
            stopRecording();
          }
          // Remove UI elements
          const toolbar = document.getElementById("meet-enhancement-toolbar");
          if (toolbar) toolbar.remove();
          const panel = document.getElementById(
            "meet-enhancement-participants-panel",
          );
          if (panel) panel.remove();

          // Reset state
          meetingDetected = false;
          meetingId = null;
          meetingTitle = null;
          currentParticipants = [];

          // Initialize for new meeting
          initializeEnhancementTool();
        }
      }
    }, 2000);
  }
}).observe(document, { subtree: true, childList: true });
