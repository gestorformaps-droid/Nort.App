export interface Training {
  name: string;
  expiration_date: string;
}

export interface Occurrence {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  user_avatar_position?: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  type: 'Segurança' | 'Operacional' | 'Ambiental' | 'Outros';
  om_number?: string;
  status?: string;
}

export interface OccurrenceComment {
  id: number;
  occurrence_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  text: string;
  image_url?: string;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  registration: string;
  role: 'employee' | 'manager';
  function?: string;
  email?: string;
  phone?: string;
  trainings?: string;
  training_list?: Training[];
  is_active?: boolean;
  avatar_url?: string;
  avatar_position?: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface Activity {
  id: number;
  om_number: string;
  operation: string;
  model: 'Programada' | 'Emergencial';
  code: string;
  involved_employees: string; // JSON string
  location_id: number;
  location_name?: string;
  description: string;
  status: 'Em andamento' | 'Pausada' | 'Concluída' | 'Cancelada';
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_name?: string;
  total_active_time?: number;
  total_paused_time?: number;
}

export interface Message {
  id: number;
  activity_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  user_avatar_position?: string;
  text: string;
  timestamp: string;
}

export interface StatusHistory {
  id: number;
  activity_id: number;
  status: ActivityStatus;
  justification?: string;
  timestamp: string;
}

export type ActivityStatus = Activity['status'];

export const STATUS_COLORS: Record<ActivityStatus, string> = {
  'Em andamento': '#EAB308', // Yellow
  'Pausada': '#F97316',      // Orange
  'Concluída': '#3B82F6',    // Blue
  'Cancelada': '#EF4444',    // Red
};

export const OM_CODES = ['CIVIPED', 'CIVIHID', 'CIVIMEC', 'CIVICARP', 'CIVIPINT', 'CIVIELET'];
export const OM_MODELS = ['Programada', 'Emergencial'];
export const ACTIVITY_STATUSES: ActivityStatus[] = ['Em andamento', 'Pausada', 'Concluída', 'Cancelada'];
