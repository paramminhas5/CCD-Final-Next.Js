export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
      Relationships: unknown[]
    }>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: Record<string, unknown>
    CompositeTypes: Record<string, unknown>
  }
}

export type Tables<T extends string> = Record<string, unknown>
export type TablesInsert<T extends string> = Record<string, unknown>
export type TablesUpdate<T extends string> = Record<string, unknown>
export type Enums<T extends string> = never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
