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
      // Add your table definitions here
      // Example:
      // users: {
      //   Row: {
      //     id: string
      //     created_at: string
      //     email: string
      //   }
      //   Insert: {
      //     id?: string
      //     created_at?: string
      //     email: string
      //   }
      //   Update: {
      //     id?: string
      //     created_at?: string
      //     email?: string
      //   }
      // }
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