export interface Client {
  id: string;           // lo devolvemos como string desde el backend
  client_id: string;    // identificador del cliente (único)
  full_name: string;
  email?: string;
  phone?: string;
  disabled?: boolean;
}

export type ClientCreate = {
  client_id: string;
  full_name: string;
  email?: string;
  phone?: string;
 disabled?: boolean;
};

export type ClientUpdate = Partial<Omit<ClientCreate, "client_id">>;

