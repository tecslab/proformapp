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
            clients: {
                Row: {
                    address: string | null
                    cedula_ruc: string
                    created_at: string
                    deleted_at: string | null
                    email: string | null
                    first_name: string
                    id: string
                    last_name: string
                    phone: string | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    address?: string | null
                    cedula_ruc: string
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    first_name: string
                    id?: string
                    last_name: string
                    phone?: string | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    address?: string | null
                    cedula_ruc?: string
                    created_at?: string
                    deleted_at?: string | null
                    email?: string | null
                    first_name?: string
                    id?: string
                    last_name?: string
                    phone?: string | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            items: {
                Row: {
                    comment: string | null
                    created_at: string
                    description: string
                    id: string
                    line_total: number
                    percentage_gain: number
                    proforma_id: string
                    quantity: number
                    unit: string
                    unit_cost: number
                }
                Insert: {
                    comment?: string | null
                    created_at?: string
                    description: string
                    id?: string
                    line_total: number
                    percentage_gain?: number
                    proforma_id: string
                    quantity: number
                    unit: string
                    unit_cost: number
                }
                Update: {
                    comment?: string | null
                    created_at?: string
                    description?: string
                    id?: string
                    line_total?: number
                    percentage_gain?: number
                    proforma_id?: string
                    quantity?: number
                    unit?: string
                    unit_cost?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "items_proforma_id_fkey"
                        columns: ["proforma_id"]
                        isOneToOne: false
                        referencedRelation: "proformas"
                        referencedColumns: ["id"]
                    },
                ]
            }
            proforma_sequence: {
                Row: {
                    last_number: number
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    last_number?: number
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    last_number?: number
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            proformas: {
                Row: {
                    client_id: string
                    created_at: string
                    date: string
                    delivery_days: number | null
                    id: string
                    iva_amount: number
                    iva_percentage: number
                    observations: string | null
                    payment_methods: string | null
                    proforma_number: number
                    status: string
                    subtotal: number
                    total: number
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    client_id: string
                    created_at?: string
                    date?: string
                    delivery_days?: number | null
                    id?: string
                    iva_amount?: number
                    iva_percentage?: number
                    observations?: string | null
                    payment_methods?: string | null
                    proforma_number: number
                    status?: string
                    subtotal?: number
                    total?: number
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    client_id?: string
                    created_at?: string
                    date?: string
                    delivery_days?: number | null
                    id?: string
                    iva_amount?: number
                    iva_percentage?: number
                    observations?: string | null
                    payment_methods?: string | null
                    proforma_number?: number
                    status?: string
                    subtotal?: number
                    total?: number
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "proformas_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_next_proforma_number: {
                Args: {
                    p_user_id: string
                }
                Returns: number
            }
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
    T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Row"]

export type TablesInsert<
    T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Insert"]

export type TablesUpdate<
    T extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][T]["Update"]

export type Enums<
    T extends keyof PublicSchema["Enums"]
> = PublicSchema["Enums"][T]
