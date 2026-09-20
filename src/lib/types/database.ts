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
            project_execution_items: {
                Row: ExecutionRow
                Insert: Pick<ExecutionRow, 'user_id' | 'project_id' | 'description'> & Partial<Omit<ExecutionRow, 'user_id' | 'project_id' | 'description'>>
                Update: Partial<ExecutionRow>
                Relationships: [
                    { foreignKeyName: "project_execution_items_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_execution_items_scope_item_id_fkey"; columns: ["scope_item_id"]; isOneToOne: false; referencedRelation: "project_scope_items"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_execution_items_provider_id_fkey"; columns: ["provider_id"]; isOneToOne: false; referencedRelation: "providers"; referencedColumns: ["id"] },
                ]
            }
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
                    position: number
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
                    position: number
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
                    position?: number
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
                    descuento: number
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
                    descuento?: number
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
                    descuento?: number
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
            projects: {
                Row: {
                    archived_at: string | null
                    client_id: string
                    created_at: string
                    expected_end_date: string | null
                    id: string
                    name: string
                    notes: string | null
                    start_date: string | null
                    status: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    archived_at?: string | null
                    client_id: string
                    created_at?: string
                    expected_end_date?: string | null
                    id?: string
                    name: string
                    notes?: string | null
                    start_date?: string | null
                    status?: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    archived_at?: string | null
                    client_id?: string
                    created_at?: string
                    expected_end_date?: string | null
                    id?: string
                    name?: string
                    notes?: string | null
                    start_date?: string | null
                    status?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                ]
            }
            providers: {
                Row: {
                    active: boolean
                    address: string | null
                    cedula_ruc: string | null
                    created_at: string
                    email: string | null
                    id: string
                    name: string
                    notes: string | null
                    phone: string | null
                    specialty: string | null
                    type: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    active?: boolean
                    address?: string | null
                    cedula_ruc?: string | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    name: string
                    notes?: string | null
                    phone?: string | null
                    specialty?: string | null
                    type: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    active?: boolean
                    address?: string | null
                    cedula_ruc?: string | null
                    created_at?: string
                    email?: string | null
                    id?: string
                    name?: string
                    notes?: string | null
                    phone?: string | null
                    specialty?: string | null
                    type?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
            project_proformas: {
                Row: {
                    created_at: string
                    discount_amount_snapshot: number
                    discount_percentage_snapshot: number
                    id: string
                    iva_amount_snapshot: number
                    iva_percentage_snapshot: number
                    net_subtotal_snapshot: number
                    proforma_id: string
                    project_id: string
                    relation_type: string
                    subtotal_snapshot: number
                    total_snapshot: number
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    discount_amount_snapshot?: number
                    discount_percentage_snapshot?: number
                    id?: string
                    iva_amount_snapshot?: number
                    iva_percentage_snapshot?: number
                    net_subtotal_snapshot: number
                    proforma_id: string
                    project_id: string
                    relation_type?: string
                    subtotal_snapshot: number
                    total_snapshot: number
                    user_id: string
                }
                Update: {
                    created_at?: string
                    discount_amount_snapshot?: number
                    discount_percentage_snapshot?: number
                    id?: string
                    iva_amount_snapshot?: number
                    iva_percentage_snapshot?: number
                    net_subtotal_snapshot?: number
                    proforma_id?: string
                    project_id?: string
                    relation_type?: string
                    subtotal_snapshot?: number
                    total_snapshot?: number
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_proformas_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_proformas_proforma_id_fkey"
                        columns: ["proforma_id"]
                        isOneToOne: false
                        referencedRelation: "proformas"
                        referencedColumns: ["id"]
                    },
                ]
            }
            project_scope_items: {
                Row: {
                    archived_at: string | null
                    comment: string | null
                    created_at: string
                    description: string
                    id: string
                    position: number
                    project_id: string
                    project_proforma_id: string
                    quantity: number
                    quoted_gain_percentage: number
                    quoted_line_total: number
                    quoted_unit_cost: number
                    source_item_id: string
                    status: string
                    unit: string
                    user_id: string
                }
                Insert: {
                    archived_at?: string | null
                    comment?: string | null
                    created_at?: string
                    description: string
                    id?: string
                    position: number
                    project_id: string
                    project_proforma_id: string
                    quantity: number
                    quoted_gain_percentage?: number
                    quoted_line_total: number
                    quoted_unit_cost: number
                    source_item_id: string
                    status?: string
                    unit: string
                    user_id: string
                }
                Update: {
                    archived_at?: string | null
                    comment?: string | null
                    created_at?: string
                    description?: string
                    id?: string
                    position?: number
                    project_id?: string
                    project_proforma_id?: string
                    quantity?: number
                    quoted_gain_percentage?: number
                    quoted_line_total?: number
                    quoted_unit_cost?: number
                    source_item_id?: string
                    status?: string
                    unit?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_scope_items_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_scope_items_project_proforma_id_fkey"
                        columns: ["project_proforma_id"]
                        isOneToOne: false
                        referencedRelation: "project_proformas"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_scope_items_source_item_id_fkey"
                        columns: ["source_item_id"]
                        isOneToOne: false
                        referencedRelation: "items"
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
            import_proforma_items_to_project: {
                Args: {
                    p_item_ids: string[]
                    p_proforma_id: string
                    p_project_id: string
                    p_relation_type?: string
                }
                Returns: Json
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

export type ExecutionRow = {
    id: string
    user_id: string
    project_id: string
    scope_item_id: string | null
    provider_id: string | null
    description: string
    category: string | null
    estimated_cost: number | null
    committed_cost: number | null
    status: string
    notes: string | null
    created_at: string
    updated_at: string
    archived_at: string | null
}

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
