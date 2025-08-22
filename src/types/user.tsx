// src/types/user.ts


export type User = {
  cedula: string;
  full_name: string;
  email: string;
  is_admin: boolean;
  disabled?: boolean;
};

export type UserCreate = {
  cedula: string;
  full_name: string;
  email: string;
  password: string;
  is_admin?: boolean;
};

export type UserUpdate = {
  full_name?: string;
  email?: string;
  password?: string;   // opcional al editar
  is_admin?: boolean;
  disabled?: boolean;
};
