import { supabase } from "./supabase";
import { Recording } from "@/types/recording";

export async function fetchRecordings() {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching recordings:", error);
    return [];
  }

  return data as Recording[];
}

export async function fetchRecentRecordings(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .gte("date", date.toISOString())
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching recent recordings:", error);
    return [];
  }

  return data as Recording[];
}

export async function fetchProcessingRecordings() {
  const { data, error } = await supabase
    .from("recordings")
    .select("*")
    .eq("status", "processing")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching processing recordings:", error);
    return [];
  }

  return data as Recording[];
}

export async function createRecording(recording: Omit<Recording, "id">) {
  const { data, error } = await supabase
    .from("recordings")
    .insert([recording])
    .select()
    .single();

  if (error) {
    console.error("Error creating recording:", error);
    throw error;
  }

  return data as Recording;
}

export async function updateRecording(id: string, updates: Partial<Recording>) {
  const { data, error } = await supabase
    .from("recordings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating recording:", error);
    throw error;
  }

  return data as Recording;
}

export async function deleteRecording(id: string) {
  // First get the recording to check if it has a storage path
  const { data: recording } = await supabase
    .from("recordings")
    .select("storage_path")
    .eq("id", id)
    .single();

  // If there's a storage path, delete the file from storage
  if (recording?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("recordings")
      .remove([recording.storage_path]);

    if (storageError) {
      console.error("Error deleting recording file:", storageError);
    }
  }

  // Delete the recording record
  const { error } = await supabase.from("recordings").delete().eq("id", id);

  if (error) {
    console.error("Error deleting recording:", error);
    throw error;
  }

  return true;
}

export async function uploadRecordingFile(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from("recordings")
    .upload(path, file);

  if (error) {
    console.error("Error uploading recording file:", error);
    throw error;
  }

  return data.path;
}

export async function getRecordingFileUrl(path: string) {
  const { data } = await supabase.storage.from("recordings").getPublicUrl(path);
  return data.publicUrl;
}
