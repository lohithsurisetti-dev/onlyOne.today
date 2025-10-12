export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string
          content: string
          input_type: 'action' | 'day'
          scope: 'city' | 'state' | 'country' | 'world'
          location_city: string | null
          location_state: string | null
          location_country: string | null
          location_coords: unknown | null
          content_hash: string
          content_embedding: unknown | null
          uniqueness_score: number
          match_count: number
          created_at: string
          updated_at: string
          is_anonymous: boolean
          user_id: string | null
        }
        Insert: {
          id?: string
          content: string
          input_type: 'action' | 'day'
          scope: 'city' | 'state' | 'country' | 'world'
          location_city?: string | null
          location_state?: string | null
          location_country?: string | null
          location_coords?: unknown | null
          content_hash: string
          content_embedding?: unknown | null
          uniqueness_score?: number
          match_count?: number
          created_at?: string
          updated_at?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Update: {
          id?: string
          content?: string
          input_type?: 'action' | 'day'
          scope?: 'city' | 'state' | 'country' | 'world'
          location_city?: string | null
          location_state?: string | null
          location_country?: string | null
          location_coords?: unknown | null
          content_hash?: string
          content_embedding?: unknown | null
          uniqueness_score?: number
          match_count?: number
          created_at?: string
          updated_at?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
      }
      post_matches: {
        Row: {
          id: string
          post_id: string
          matched_post_id: string
          similarity_score: number
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          matched_post_id: string
          similarity_score: number
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          matched_post_id?: string
          similarity_score?: number
          created_at?: string
        }
      }
      trending_context: {
        Row: {
          id: string
          source: string
          category: string
          title: string
          description: string | null
          rank: number | null
          metadata: Json | null
          fetched_at: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          source: string
          category: string
          title: string
          description?: string | null
          rank?: number | null
          metadata?: Json | null
          fetched_at?: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          source?: string
          category?: string
          title?: string
          description?: string | null
          rank?: number | null
          metadata?: Json | null
          fetched_at?: string
          expires_at?: string
          created_at?: string
        }
      }
      daily_analytics: {
        Row: {
          id: string
          date: string
          total_posts: number
          unique_posts: number
          common_posts: number
          posts_by_city: number
          posts_by_state: number
          posts_by_country: number
          posts_by_world: number
          action_posts: number
          day_posts: number
          top_content_hashes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          total_posts?: number
          unique_posts?: number
          common_posts?: number
          posts_by_city?: number
          posts_by_state?: number
          posts_by_country?: number
          posts_by_world?: number
          action_posts?: number
          day_posts?: number
          top_content_hashes?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          total_posts?: number
          unique_posts?: number
          common_posts?: number
          posts_by_city?: number
          posts_by_state?: number
          posts_by_country?: number
          posts_by_world?: number
          action_posts?: number
          day_posts?: number
          top_content_hashes?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      recent_unique_posts: {
        Row: {
          id: string
          content: string
          input_type: 'action' | 'day'
          scope: 'city' | 'state' | 'country' | 'world'
          location_city: string | null
          location_state: string | null
          location_country: string | null
          uniqueness_score: number
          match_count: number
          created_at: string
          post_type: 'unique' | 'common'
        }
      }
      daily_post_stats: {
        Row: {
          post_date: string
          total_posts: number
          unique_posts: number
          common_posts: number
          avg_uniqueness_score: number
        }
      }
    }
    Functions: {
      generate_content_hash: {
        Args: { content: string }
        Returns: string
      }
      find_similar_posts: {
        Args: {
          p_content_hash: string
          p_scope: string
          p_location_city?: string
          p_location_state?: string
          p_location_country?: string
          p_limit?: number
        }
        Returns: Array<{
          post_id: string
          content: string
          similarity_score: number
          created_at: string
        }>
      }
      calculate_uniqueness_score: {
        Args: { match_count: number }
        Returns: number
      }
    }
  }
}

