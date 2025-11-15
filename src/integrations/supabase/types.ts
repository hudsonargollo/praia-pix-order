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
      menu_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          menu_item_id: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          menu_item_id: string
          order_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          menu_item_id?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          commission_amount: number | null
          created_at: string
          customer_name: string
          customer_phone: string
          deleted_at: string | null
          id: string
          kitchen_notified_at: string | null
          mercadopago_payment_id: string | null
          notified_at: string | null
          order_number: number
          payment_confirmed_at: string | null
          payment_expires_at: string | null
          payment_status: string
          pix_copy_paste: string | null
          pix_expires_at: string | null
          pix_generated_at: string | null
          pix_qr_code: string | null
          qr_code_data: string | null
          ready_at: string | null
          status: string
          table_number: string
          total_amount: number
          waiter_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string
          customer_name: string
          customer_phone: string
          deleted_at?: string | null
          id?: string
          kitchen_notified_at?: string | null
          mercadopago_payment_id?: string | null
          notified_at?: string | null
          order_number?: never
          payment_confirmed_at?: string | null
          payment_expires_at?: string | null
          payment_status?: string
          pix_copy_paste?: string | null
          pix_expires_at?: string | null
          pix_generated_at?: string | null
          pix_qr_code?: string | null
          qr_code_data?: string | null
          ready_at?: string | null
          status?: string
          table_number: string
          total_amount: number
          waiter_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          deleted_at?: string | null
          id?: string
          kitchen_notified_at?: string | null
          mercadopago_payment_id?: string | null
          notified_at?: string | null
          order_number?: never
          payment_confirmed_at?: string | null
          payment_expires_at?: string | null
          payment_status?: string
          pix_copy_paste?: string | null
          pix_expires_at?: string | null
          pix_generated_at?: string | null
          pix_qr_code?: string | null
          qr_code_data?: string | null
          ready_at?: string | null
          status?: string
          table_number?: string
          total_amount?: number
          waiter_id?: string | null
        }
        Relationships: []
      }
      payment_webhooks: {
        Row: {
          action: string | null
          created_at: string
          error_message: string | null
          id: string
          mercadopago_payment_id: string
          order_id: string | null
          processed_at: string | null
          processing_status: string
          webhook_data: Json
          webhook_type: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mercadopago_payment_id: string
          order_id?: string | null
          processed_at?: string | null
          processing_status?: string
          webhook_data: Json
          webhook_type: string
        }
        Update: {
          action?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          mercadopago_payment_id?: string
          order_id?: string | null
          processed_at?: string | null
          processing_status?: string
          webhook_data?: Json
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_notifications: {
        Row: {
          attempts: number
          created_at: string
          customer_phone: string
          error_message: string | null
          id: string
          message_content: string | null
          message_type: string | null
          notification_type: string | null
          order_id: string | null
          phone: string
          scheduled_at: string
          sent_at: string | null
          status: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          customer_phone?: string
          error_message?: string | null
          id?: string
          message_content?: string | null
          message_type?: string | null
          notification_type?: string | null
          order_id?: string | null
          phone: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          customer_phone?: string
          error_message?: string | null
          id?: string
          message_content?: string | null
          message_type?: string | null
          notification_type?: string | null
          order_id?: string | null
          phone?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          phone_number: string | null
          session_data: Json
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          session_data: Json
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number?: string | null
          session_data?: Json
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          template_type: string
          updated_at: string
          variables: Json
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_type: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          template_type?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          display_name: string | null
          has_set_display_name: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          display_name?: string | null
          has_set_display_name?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string
          display_name?: string | null
          has_set_display_name?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_waiter_display_name: {
        Args: {
          p_display_name: string
        }
        Returns: Json
      }
      update_menu_items_sort_order: {
        Args: {
          item_updates: Json
        }
        Returns: void
      }
    }
    Enums: {
      app_role: "admin" | "kitchen" | "cashier"
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "kitchen", "cashier"],
    },
  },
} as const
