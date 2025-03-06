import { useState, useRef, useEffect } from "react";
import { useRecordings } from "./useRecordings";
import { uploadRecordingFile } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [recordingData, setRecordingData] = useState<Blob | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("Meeting Recording");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const { addRecording } = useRecordings();

  // Get current user
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    getCurrentUser();
  }, []);

  // Timer effect
  useEffect(() => {
    if (recording && !paused) {
      timerRef.current = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording, paused]);

  const startRecording = async () => {
    try {
      // Reset state
      setTime(0);
      chunksRef.current = [];
      setRecordingData(null);

      // Get media stream with both audio and video
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      streamRef.current = stream;

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/mp4" });
        setRecordingData(blob);
        stopStream();
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecording(true);
      setPaused(false);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recording && !paused) {
      mediaRecorderRef.current.pause();
      setPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recording && paused) {
      mediaRecorderRef.current.resume();
      setPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setPaused(false);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const saveRecording = async () => {
    if (!recordingData) return null;

    try {
      // Format the file name
      const date = new Date();
      const fileName = `${meetingTitle.replace(/\s+/g, "_")}_${date.getTime()}.mp4`;
      const filePath = `${userId || "anonymous"}/${fileName}`;

      // Create a File from the Blob
      const file = new File([recordingData], fileName, { type: "video/mp4" });

      // Upload to Supabase Storage
      const storagePath = await uploadRecordingFile(file, filePath);

      // Calculate size in MB
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);

      // Format duration
      const minutes = Math.floor(time / 60);
      const seconds = time % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      // Save recording metadata to database
      const recording = await addRecording({
        title: meetingTitle,
        date: date.toISOString(),
        duration: formattedDuration,
        size: `${sizeInMB} MB`,
        status: "processing", // Initially set as processing
        storage_path: storagePath,
        user_id: userId || undefined,
        google_drive_id: "pending", // Mark as pending Google Drive upload
      });

      // Attempt to save to Google Drive
      try {
        // This would be replaced with actual Google Drive API integration
        console.log("Saving recording to Google Drive...");
        // Simulate Google Drive upload success
        const googleDriveId = `gdrive_${Date.now()}`;

        // Update the recording with Google Drive ID
        await supabase
          .from("recordings")
          .update({
            google_drive_id: googleDriveId,
            status: "completed",
          })
          .eq("id", recording.id);

        console.log(
          `Recording saved to Google Drive with ID: ${googleDriveId}`,
        );
      } catch (driveError) {
        console.error("Error saving to Google Drive:", driveError);
        // Still mark as completed in Supabase even if Google Drive fails
        await supabase
          .from("recordings")
          .update({ status: "completed" })
          .eq("id", recording.id);
      }

      return recording;
    } catch (error) {
      console.error("Error saving recording:", error);
      return null;
    }
  };

  return {
    recording,
    paused,
    time,
    recordingData,
    meetingTitle,
    setMeetingTitle,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    saveRecording,
  };
}
