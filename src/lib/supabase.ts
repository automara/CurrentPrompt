import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase credentials. Check your .env file."
  );
}

// Create Supabase client with service role (for admin operations)
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Types for our database
export interface Module {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  summary?: string;
  meta_description?: string;
  source_url?: string;
  source_label?: string;
  owner: string;
  latest_version: number;
  status: "draft" | "published" | "archived";
  webflow_id?: string;
  search_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ModuleVersion {
  id: string;
  module_id: string;
  version: number;
  changelog?: string;
  file_paths: {
    full_md?: string;
    summary_md?: string;
    bundle_zip?: string;
    thumbnail?: string;
  };
  created_at: string;
}

export interface ModuleEmbedding {
  id: string;
  module_id: string;
  embedding: number[];
  created_at: string;
}
