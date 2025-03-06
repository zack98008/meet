export interface Recording {
  id: string;
  title: string;
  meeting_id?: string;
  user_id?: string;
  date: string;
  duration: string;
  size: string;
  status: "processing" | "completed" | "failed";
  storage_path?: string;
  created_at?: string;
  updated_at?: string;
}
