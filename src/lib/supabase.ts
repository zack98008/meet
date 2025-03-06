import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://jwrzgpsrfbuoltfdxzhv.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cnpncHNyZmJ1b2x0ZmR4emh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDQwMjQsImV4cCI6MjA1NjgyMDAyNH0.t6Ap0PzVuDnWHRWaF1ss5IDk6ikND-n6O_du_g7K9fs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
