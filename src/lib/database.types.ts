export interface Database {
  public: {
    Tables: {
      platform_configurations: {
        Row: {
          id: number
          platform_name: string
          api_version: string
          content_limits: {
            text_length?: number
            media_limit?: number
            supported_formats?: string[]
            [key: string]: any
          } | null
          api_endpoints: {
            post?: string
            media?: string
            analytics?: string
            [key: string]: any
          } | null
          rate_limits: {
            posts_per_day?: number
            requests_per_minute?: number
            [key: string]: any
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          platform_name: string
          api_version: string
          content_limits?: {
            text_length?: number
            media_limit?: number
            supported_formats?: string[]
            [key: string]: any
          } | null
          api_endpoints?: {
            post?: string
            media?: string
            analytics?: string
            [key: string]: any
          } | null
          rate_limits?: {
            posts_per_day?: number
            requests_per_minute?: number
            [key: string]: any
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          platform_name?: string
          api_version?: string
          content_limits?: {
            text_length?: number
            media_limit?: number
            supported_formats?: string[]
            [key: string]: any
          } | null
          api_endpoints?: {
            post?: string
            media?: string
            analytics?: string
            [key: string]: any
          } | null
          rate_limits?: {
            posts_per_day?: number
            requests_per_minute?: number
            [key: string]: any
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      // ... other tables ...
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