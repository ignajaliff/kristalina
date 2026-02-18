export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contratos: {
        Row: {
          created_at: string
          datos_contrato: Json | null
          doc_contrato: string | null
          estado_contrato: string
          estado_equipos: string
          fecha_contrato_firmado: string | null
          fecha_instalacion_equipos: string | null
          id: string
          prospecto_id: string
        }
        Insert: {
          created_at?: string
          datos_contrato?: Json | null
          doc_contrato?: string | null
          estado_contrato?: string
          estado_equipos?: string
          fecha_contrato_firmado?: string | null
          fecha_instalacion_equipos?: string | null
          id?: string
          prospecto_id: string
        }
        Update: {
          created_at?: string
          datos_contrato?: Json | null
          doc_contrato?: string | null
          estado_contrato?: string
          estado_equipos?: string
          fecha_contrato_firmado?: string | null
          fecha_instalacion_equipos?: string | null
          id?: string
          prospecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      gestion: {
        Row: {
          cliente: Json | null
          created_at: string
          data_contrato: Json | null
          data_presupuesto: Json | null
          dia_pago: number
          estadopago: string
          fecha_primera_factura: string | null
          fechapago: string
          id: string
          mesrenting: number
          monto_renting: number | null
          pagos_json: Json | null
          updated_at: string
          vendedor_id: string | null
        }
        Insert: {
          cliente?: Json | null
          created_at?: string
          data_contrato?: Json | null
          data_presupuesto?: Json | null
          dia_pago?: number
          estadopago?: string
          fecha_primera_factura?: string | null
          fechapago: string
          id?: string
          mesrenting?: number
          monto_renting?: number | null
          pagos_json?: Json | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Update: {
          cliente?: Json | null
          created_at?: string
          data_contrato?: Json | null
          data_presupuesto?: Json | null
          dia_pago?: number
          estadopago?: string
          fecha_primera_factura?: string | null
          fechapago?: string
          id?: string
          mesrenting?: number
          monto_renting?: number | null
          pagos_json?: Json | null
          updated_at?: string
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gestion_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          created_at: string
          datos_presupuesto: Json | null
          estado: string
          fecha_aprobacion: string | null
          id: string
          prospecto_id: string
        }
        Insert: {
          created_at?: string
          datos_presupuesto?: Json | null
          estado?: string
          fecha_aprobacion?: string | null
          id?: string
          prospecto_id: string
        }
        Update: {
          created_at?: string
          datos_presupuesto?: Json | null
          estado?: string
          fecha_aprobacion?: string | null
          id?: string
          prospecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      prospectos: {
        Row: {
          additional_at: Json | null
          adminemail: string
          adminname: string
          buildingaddress: string | null
          buildingtype: string
          communityname: string
          comuna: string | null
          created_at: string
          estado_contacto: string | null
          id: string
          managementcompany: string | null
          nombre_portero: string | null
          notas: string | null
          region: string | null
          units: number
          vendedor: string | null
          vendedor_id: string | null
        }
        Insert: {
          additional_at?: Json | null
          adminemail: string
          adminname: string
          buildingaddress?: string | null
          buildingtype?: string
          communityname: string
          comuna?: string | null
          created_at?: string
          estado_contacto?: string | null
          id?: string
          managementcompany?: string | null
          nombre_portero?: string | null
          notas?: string | null
          region?: string | null
          units: number
          vendedor?: string | null
          vendedor_id?: string | null
        }
        Update: {
          additional_at?: Json | null
          adminemail?: string
          adminname?: string
          buildingaddress?: string | null
          buildingtype?: string
          communityname?: string
          comuna?: string | null
          created_at?: string
          estado_contacto?: string | null
          id?: string
          managementcompany?: string | null
          nombre_portero?: string | null
          notas?: string | null
          region?: string | null
          units?: number
          vendedor?: string | null
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          email: string
          id: string
          nombre: string
          role: Database["public"]["Enums"]["app_role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nombre: string
          role?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          role?: Database["public"]["Enums"]["app_role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrador" | "vendedor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["administrador", "vendedor"],
    },
  },
} as const
