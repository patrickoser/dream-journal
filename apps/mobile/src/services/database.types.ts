/**
 * Supabase database types — regenerate this file by running:
 * npx supabase gen types typescript --project-id <your-project-id> > src/services/database.types.ts
 *
 * Manually maintained until the Supabase project is provisioned.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          subscription_tier: 'free' | 'premium';
          subscription_expires_at: string | null;
          generations_used_this_month: number;
          video_generations_used_this_month: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      dream_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          body_text: string;
          dream_date: string;  // ISO date string YYYY-MM-DD
          mood_tags: string[];
          has_video: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dream_entries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['dream_entries']['Insert']>;
      };
      dream_generations: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          type: 'image' | 'video' | 'interpretation' | 'manifestation';
          prompt_used: string | null;
          media_url: string | null;
          thumbnail_url: string | null;
          is_saved: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dream_generations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['dream_generations']['Insert']>;
      };
      generation_jobs: {
        Row: {
          id: string;
          entry_id: string;
          user_id: string;
          type: 'image' | 'video';
          status: 'pending' | 'processing' | 'complete' | 'failed';
          provider: 'falai' | 'kling';
          provider_job_id: string | null;
          result_url: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['generation_jobs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['generation_jobs']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
