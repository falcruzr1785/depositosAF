// src/types/bank.ts

/** Banco completo como lo devuelve el backend */
export type Bank = {
  name: string;              // clave fija
  account_number: string;
  bank_name: string;
  swift_code?: string;
  routing_number?: string;
  bank_address?: string;
  legal_address?: string;
  beneficiary?: string;
  buyer_id?: string;
};

/** Datos requeridos para crear un banco */
export type BankCreate = {
  name: string;
  account_number: string;
  bank_name: string;
  // lo demás puede venir vacío
  swift_code?: string;
  routing_number?: string;
  bank_address?: string;
  legal_address?: string;
  beneficiary?: string;
  buyer_id?: string;
};

/** Datos permitidos para actualizar un banco */
export type BankUpdate = Partial<Omit<Bank, "name">>;
// 👆 todo opcional, excepto que `name` no se actualiza
