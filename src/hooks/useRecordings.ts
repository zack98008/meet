import { useState, useEffect } from "react";
import { Recording } from "@/types/recording";
import {
  fetchRecordings,
  fetchRecentRecordings,
  fetchProcessingRecordings,
  createRecording,
  updateRecording,
  deleteRecording,
} from "@/lib/api";
import { supabase } from "@/lib/supabase";

export function useRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recentRecordings, setRecentRecordings] = useState<Recording[]>([]);
  const [processingRecordings, setProcessingRecordings] = useState<Recording[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadRecordings();

    // Set up realtime subscription
    const subscription = supabase
      .channel("recordings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recordings" },
        () => {
          // Reload all recordings when any change happens
          loadRecordings();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadRecordings() {
    try {
      setLoading(true);
      const [all, recent, processing] = await Promise.all([
        fetchRecordings(),
        fetchRecentRecordings(),
        fetchProcessingRecordings(),
      ]);
      setRecordings(all);
      setRecentRecordings(recent);
      setProcessingRecordings(processing);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function addRecording(recording: Omit<Recording, "id">) {
    try {
      const newRecording = await createRecording(recording);
      return newRecording;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  async function updateRecordingById(id: string, updates: Partial<Recording>) {
    try {
      const updatedRecording = await updateRecording(id, updates);
      return updatedRecording;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  async function deleteRecordingById(id: string) {
    try {
      await deleteRecording(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  return {
    recordings,
    recentRecordings,
    processingRecordings,
    loading,
    error,
    refresh: loadRecordings,
    addRecording,
    updateRecording: updateRecordingById,
    deleteRecording: deleteRecordingById,
  };
}
