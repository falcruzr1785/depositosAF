// src/pages/admin/Clientes.tsx

import { useEffect, useMemo, useState, useCallback } from "react";
import { Button, Form, Row, Col, Table, Spinner, Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { Client, ClientCreate, ClientUpdate } from "../../types/client";
import { listClients, deleteClient, createClient, updateClient } from "../../utils/api";
import { useForm, type SubmitHandler } from "react-hook-form";

// Helper de errores tipado
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.detail === "string") return anyErr.detail;
    if (typeof anyErr.error === "string") return anyErr.error;
  }
  try { return JSON.stringify(err); } catch { return String(err); }
}

type ModalState =
  | { show: false }
  | { show: true; mode: "create"; initial?: undefined }
  | { show: true; mode: "edit"; initial: Client };

export default function ClientesAdmin() {
  const [items, setItems] = useState<Client[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>({ show: false });

  // Cargar lista
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listClients();
      setItems(data);
    } catch (err: unknown) {
      Swal.fire({ icon: "error", title: "Error al listar", text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Toggle Activo (activo = !disabled)
  const onToggleActive = useCallback(
    async (c: Client, active: boolean) => {
      try {
        await updateClient(c.client_id, { disabled: !active });
        await refresh();
      } catch (err: unknown) {
        Swal.fire({ icon: "error", title: "Error al cambiar estado", text: getErrorMessage(err) });
      }
    },
    [refresh]
  );

  // Búsqueda simple
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      c.client_id.toLowerCase().includes(s) ||
      c.full_name.toLowerCase().includes(s) ||
      (c.email ?? "").toLowerCase().includes(s) ||
      (c.phone ?? "").toLowerCase().includes(s)
    );
  }, [q, items]);

  // Eliminar
  const onDelete = async (client_id: string) => {
    const r = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar cliente ${client_id}?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "#d33",
    });
    if (!r.isConfirmed) return;
    try {
      await deleteClient(client_id);
      await refresh();
      Swal.fire({ icon: "success", title: "Eliminado" });
    } catch (err: unknown) {
      Swal.fire({ icon: "error", title: "Error al eliminar", text: getErrorMessage(err) });
    }
  };

  return (
    <div className="container py-4">
      <Row className="align-items-end g-2">
        <Col xs={12} md={6}>
          <h3 className="mb-0">Clientes</h3>
          <small className="text-muted">Administración de clientes</small>
        </Col>
        <Col xs={12} md={6} className="text-md-end">
          <Button onClick={() => setModal({ show: true, mode: "create" })}>Nuevo cliente</Button>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={6}>
          <Form.Control
            placeholder="Buscar por ID, nombre, correo o teléfono…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Col>
      </Row>

      <div className="mt-3 oval-shadow p-3">
        {loading ? (
          <div className="py-5 text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Activo</th>
                <th style={{ width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.client_id}>
                  <td>{c.client_id}</td>
                  <td>{c.full_name}</td>
                  <td>{c.email ?? "-"}</td>
                  <td>{c.phone ?? "-"}</td>
                  <td>
                    <Form.Check
                      type="switch"
                      id={`cl-${c.client_id}`}
                      checked={!c.disabled} // activo si NO está disabled
                      onChange={(e) => onToggleActive(c, e.currentTarget.checked)}
                      label={!c.disabled ? "Sí" : "No"}
                    />
                  </td>
                  <td className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setModal({ show: true, mode: "edit", initial: c })}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => onDelete(c.client_id)}
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {modal.show && (
        <ClientFormModal
          mode={modal.mode}
          initial={modal.mode === "edit" ? modal.initial : undefined}
          onClose={() => setModal({ show: false })}
          onSaved={async () => {
            setModal({ show: false });
            await refresh();
          }}
        />
      )}
    </div>
  );
}

/* ----------------------- Modal de Crear / Editar ----------------------- */

type FormValues = {
  client_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  disabled?: boolean; // true = inactivo
};

function ClientFormModal(props: {
  mode: "create" | "edit";
  initial?: Client;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { mode, initial, onClose, onSaved } = props;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: initial
      ? {
          client_id: initial.client_id,
          full_name: initial.full_name,
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          disabled: Boolean(initial.disabled),
        }
      : { client_id: "", full_name: "", email: "", phone: "", disabled: false }, // nuevo: activo por defecto
  });

  useEffect(() => {
    if (initial) {
      reset({
        client_id: initial.client_id,
        full_name: initial.full_name,
        email: initial.email ?? "",
        phone: initial.phone ?? "",
        disabled: Boolean(initial.disabled),
      });
    } else {
      reset({ client_id: "", full_name: "", email: "", phone: "", disabled: false });
    }
  }, [initial, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      if (mode === "create") {
        const payload: ClientCreate = {
          client_id: data.client_id.trim(),
          full_name: data.full_name.trim(),
          email: data.email?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
          disabled: !!data.disabled,
        };
        await createClient(payload);
        Swal.fire({ icon: "success", title: "Cliente creado" });
      } else {
        if (!initial) return;
        const changes: ClientUpdate = {};
        const setIfChanged = <K extends keyof ClientUpdate>(k: K, v: ClientUpdate[K], old?: ClientUpdate[K]) => {
          if (v !== undefined && v !== old) changes[k] = v;
        };
        setIfChanged("full_name", data.full_name.trim(), initial.full_name);
        setIfChanged("email", data.email?.trim() || undefined, initial.email);
        setIfChanged("phone", data.phone?.trim() || undefined, initial.phone);
        setIfChanged("disabled", !!data.disabled, Boolean(initial.disabled));

        if (Object.keys(changes).length === 0) {
          Swal.fire({ icon: "info", title: "Sin cambios" });
          return;
        }
        await updateClient(initial.client_id, changes);
        Swal.fire({ icon: "success", title: "Cliente actualizado" });
      }
      await onSaved();
    } catch (err: unknown) {
      Swal.fire({ icon: "error", title: "Error", text: getErrorMessage(err) });
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === "create" ? "Nuevo cliente" : `Editar: ${initial?.client_id}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Client ID</Form.Label>
              <Form.Control
                {...register("client_id", { required: mode === "create" })}
                placeholder="CL-001"
                disabled={mode === "edit"}
              />
              {errors.client_id && <div className="text-danger small">Requerido</div>}
            </Col>
            <Col md={6}>
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control
                {...register("full_name", { required: true, minLength: 2 })}
                placeholder="Nombre y apellidos"
              />
              {errors.full_name && <div className="text-danger small">Requerido</div>}
            </Col>
            <Col md={6}>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                {...register("email", {
                  pattern: { value: /^\S+@\S+\.\S+$/, message: "Email inválido" },
                })}
                placeholder="correo@dominio.com"
              />
              {errors.email?.message && <div className="text-danger small">{errors.email.message}</div>}
            </Col>
            <Col md={6}>
              <Form.Label>Teléfono</Form.Label>
              <Form.Control {...register("phone")} placeholder="8888 8888" />
            </Col>
            <Col xs={12}>
              <Form.Check
                type="checkbox"
                id="cliente-disabled"
                label="Deshabilitado"
                {...register("disabled")}
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}