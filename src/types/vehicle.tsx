// src/types/vehicle.ts
export type Vehicle = {
  vin: string;
  client_id: string;

  consignatario?: string;
  make?: string;
  model?: string;
  year?: number;

  // ISO 8601 (ej: "2025-01-15T00:00:00.000Z"), opcional
  buy_date?: string;

  tow_paid?: boolean;
  freight_paid?: boolean;
  arrived?: boolean;

  agent_info?: string;
  note?: string;
};

export type VehicleCreate = {
  vin: string;
  client_id: string;

  consignatario?: string;
  make?: string;
  model?: string;
  year?: number;
  buy_date?: string;
  tow_paid?: boolean;
  freight_paid?: boolean;
  arrived?: boolean;
  agent_info?: string;
  note?: string;
};

export type VehicleUpdate = {
  client_id?: string;

  consignatario?: string;
  make?: string;
  model?: string;
  year?: number;
  buy_date?: string;
  tow_paid?: boolean;
  freight_paid?: boolean;
  arrived?: boolean;
  agent_info?: string;
  note?: string;
};

export type VehicleSearchRow = {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  client_id: string;
  consignatario?: string;
  arrived?: boolean;
  freight_paid?: boolean;
  tow_paid?: boolean;
};

