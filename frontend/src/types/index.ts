export interface Incident {
  id: number;
  forklift_id: number;
  started_at: string;
  ended_at: string | null;
  description: string | null;
  downtime_minutes: number;
  downtime_display: string;
}

export interface Forklift {
  id: number;
  brand: string;
  number: string;
  load_capacity: number;
  is_active: boolean;
  modified_at: string;
  modified_by: string;
  has_incidents: boolean;
}

export interface ForkliftWithIncidents extends Forklift {
  incidents: Incident[];
}

export interface ForkliftCreatePayload {
  brand: string;
  number: string;
  load_capacity: number;
  is_active: boolean;
  modified_by: string;
}

export interface ForkliftUpdatePayload {
  brand?: string;
  number?: string;
  load_capacity?: number;
  is_active?: boolean;
  modified_by: string;
}

export interface IncidentCreatePayload {
  started_at: string;
  ended_at: string | null;
  description: string | null;
}

export interface IncidentUpdatePayload {
  started_at?: string;
  ended_at?: string | null;
  description?: string | null;
}
