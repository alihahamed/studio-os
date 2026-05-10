// ============================================================
// Studio OS — Core Type Definitions
// ============================================================

/** User roles in the system */
export type UserRole = "admin" | "client";

/** Project lifecycle statuses */
export type ProjectStatus =
  | "draft"
  | "proposal_sent"
  | "signed"
  | "awaiting_deposit"
  | "active"
  | "completed"
  | "maintenance";

/** Payment types */
export type PaymentType = "deposit" | "final";

/** Payment statuses */
export type PaymentStatus = "pending" | "succeeded" | "failed";

// ============================================================
// Database row types
// ============================================================

export interface Profile {
  id: string;
  clerk_user_id: string;
  clerk_org_id: string | null;
  role: UserRole;
  agency_id: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Agency {
  id: string;
  clerk_org_id: string;
  name: string;
  owner_id: string | null;
  brand_config: Record<string, unknown>;
  created_at: string;
}

export interface Project {
  id: string;
  agency_id: string;
  client_profile_id: string | null;
  title: string;
  status: ProjectStatus;
  current_phase: number;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  project_id: string;
  markdown_content: string | null;
  base_price: number; // cents
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalAddon {
  id: string;
  proposal_id: string;
  label: string;
  description: string | null;
  price: number; // cents
  is_selected: boolean;
  sort_order: number;
}

export interface Contract {
  id: string;
  project_id: string;
  proposal_snapshot: Record<string, unknown>;
  selected_addons: Record<string, unknown>[];
  total_price: number; // cents
  signature_data: string;
  signer_ip: string | null;
  signed_at: string;
  pdf_storage_path: string | null;
}

export interface Payment {
  id: string;
  project_id: string;
  dodo_checkout_session_id: string | null;
  dodo_payment_id: string | null;
  dodo_product_id: string | null;
  amount: number; // cents
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  idempotency_key: string;
  created_at: string;
}

export interface DodoEvent {
  webhook_id: string;
  event_type: string;
  payload_type: string | null;
  processed_at: string;
}

export interface Asset {
  id: string;
  project_id: string;
  uploaded_by: string | null;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}
