export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      forecast_values: {
        Row: {
          ano: number
          id: string
          id_tipo: number
          mes: string
          produto_codigo: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
          valor: number
        }
        Insert: {
          ano: number
          id?: string
          id_tipo: number
          mes: string
          produto_codigo?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          valor: number
        }
        Update: {
          ano?: number
          id?: string
          id_tipo?: number
          mes?: string
          produto_codigo?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_values_grupo_fk"
            columns: ["ano", "id_tipo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["ano", "id_tipo"]
          },
          {
            foreignKeyName: "forecast_values_produto_codigo_fkey"
            columns: ["produto_codigo"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["codigo"]
          },
        ]
      }
      grupos: {
        Row: {
          ano: number
          code: string | null
          created_at: string | null
          id_tipo: number
          tipo: string
        }
        Insert: {
          ano: number
          code?: string | null
          created_at?: string | null
          id_tipo: number
          tipo: string
        }
        Update: {
          ano?: number
          code?: string | null
          created_at?: string | null
          id_tipo?: number
          tipo?: string
        }
        Relationships: []
      }
      month_configurations: {
        Row: {
          ano: number
          created_at: string | null
          data: string
          mes: string
          pct_atual: number
          pct_geral: number
          realizado: boolean
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          data: string
          mes: string
          pct_atual: number
          pct_geral: number
          realizado?: boolean
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          data?: string
          mes?: string
          pct_atual?: number
          pct_geral?: number
          realizado?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      produtos: {
        Row: {
          codigo: string
          created_at: string | null
          data_atualizacao_fob: string | null
          empresa: string
          estoque: number | null
          fabrica: string
          familia1: string
          familia2: string
          fob: number | null
          indice: number | null
          marca: string
          moedafob: string | null
          preco_venda: number | null
          produto: string
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          data_atualizacao_fob?: string | null
          empresa: string
          estoque?: number | null
          fabrica: string
          familia1: string
          familia2: string
          fob?: number | null
          indice?: number | null
          marca: string
          moedafob?: string | null
          preco_venda?: number | null
          produto: string
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          data_atualizacao_fob?: string | null
          empresa?: string
          estoque?: number | null
          fabrica?: string
          familia1?: string
          familia2?: string
          fob?: number | null
          indice?: number | null
          marca?: string
          moedafob?: string | null
          preco_venda?: number | null
          produto?: string
          updated_at?: string | null
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
