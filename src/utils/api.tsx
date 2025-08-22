// src/utils/api.ts
const RAW_BASE = import.meta.env.VITE_API_URL ?? "";

// Tipos
import type { Me } from "../types/auth";
import type { Bank, BankCreate, BankUpdate } from "../types/bank";
import type { Client, ClientCreate, ClientUpdate } from "../types/client";
import type { User, UserCreate, UserUpdate } from "../types/user";
import type { Vehicle, VehicleCreate, VehicleUpdate, VehicleSearchRow } from "../types/vehicle";


export const BASE_URL = RAW_BASE.replace(/\/$/, "");
export const API_PREFIX = "/api/v1";



// ---- VEHICLES ----
const VEH_BASE = `${BASE_URL}${API_PREFIX}/vehicles`;
export const AUTH_BASE = `${BASE_URL}${API_PREFIX}/auth`;

// ---- CLIENTS ----
const CLIENT_BASE = `${BASE_URL}${API_PREFIX}/clients`;
// ---- USERS ----
const USERS_BASE = `${BASE_URL}${API_PREFIX}`;
// ---- Token helpers ----
const TOKEN_KEY = "auth_token";
export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

// Header con bearer + JSON
function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) throw new Error("401 Sin token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * jsonFetch con tolerancia a respuestas vacías (204 o 200 sin body).
 * - Si no hay contenido, retorna `undefined` (tipado como T).
 */
async function jsonFetch<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${raw ?? ""}`);
  }
  if (!raw || !raw.trim()) {
    // @ts-expect-error: permitimos undefined como T para endpoints sin cuerpo
    return undefined;
  }
  return JSON.parse(raw) as T;
}

// ---------- AUTH ----------
export type TokenResponse = { access_token: string; token_type: string; expires_in?: number };

export async function login(cedula: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", cedula); // backend OAuth2PasswordRequestForm -> field 'username'
  body.set("password", password);

  const res = await fetch(`${AUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${raw}`);

  const data = (raw ? JSON.parse(raw) : {}) as TokenResponse;
  if (data.access_token) setAuthToken(data.access_token);
  return data;
}

// /auth/me (sin doble /auth)
export async function getMe(): Promise<Me> {
  const token = getAuthToken();
  if (!token) throw new Error("401 Sin token");
  return jsonFetch<Me>(`${AUTH_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ---------- TRANSFER / PLANTILLAS ----------
export async function generateTransferText(params: {
  bank: string;
  detail: string;
  amount: number;
}): Promise<{ texto: string }> {
  // NO NECESITA TOKEN
  const qs = new URLSearchParams({
    bank_name: params.bank,
    deposit_detail: params.detail,
    amount: String(params.amount),
  });

  return jsonFetch<{ texto: string }>(`${BASE_URL}${API_PREFIX}/transfer?${qs}`);
}



// ---------- BANKS ----------
export async function listBanks(): Promise<Bank[]> {
  return jsonFetch<Bank[]>(`${BASE_URL}${API_PREFIX}/banks`);
}

export async function getBank(name: string): Promise<Bank> {
  return jsonFetch<Bank>(
    `${BASE_URL}${API_PREFIX}/banks/by_name/${encodeURIComponent(name)}`
  );
}

/** Crea un banco nuevo */
export async function createBank(payload: BankCreate): Promise<void> {
  await jsonFetch<void>(`${BASE_URL}${API_PREFIX}/banks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** Actualiza un banco existente por name */
export async function updateBank(
  name: string,
  changes: BankUpdate
): Promise<void> {
  await jsonFetch<void>(
    `${BASE_URL}${API_PREFIX}/banks/update/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(changes),
    }
  );
}

export async function deleteBank(name: string): Promise<void> {
  await jsonFetch<void>(`${BASE_URL}${API_PREFIX}/banks/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ---------- CLIENTS ----------



/** Lista clientes (filtros soportados por el backend). */
export async function listClients(params?: {
  client_id?: string;
  full_name?: string;
}): Promise<Client[]> {
  const qs = new URLSearchParams();
  if (params?.client_id) qs.set("client_id", params.client_id);
  if (params?.full_name) qs.set("full_name", params.full_name);

  return jsonFetch<Client[]>(
    `${CLIENT_BASE}${qs.toString() ? `?${qs}` : ""}`,
    { headers: authHeaders() }
  );
}

/** Obtiene un cliente por ID. */
export async function getClient(client_id: string): Promise<Client> {
  return jsonFetch<Client>(`${CLIENT_BASE}/${encodeURIComponent(client_id)}`, {
    headers: authHeaders(),
  });
}

/** Crea un cliente. */
export async function createClient(payload: ClientCreate): Promise<void> {
  await jsonFetch<void>(`${CLIENT_BASE}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** Actualiza un cliente (client_id es inmutable). */
export async function updateClient(client_id: string, changes: ClientUpdate): Promise<void> {
  await jsonFetch<void>(`${CLIENT_BASE}/${encodeURIComponent(client_id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(changes),
  });
}

/** Helper de estado: hace PUT enviando { disabled }. */
export async function toggleClientDisabled(client_id: string, disabled: boolean): Promise<void> {
  await updateClient(client_id, { disabled });
}

/** Elimina un cliente. */
export async function deleteClient(client_id: string): Promise<void> {
  await jsonFetch<void>(`${CLIENT_BASE}/${encodeURIComponent(client_id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}


// ---------- USERS (admin) ----------

/** Lista todos los usuarios (admin). */
export async function listUsers(): Promise<User[]> {
  return jsonFetch<User[]>(`${USERS_BASE}/users`, { headers: authHeaders() });
}

/** (Opcional) Obtiene un usuario por cédula. */
export async function getUser(cedula: string): Promise<User> {
  return jsonFetch<User>(`${USERS_BASE}/users/${encodeURIComponent(cedula)}`, {
    headers: authHeaders(),
  });
}

/** Crea un usuario (admin). */
export async function createUser(payload: UserCreate): Promise<void> {
  await jsonFetch<void>(`${USERS_BASE}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** Actualiza datos de un usuario (admin). */
export async function updateUser(cedula: string, changes: UserUpdate): Promise<void> {
  await jsonFetch<void>(`${USERS_BASE}/users/${encodeURIComponent(cedula)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(changes),
  });
}

/** Activa/Desactiva usuario (admin). `disabled=true` lo desactiva. */
export async function toggleUserDisabled(cedula: string, disabled: boolean): Promise<void> {
  await jsonFetch<void>(`${USERS_BASE}/users/${encodeURIComponent(cedula)}/disable?disabled=${disabled}`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

/** Elimina un usuario (admin). */
export async function deleteUser(cedula: string): Promise<void> {
  await jsonFetch<void>(`${USERS_BASE}/users/${encodeURIComponent(cedula)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ---- VEHICLES ----
  export async function getStoredVehicle(vin: string): Promise<Vehicle> {
  return jsonFetch<Vehicle>(`${VEH_BASE}/stored/${encodeURIComponent(vin)}`, {
    headers: authHeaders(),
  });
}


/** Crea un vehículo (admin). */
export async function createVehicle(payload: VehicleCreate): Promise<{ inserted_id: string }> {
  return jsonFetch<{ inserted_id: string }>(`${VEH_BASE}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/** Actualiza un vehículo por VIN (admin). */
export async function updateVehicle(vin: string, changes: VehicleUpdate): Promise<void> {
  await jsonFetch<void>(`${VEH_BASE}/${encodeURIComponent(vin)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(changes),
  });
}

/** Elimina un vehículo por VIN (admin). */
export async function deleteVehicle(vin: string): Promise<void> {
  await jsonFetch<void>(`${VEH_BASE}/${encodeURIComponent(vin)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
/** Lista por nombre de cliente (admin). */

export async function vehiclesByClientName(
  full_name: string,
  exact = false
): Promise<VehicleSearchRow[]> {
  const qs = new URLSearchParams({ full_name });
  if (exact) qs.set("exact", "true");

  return jsonFetch<VehicleSearchRow[]>(
    `${VEH_BASE}/by_client_name?${qs.toString()}`,
    { headers: authHeaders() }
  );
}

/** Lista por cliente (admin). */
export async function vehiclesByClient(client_id: string): Promise<Vehicle[]> {
  return jsonFetch<Vehicle[]>(`${VEH_BASE}/by_client/${encodeURIComponent(client_id)}`, {
    headers: authHeaders(),
  });
}



/** Búsqueda por filtros booleanos / cliente (admin).
 *  Normaliza a [] si el backend devuelve un string "no hay datos para mostrar".
 */
export async function searchVehicles(filters?: {
  client_id?: string;
  arrived?: boolean;
  freight_paid?: boolean;
  tow_paid?: boolean;
}): Promise<VehicleSearchRow[]> {
  const qs = new URLSearchParams();
  if (filters?.client_id) qs.set("client_id", filters.client_id);
  if (typeof filters?.arrived === "boolean") qs.set("arrived", String(filters.arrived));
  if (typeof filters?.freight_paid === "boolean") qs.set("freight_paid", String(filters.freight_paid));
  if (typeof filters?.tow_paid === "boolean") qs.set("tow_paid", String(filters.tow_paid));

  const resp = await jsonFetch<unknown>(`${VEH_BASE}/search${qs.toString() ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return Array.isArray(resp) ? (resp as VehicleSearchRow[]) : [];
}

/** Decode VIN (usa NHTSA). Tu endpoint GET /vehicles/decode/{vin} es público. */

export async function decodeVin(vin: string): Promise<{ vehiculo: string; make?: string; model?: string; year?: number }> {
  return jsonFetch(`${VEH_BASE}/decode/${encodeURIComponent(vin)}`);
}
