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
      profiles: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string | null
          avatar_url: string | null
          email: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name?: string | null
          avatar_url?: string | null
          email: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          currency: string
          timezone: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          currency?: string
          timezone?: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          currency?: string
          timezone?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          organization_id: string
          category_id: string | null
          name: string
          description: string | null
          barcode: string | null
          sku: string | null
          image_url: string | null
          cost_price: number
          selling_price: number
          stock_quantity: number
          low_stock_threshold: number
          expiry_date: string | null
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          category_id?: string | null
          name: string
          description?: string | null
          barcode?: string | null
          sku?: string | null
          image_url?: string | null
          cost_price?: number
          selling_price?: number
          stock_quantity?: number
          low_stock_threshold?: number
          expiry_date?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          barcode?: string | null
          sku?: string | null
          image_url?: string | null
          cost_price?: number
          selling_price?: number
          stock_quantity?: number
          low_stock_threshold?: number
          expiry_date?: string | null
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          organization_id: string
          session_id: string | null
          cashier_id: string
          customer_id: string | null
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
          sale_status: 'draft' | 'completed' | 'cancelled' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          session_id?: string | null
          cashier_id: string
          customer_id?: string | null
          subtotal: number
          tax_amount: number
          discount_amount?: number
          total_amount: number
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          sale_status?: 'draft' | 'completed' | 'cancelled' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          session_id?: string | null
          cashier_id?: string
          customer_id?: string | null
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded'
          sale_status?: 'draft' | 'completed' | 'cancelled' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
    }
    Enums: {
      user_role: 'owner' | 'admin' | 'manager' | 'cashier'
      transaction_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'expiry'
      payment_method: 'cash' | 'mobile_money' | 'card' | 'split'
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
      sale_status: 'draft' | 'completed' | 'cancelled' | 'refunded'
      alert_type: 'low_stock' | 'expiry' | 'failed_transaction'
    }
  }
}
