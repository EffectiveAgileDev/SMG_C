export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'linkedin'
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type MediaType = 'image' | 'video' | 'link' | 'text'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          avatar_url?: string
          role: 'admin' | 'creator' | 'viewer'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          full_name: string
          avatar_url?: string
          role?: 'admin' | 'creator' | 'viewer'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
          avatar_url?: string
          role?: 'admin' | 'creator' | 'viewer'
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          content: string
          media_urls?: string[]
          platform: SocialPlatform
          status: PostStatus
          scheduled_for?: string
          published_at?: string
          media_type: MediaType
          engagement_metrics?: Json
          tags?: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          content: string
          media_urls?: string[]
          platform: SocialPlatform
          status?: PostStatus
          scheduled_for?: string
          published_at?: string
          media_type: MediaType
          engagement_metrics?: Json
          tags?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          content?: string
          media_urls?: string[]
          platform?: SocialPlatform
          status?: PostStatus
          scheduled_for?: string
          published_at?: string
          media_type?: MediaType
          engagement_metrics?: Json
          tags?: string[]
        }
      }
      platform_configs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          platform: SocialPlatform
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          is_active: boolean
          settings?: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          platform: SocialPlatform
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          is_active?: boolean
          settings?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          platform?: SocialPlatform
          api_key?: string
          api_secret?: string
          access_token?: string
          refresh_token?: string
          token_expires_at?: string
          is_active?: boolean
          settings?: Json
        }
      }
      analytics: {
        Row: {
          id: string
          created_at: string
          post_id: string
          platform: SocialPlatform
          likes: number
          shares: number
          comments: number
          impressions: number
          reach: number
          engagement_rate: number
          raw_data?: Json
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          platform: SocialPlatform
          likes: number
          shares: number
          comments: number
          impressions: number
          reach: number
          engagement_rate: number
          raw_data?: Json
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          platform?: SocialPlatform
          likes?: number
          shares?: number
          comments?: number
          impressions?: number
          reach?: number
          engagement_rate?: number
          raw_data?: Json
        }
      }
    }
    Views: {
      post_analytics: {
        Row: {
          post_id: string
          total_likes: number
          total_shares: number
          total_comments: number
          total_impressions: number
          average_engagement_rate: number
        }
      }
    }
    Functions: {
      get_user_analytics: {
        Args: {
          user_id: string
          start_date: string
          end_date: string
        }
        Returns: {
          total_posts: number
          total_engagement: number
          platform_breakdown: Json
        }
      }
    }
    Enums: {
      social_platform: SocialPlatform
      post_status: PostStatus
      media_type: MediaType
    }
  }
} 