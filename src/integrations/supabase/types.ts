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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          order_position: number | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          order_position?: number | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          order_position?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "banners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon_symbol: string | null
          id: string
          name: string
          show_in_explore: boolean | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_symbol?: string | null
          id?: string
          name: string
          show_in_explore?: boolean | null
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_symbol?: string | null
          id?: string
          name?: string
          show_in_explore?: boolean | null
          slug?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade_estado: string | null
          cnpj_cpf: string | null
          codigo: number
          contato: string | null
          created_at: string
          empresa_nome: string
          endereco: string | null
          fax: string | null
          id: string
          insc_estadual_identidade: string | null
          is_active: boolean | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade_estado?: string | null
          cnpj_cpf?: string | null
          codigo?: number
          contato?: string | null
          created_at?: string
          empresa_nome: string
          endereco?: string | null
          fax?: string | null
          id?: string
          insc_estadual_identidade?: string | null
          is_active?: boolean | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade_estado?: string | null
          cnpj_cpf?: string | null
          codigo?: number
          contato?: string | null
          created_at?: string
          empresa_nome?: string
          endereco?: string | null
          fax?: string | null
          id?: string
          insc_estadual_identidade?: string | null
          is_active?: boolean | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      internal_permissions: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          id: string
          permission_key: string
          role_id: string
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          id?: string
          permission_key: string
          role_id: string
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          id?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "internal_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_master: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_master?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      internal_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "internal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_users: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash: string
          role_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "internal_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_entries: {
        Row: {
          cost_price: number
          created_at: string | null
          created_by: string | null
          entry_date: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          sale_price: number
          supplier_id: string | null
        }
        Insert: {
          cost_price?: number
          created_at?: string | null
          created_by?: string | null
          entry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          sale_price?: number
          supplier_id?: string | null
        }
        Update: {
          cost_price?: number
          created_at?: string | null
          created_by?: string | null
          entry_date?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          sale_price?: number
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean | null
          name: string
          price_revenda: number
          price_varejo: number
          setor: string | null
          show_price_on_site: boolean | null
          sku: string | null
          stock: number | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          name: string
          price_revenda?: number
          price_varejo?: number
          setor?: string | null
          show_price_on_site?: boolean | null
          sku?: string | null
          stock?: number | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          name?: string
          price_revenda?: number
          price_varejo?: number
          setor?: string | null
          show_price_on_site?: boolean | null
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          phone: string | null
          setor: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          phone?: string | null
          setor?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          phone?: string | null
          setor?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ready_pc_components: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number | null
          ready_pc_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          ready_pc_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number | null
          ready_pc_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ready_pc_components_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ready_pc_components_ready_pc_id_fkey"
            columns: ["ready_pc_id"]
            isOneToOne: false
            referencedRelation: "ready_pcs"
            referencedColumns: ["id"]
          },
        ]
      }
      ready_pcs: {
        Row: {
          created_at: string | null
          description: string | null
          game_image_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_revenda: number
          price_varejo: number
          specs: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          game_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_revenda: number
          price_varejo: number
          specs?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          game_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_revenda?: number
          price_varejo?: number
          specs?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          custo_item: number | null
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          custo_item?: number | null
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          custo_item?: number | null
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          attendant_name: string
          client_id: string | null
          created_at: string | null
          discount: number | null
          id: string
          notes: string | null
          payment_method: string
          status: string | null
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          attendant_name: string
          client_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method: string
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          attendant_name?: string
          client_id?: string | null
          created_at?: string | null
          discount?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      store_credentials: {
        Row: {
          created_at: string | null
          facebook: string | null
          id: string
          instagram: string | null
          twitter: string | null
          updated_at: string | null
          website: string | null
          whatsapp_revenda: string | null
          whatsapp_varejo: string | null
        }
        Insert: {
          created_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp_revenda?: string | null
          whatsapp_varejo?: string | null
        }
        Update: {
          created_at?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          twitter?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp_revenda?: string | null
          whatsapp_varejo?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string | null
          enable_sales: boolean
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enable_sales?: boolean
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enable_sales?: boolean
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_create_user: {
        Args: {
          user_email: string
          user_password: string
          user_phone?: string
          user_setor?: string
        }
        Returns: Json
      }
      has_internal_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hash_password: { Args: { password: string }; Returns: string }
      verify_password: {
        Args: { password: string; password_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "atendente"
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
      app_role: ["admin", "atendente"],
    },
  },
} as const
