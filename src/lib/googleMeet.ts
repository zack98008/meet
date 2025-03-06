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

  // Save participant data to Supabase
  if (meeting.participants && meeting.participants.length > 0) {
    saveParticipantsToSupabase(meeting.meetingId, meeting.participants);
  }

  return {
    inMeeting: true,
    meetingId: meeting.meetingId,
    meetingTitle: meeting.title,
    meetingData: meeting,
  };
}

// Function to save participants to Supabase
async function saveParticipantsToSupabase(
  meetingId: string,
  participants: any[],
) {
  try {
    const { supabase } = await import("./supabase");

    // Process each participant
    for (const participant of participants) {
      // Check if participant already exists
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("meeting_id", meetingId)
        .eq("participant_id", participant.id)
        .single();

      if (existingParticipant) {
        // Update existing participant
        await supabase
          .from("participants")
          .update({
            is_muted: participant.isMuted,
            is_camera_on: participant.isCameraOn,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingParticipant.id);
      } else {
        // Insert new participant
        await supabase.from("participants").insert({
          meeting_id: meetingId,
          participant_id: participant.id,
          name: participant.name,
          email: participant.email,
          is_host: participant.isHost,
          is_muted: participant.isMuted,
          has_camera: participant.hasCamera,
          is_camera_on: participant.isCameraOn,
          join_time: participant.joinTime || new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("Error saving participants to Supabase:", error);
  }
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
