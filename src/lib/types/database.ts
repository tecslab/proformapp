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
            project_incidents: {
                Row: IncidentRow
                Insert: Pick<IncidentRow, 'user_id' | 'project_id' | 'title' | 'incident_date'> & Partial<IncidentRow>
                Update: Partial<IncidentRow>
                Relationships: [
                    { foreignKeyName: "project_incidents_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
                ]
            }
            project_transactions: {
                Row: TransactionRow
                Insert: Pick<TransactionRow, 'user_id' | 'project_id' | 'direction' | 'type' | 'amount' | 'transaction_date' | 'description'> & Partial<TransactionRow>
                Update: Partial<TransactionRow>
                Relationships: [
                    { foreignKeyName: "project_transactions_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_transactions_project_proforma_id_fkey"; columns: ["project_proforma_id"]; isOneToOne: false; referencedRelation: "project_proformas"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_transactions_scope_item_id_fkey"; columns: ["scope_item_id"]; isOneToOne: false; referencedRelation: "project_scope_items"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_transactions_execution_item_id_fkey"; columns: ["execution_item_id"]; isOneToOne: false; referencedRelation: "project_execution_items"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_transactions_provider_id_fkey"; columns: ["provider_id"]; isOneToOne: false; referencedRelation: "providers"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_transactions_receivable_id_fkey"; columns: ["receivable_id"]; isOneToOne: false; referencedRelation: "project_receivables"; referencedColumns: ["id"] },
                ]
            }
            project_receivables: {
                Row: ReceivableRow
                Insert: Pick<ReceivableRow, 'user_id' | 'project_id' | 'description' | 'expected_amount'> & Partial<ReceivableRow>
                Update: Partial<ReceivableRow>
                Relationships: [
                    { foreignKeyName: "project_receivables_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] },
                    { foreignKeyName: "project_receivables_project_proforma_id_fkey"; columns: ["project_proforma_id"]; isOneToOne: false; referencedRelation: "project_proformas"; referencedColumns: ["id"] },
                ]
            }
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
            project_financial_summary: {
                Row: ProjectFinancialSummary
                Relationships: []
            }
            project_receivable_balances: {
                Row: ReceivableRow & { collected: number; balance: number; effective_status: string }
                Relationships: []
            }
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

export type IncidentRow = {
    id: string; user_id: string; project_id: string; title: string; description: string | null
    incident_date: string; responsibility: string; estimated_cost: number | null; final_cost: number | null
    billable_to_client: boolean | null; resolved: boolean; resolution_notes: string | null
    created_at: string; updated_at: string
}

export type ProjectFinancialSummary = {
    project_id: string; user_id: string; name: string; status: string; archived_at: string | null
    net_sales: number; client_total_due: number; quoted_cost: number; committed_cost: number
    supplier_balance: number; paid_over_commitment: number; collected: number; paid_cost: number
    paid_uncommitted_costs: number; project_cash: number; overdue_receivables: number
    client_balance: number; quoted_margin: number; expected_margin: number; actual_margin: number | null
    advance_pending: boolean; cash_shortfall: boolean; closing_balance_pending: boolean
}

export type ReceivableRow = {
    id: string; user_id: string; project_id: string; project_proforma_id: string | null
    description: string; expected_amount: number; due_date: string | null; status: string
    created_at: string; updated_at: string
}
export type TransactionRow = {
    id: string; user_id: string; project_id: string; project_proforma_id: string | null
    scope_item_id: string | null; execution_item_id: string | null; provider_id: string | null
    receivable_id: string | null; direction: string; type: string; amount: number
    transaction_date: string; description: string; payment_method: string | null; notes: string | null
    voided_at: string | null; void_reason: string | null; created_at: string
}

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
