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
      gestion: {
        Row: {
          buildingaddress: string
          buildingtype: string
          created_at: string
          estadopago: string
          fechapago: string
          id: string
          legalrepresentative: string
          mesrenting: number
          updated_at: string
        }
        Insert: {
          buildingaddress?: string
          buildingtype: string
          created_at?: string
          estadopago?: string
          fechapago: string
          id?: string
          legalrepresentative: string
          mesrenting?: number
          updated_at?: string
        }
        Update: {
          buildingaddress?: string
          buildingtype?: string
          created_at?: string
          estadopago?: string
          fechapago?: string
          id?: string
          legalrepresentative?: string
          mesrenting?: number
          updated_at?: string
        }
        Relationships: []
      }
      presupuestos: {
        Row: {
          additional_at: Json | null
          adminemail: string
          adminname: string
          buildingaddress: string | null
          buildingtype: string
          communityemail: string | null
          communityformationdate: string | null
          communityname: string
          communityrut: string | null
          comuna: string | null
          created_at: string
          equipos_instalados: string | null
          fecha_aprobacion_presupuesto: string | null
          fecha_firma_contrato: string | null
          fecha_instalacion_equipos: string | null
          id: string
          inversion: number | null
          legalrepresentative: string | null
          legalrepresentativephone: string | null
          legalrepresentativerut: string | null
          managementcompany: string | null
          monto: number | null
          por_unidad: number | null
          presupuesto_aceptado: boolean
          region: string | null
          terminos_contrato: string | null
          units: number
        }
        Insert: {
          additional_at?: Json | null
          adminemail: string
          adminname: string
          buildingaddress?: string | null
          buildingtype?: string
          communityemail?: string | null
          communityformationdate?: string | null
          communityname: string
          communityrut?: string | null
          comuna?: string | null
          created_at?: string
          equipos_instalados?: string | null
          fecha_aprobacion_presupuesto?: string | null
          fecha_firma_contrato?: string | null
          fecha_instalacion_equipos?: string | null
          id?: string
          inversion?: number | null
          legalrepresentative?: string | null
          legalrepresentativephone?: string | null
          legalrepresentativerut?: string | null
          managementcompany?: string | null
          monto?: number | null
          por_unidad?: number | null
          presupuesto_aceptado?: boolean
          region?: string | null
          terminos_contrato?: string | null
          units: number
        }
        Update: {
          additional_at?: Json | null
          adminemail?: string
          adminname?: string
          buildingaddress?: string | null
          buildingtype?: string
          communityemail?: string | null
          communityformationdate?: string | null
          communityname?: string
          communityrut?: string | null
          comuna?: string | null
          created_at?: string
          equipos_instalados?: string | null
          fecha_aprobacion_presupuesto?: string | null
          fecha_firma_contrato?: string | null
          fecha_instalacion_equipos?: string | null
          id?: string
          inversion?: number | null
          legalrepresentative?: string | null
          legalrepresentativephone?: string | null
          legalrepresentativerut?: string | null
          managementcompany?: string | null
          monto?: number | null
          por_unidad?: number | null
          presupuesto_aceptado?: boolean
          region?: string | null
          terminos_contrato?: string | null
          units?: number
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
