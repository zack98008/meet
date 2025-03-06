import { useState, useEffect, useCallback, useRef } from "react";
import { useRecorder } from "./useRecorder";
import { connectToGoogleMeet, useGoogleMeetDetection } from "@/lib/googleMeet";
import { supabase } from "@/lib/supabase";

export interface MeetingMetadata {
  meetingId: string;
  title: string;
  startTime: string;
  participants?: string[];
  hostEmail?: string;
}

export function useGoogleMeetRecording(autoRecord: boolean = false) {
  const [meetingStatus, setMeetingStatus] = useState<
    "not-started" | "in-progress" | "ended"
  >("not-started");
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(autoRecord);
  const [meetingMetadata, setMeetingMetadata] =
    useState<MeetingMetadata | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const recorder = useRecorder();
  const meetStatus = useGoogleMeetDetection();
  const meetApiRef = useRef<ReturnType<typeof connectToGoogleMeet> | null>(
    null,
  );

  // Save meeting metadata to Supabase
  const saveMeetingMetadata = useCallback(async (metadata: MeetingMetadata) => {
    try {
      const { error } = await supabase.from("meeting_metadata").upsert({
        meeting_id: metadata.meetingId,
        title: metadata.title,
        start_time: metadata.startTime,
        participants: metadata.participants,
        host_email: metadata.hostEmail,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving meeting metadata:", error);
      }
    } catch (err) {
      console.error("Failed to save meeting metadata:", err);
    }
  }, []);

  // Update meeting status based on Google Meet detection
  useEffect(() => {
    if (meetStatus.inMeeting) {
      setMeetingStatus("in-progress");
      if (meetStatus.meetingId) {
        setCurrentMeetingId(meetStatus.meetingId);
      }
      if (meetStatus.meetingTitle) {
        recorder.setMeetingTitle(meetStatus.meetingTitle);
      }

      // If we have detailed meeting data, save it
      if (meetStatus.meetingData) {
        const metadata: MeetingMetadata = {
          meetingId: meetStatus.meetingData.meetingId,
          title: meetStatus.meetingData.title,
          startTime: meetStatus.meetingData.startTime.toISOString(),
          participants: meetStatus.meetingData.participants.map((p) => p.name),
          hostEmail: meetStatus.meetingData.hostEmail,
        };

        setMeetingMetadata(metadata);
        saveMeetingMetadata(metadata);
      }
    } else {
      setMeetingStatus("not-started");
      setCurrentMeetingId(null);
    }
  }, [meetStatus, recorder, saveMeetingMetadata]);

  // Connect to Google Meet API and set up auto-recording
  useEffect(() => {
    // Only create the API connection once
    if (!meetApiRef.current) {
      meetApiRef.current = connectToGoogleMeet();
    }

    const meetApi = meetApiRef.current;

    const handleMeetingStart = (meetingId: string, title: string) => {
      setMeetingStatus("in-progress");
      setCurrentMeetingId(meetingId);
      recorder.setMeetingTitle(title);
      setRecordingError(null);

      // Create meeting metadata
      const metadata: MeetingMetadata = {
        meetingId,
        title,
        startTime: new Date().toISOString(),
      };
      setMeetingMetadata(metadata);
      saveMeetingMetadata(metadata);

      // Auto-start recording if enabled
      if (autoRecordEnabled && !recorder.recording) {
        try {
          recorder.startRecording();

          // Also start recording via Google Meet API if available
          meetApi.startRecording?.(meetingId).catch((err) => {
            console.error("Failed to start Google Meet recording:", err);
          });
        } catch (err) {
          console.error("Failed to start recording:", err);
          setRecordingError("Failed to start recording");
        }
      }
    };

    const handleMeetingEnd = () => {
      setMeetingStatus("ended");

      // Auto-stop recording if it's running
      if (recorder.recording) {
        try {
          recorder.stopRecording();

          // Also stop recording via Google Meet API if available
          if (currentMeetingId && meetApi.stopRecording) {
            meetApi.stopRecording(currentMeetingId).catch((err) => {
              console.error("Failed to stop Google Meet recording:", err);
            });
          }

          // Auto-save the recording
          setTimeout(() => {
            recorder.saveRecording().then((recording) => {
              // Link the recording to the meeting metadata if available
              if (recording && meetingMetadata) {
                supabase
                  .from("recordings")
                  .update({ meeting_id: meetingMetadata.meetingId })
                  .eq("id", recording.id)
                  .then(({ error }) => {
                    if (error) {
                      console.error(
                        "Error linking recording to meeting:",
                        error,
                      );
                    }
                  });
              }
            });
          }, 1000);
        } catch (err) {
          console.error("Failed to stop recording:", err);
          setRecordingError("Failed to stop recording");
        }
      }

      setMeetingMetadata(null);
    };

    meetApi.onMeetingStart(handleMeetingStart);
    meetApi.onMeetingEnd(handleMeetingEnd);

    return () => {
      // We don't disconnect the API as it might be used by other components
      // meetApi.disconnect();
    };
  }, [
    autoRecordEnabled,
    recorder,
    currentMeetingId,
    meetingMetadata,
    saveMeetingMetadata,
  ]);

  // Function to manually start recording with Google Meet integration
  const startMeetingRecording = useCallback(async () => {
    try {
      // Start local recording
      recorder.startRecording();

      // Try to start recording via extension first if available
      let extensionStarted = false;
      try {
        const { getExtensionConnector } = require("../lib/extensionConnector");
        const connector = getExtensionConnector();
        if (connector.isConnected()) {
          extensionStarted = connector.startRecording();
        }
      } catch (err) {
        console.log("Extension not available for recording");
      }

      // If extension recording failed, fall back to API
      if (
        !extensionStarted &&
        currentMeetingId &&
        meetApiRef.current?.startRecording
      ) {
        await meetApiRef.current.startRecording(currentMeetingId);
      }

      setRecordingError(null);
      return true;
    } catch (err) {
      console.error("Failed to start meeting recording:", err);
      setRecordingError("Failed to start recording");
      return false;
    }
  }, [recorder, currentMeetingId]);

  // Function to manually stop recording with Google Meet integration
  const stopMeetingRecording = useCallback(async () => {
    try {
      // Stop local recording
      recorder.stopRecording();

      // Try to stop recording via extension first if available
      let extensionStopped = false;
      try {
        const { getExtensionConnector } = require("../lib/extensionConnector");
        const connector = getExtensionConnector();
        if (connector.isConnected()) {
          extensionStopped = connector.stopRecording();
        }
      } catch (err) {
        console.log("Extension not available for stopping recording");
      }

      // If extension recording stop failed, fall back to API
      if (
        !extensionStopped &&
        currentMeetingId &&
        meetApiRef.current?.stopRecording
      ) {
        await meetApiRef.current.stopRecording(currentMeetingId);
      }

      setRecordingError(null);
      return true;
    } catch (err) {
      console.error("Failed to stop meeting recording:", err);
      setRecordingError("Failed to stop recording");
      return false;
    }
  }, [recorder, currentMeetingId]);

  return {
    ...recorder,
    meetingStatus,
    currentMeetingId,
    meetingMetadata,
    autoRecordEnabled,
    setAutoRecordEnabled,
    recordingError,
    startMeetingRecording,
    stopMeetingRecording,
  };
}
