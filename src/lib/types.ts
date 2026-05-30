export interface CarModel {
  id: string;
  name: string;
  variant: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface IncentiveSlab {
  id: string;
  min_units: number;
  max_units: number | null;
  incentive_per_unit: number;
  updated_at: string;
}

export interface SalesEntry {
  id: string;
  officer_id: string;
  car_model_id: string;
  month: string;
  units_sold: number;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: "admin" | "officer";
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "officer";
}

export interface IncentiveResult {
  total_units: number;
  active_slab: IncentiveSlab;
  payout: number;
  units_to_next_tier: number;
  bonus_at_next_tier: number;
  breakdown: CarSale[];
}

export interface CarSale {
  car_model_id: string;
  car_name: string;
  image_url: string;
  units_sold: number;
}
