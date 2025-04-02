import { Database } from '@supabase/supabase-js'

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
          created_at: string
          updated_at: string
          title: string
          content: string
          image_url?: string
          status: 'draft' | 'scheduled' | 'published'
          platform_id: string
          user_id: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          content: string
          image_url?: string
          status?: 'draft' | 'scheduled' | 'published'
          platform_id: string
          user_id: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          content?: string
          image_url?: string
          status?: 'draft' | 'scheduled' | 'published'
          platform_id?: string
          user_id?: string
          metadata?: Json
        }
      }
      schedules: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          post_id: string
          scheduled_time: string
          timezone: string
          status: 'pending' | 'completed' | 'failed'
          retry_count: number
          last_attempt?: string
          error_message?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          post_id: string
          scheduled_time: string
          timezone: string
          status?: 'pending' | 'completed' | 'failed'
          retry_count?: number
          last_attempt?: string
          error_message?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          post_id?: string
          scheduled_time?: string
          timezone?: string
          status?: 'pending' | 'completed' | 'failed'
          retry_count?: number
          last_attempt?: string
          error_message?: string
        }
      }
      platform_configs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          platform_name: string
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          user_id: string
          settings: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          platform_name: string
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          user_id: string
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          platform_name?: string
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          user_id?: string
          settings?: Json
        }
      }
      analytics: {
        Row: {
          id: string
          created_at: string
          post_id: string
          platform_id: string
          metric_type: string
          value: number
          recorded_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          platform_id: string
          metric_type: string
          value: number
          recorded_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          platform_id?: string
          metric_type?: string
          value?: number
          recorded_at?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 