import { useEffect, useState } from "react";
import { getGoogleMeetClient, GoogleMeetSession } from "./googleMeetApi";

// Interface for Google Meet detection
export interface GoogleMeetStatus {
  inMeeting: boolean;
  meetingId?: string;
  meetingTitle?: string;
  meetingData?: GoogleMeetSession;
}

// Function to detect if user is in a Google Meet meeting
export function detectGoogleMeet(): GoogleMeetStatus {
  const client = getGoogleMeetClient();

  if (!client.isConnected()) {
    return { inMeeting: false };
  }

  const meeting = client.getCurrentMeeting();
  if (!meeting) {
    return { inMeeting: false };
  }

  return {
    inMeeting: true,
    meetingId: meeting.meetingId,
    meetingTitle: meeting.title,
    meetingData: meeting,
  };
}

// Hook to monitor Google Meet status
export function useGoogleMeetDetection() {
  const [meetStatus, setMeetStatus] = useState<GoogleMeetStatus>({
    inMeeting: false,
  });

  useEffect(() => {
    // Initialize the Google Meet client if not already connected
    const client = getGoogleMeetClient();
    if (!client.isConnected()) {
      client.initialize(import.meta.env.VITE_GOOGLE_MEET_API_KEY || "demo-key");
    }

    // Initial detection
    setMeetStatus(detectGoogleMeet());

    // Set up listeners for meeting events
    client.onMeetingStart((meeting) => {
      setMeetStatus({
        inMeeting: true,
        meetingId: meeting.meetingId,
        meetingTitle: meeting.title,
        meetingData: meeting,
      });
    });

    client.onMeetingEnd((meetingId) => {
      setMeetStatus({
        inMeeting: false,
      });
    });

    return () => {
      // Don't disconnect the client here as it might be used by other components
    };
  }, []);

  return meetStatus;
}

// Function to connect to Google Meet API
export function connectToGoogleMeet() {
  console.log("Connecting to Google Meet API...");
  const client = getGoogleMeetClient();

  if (!client.isConnected()) {
    client.initialize(import.meta.env.VITE_GOOGLE_MEET_API_KEY || "demo-key");
  }

  return {
    onMeetingStart: (callback: (meetingId: string, title: string) => void) => {
      client.onMeetingStart((meeting) => {
        callback(meeting.meetingId, meeting.title);
      });
    },

    onMeetingEnd: (callback: () => void) => {
      client.onMeetingEnd(() => {
        callback();
      });
    },

    startRecording: (meetingId: string) => {
      return client.startRecording(meetingId);
    },

    stopRecording: (meetingId: string) => {
      return client.stopRecording(meetingId);
    },

    disconnect: () => {
      // Don't actually disconnect as other components might be using it
      console.log("Disconnected from Google Meet API");
    },
  };
}
