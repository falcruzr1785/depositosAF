//src/pages/admin/Usuarios.tsx

// src/pages/admin/Usuarios.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Form, Row, Col, Table, Spinner, Modal, Alert } from "react-bootstrap";
import type { User, UserUpdate } from "../../types/user";

import { deleteUser, listUsers, toggleUserDisabled, updateUser, createUser } from "../../utils/api";


type FormState = {
  cedula: string;
  full_name: string;
  email: string;
  password?: string;   // solo crear o si se cambia
  is_admin: boolean;
  disabled?: boolean;
};

export default function UsuariosAdmin() {
  const [items, setItems] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyRow, setBusyRow] = useState<string | null>(null); // cedula que está en acción
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // modal
  const [show, setShow] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [form, setForm] = useState<FormState>({
    cedula: "",
    full_name: "",
    email: "",
    password: "",
    is_admin: false,
    disabled: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setItems(data ?? []);
    } catch (e) { // <- e es unknown
    const msg = e instanceof Error ? e.message : String(e);
    setError(msg || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setIsNew(true);
    setForm({
      cedula: "",
      full_name: "",
      email: "",
      password: "",
      is_admin: false,
      disabled: false,
    });
    setShow(true);
  };

  const openEdit = (u: User) => {
    setIsNew(false);
    setForm({
      cedula: u.cedula,
      full_name: u.full_name,
      email: u.email,
      password: "",
      is_admin: !!u.is_admin,
      disabled: !!u.disabled,
    });
    setShow(true);
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((s) => ({
      ...s,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

const onSave = async () => {
  setError(null);
  setOkMsg(null);
  try {
    if (isNew) {
      if (!form.cedula.trim() || !form.full_name.trim() || !form.email.trim() || !form.password?.trim()) {
        setError("Complete cédula, nombre, email y contraseña.");
        return;
      }
      await createUser({
        cedula: form.cedula.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password!.trim(),
        is_admin: !!form.is_admin,
      });
      setOkMsg("Usuario creado.");
    } else {
      const changes: UserUpdate = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        is_admin: !!form.is_admin,
        ...(form.password && form.password.trim() ? { password: form.password.trim() } : {}),
      };
      await updateUser(form.cedula, changes);
      setOkMsg("Usuario actualizado.");
    }
    setShow(false);
    await load();
  } catch (e) { // <- unknown por defecto
    const msg = e instanceof Error ? e.message : String(e);
    setError(msg || "Error guardando usuario");
  }
};


  const onDelete = async (cedula: string) => {
    if (!window.confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    setBusyRow(cedula);
    setError(null);
    setOkMsg(null);
    try {
      await deleteUser(cedula);
      setOkMsg("Usuario eliminado.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Error eliminando usuario");
    } finally {
      setBusyRow(null);
    }
  };

  const onToggleActive = async (u: User, active: boolean) => {
    // active = !disabled
    setBusyRow(u.cedula);
    setError(null);
    setOkMsg(null);
    try {
      await toggleUserDisabled(u.cedula, !active); // backend espera 'disabled'
      setOkMsg(active ? "Usuario activado." : "Usuario desactivado.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Error cambiando estado");
    } finally {
      setBusyRow(null);
    }
  };

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return items;
    return items.filter(
      (u) =>
        u.cedula.includes(text) ||
        u.full_name.toLowerCase().includes(text) ||
        u.email.toLowerCase().includes(text)
    );
  }, [q, items]);

  return (
    <div className="container py-4">
      <Row className="align-items-end g-2">
        <Col xs={12} md={6}>
          <h3 className="mb-0">Usuarios</h3>
          <small className="text-muted">Administración de cuentas</small>
        </Col>
        <Col xs={12} md={6} className="text-md-end">
          <Button onClick={openNew}>Nuevo usuario</Button>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={6}>
          <Form.Control
            placeholder="Buscar por cédula, nombre o email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Col>
      </Row>

      <div className="mt-3 oval-shadow p-3">
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
        {okMsg && <Alert variant="success" className="mb-3">{okMsg}</Alert>}

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Cédula</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th style={{ width: 220 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const active = !u.disabled;
                const rowBusy = busyRow === u.cedula;
                return (
                  <tr key={u.cedula}>
                    <td>{u.cedula}</td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>
                      {u.is_admin ? <Badge bg="primary">Admin</Badge> : <Badge bg="secondary">Usuario</Badge>}
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        id={`sw-${u.cedula}`}
                        checked={active}
                        disabled={rowBusy}
                        onChange={(e) => onToggleActive(u, e.currentTarget.checked)}
                        label={active ? "Sí" : "No"}
                      />
                    </td>
                    <td className="d-flex gap-2">
                      <Button size="sm" variant="outline-primary" onClick={() => openEdit(u)} disabled={rowBusy}>
                        {rowBusy ? <Spinner size="sm" animation="border" /> : "Editar"}
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => onDelete(u.cedula)} disabled={rowBusy}>
                        {rowBusy ? <Spinner size="sm" animation="border" /> : "Eliminar"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isNew ? "Nuevo usuario" : "Editar usuario"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="d-grid gap-3">
            <Form.Group>
              <Form.Label>Cédula</Form.Label>
              <Form.Control
                name="cedula"
                value={form.cedula}
                onChange={onChange}
                placeholder="Ej. 206120652"
                disabled={!isNew}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Nombre completo</Form.Label>
              <Form.Control
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                placeholder="Nombre y apellidos"
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="correo@dominio.com"
              />
            </Form.Group>

            {isNew ? (
              <Form.Group>
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  value={form.password ?? ""}
                  onChange={onChange}
                  placeholder="mínimo 6 caracteres"
                />
              </Form.Group>
            ) : (
              <Form.Group>
                <Form.Label>Nueva contraseña (opcional)</Form.Label>
                <Form.Control
                  name="password"
                  type="password"
                  value={form.password ?? ""}
                  onChange={onChange}
                  placeholder="déjela vacía para no cambiarla"
                />
              </Form.Group>
            )}

            <Form.Group>
              <Form.Check
                type="checkbox"
                name="is_admin"
                checked={!!form.is_admin}
                onChange={onChange}
                label="Con privilegios de administrador"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancelar</Button>
          <Button variant="primary" onClick={onSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
