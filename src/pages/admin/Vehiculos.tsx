// pages/admin/Vehiculos.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Badge, Button, Form, Row, Col, Table, Spinner, Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import type { Client } from "../../types/client";



import {
  listClients,
  createVehicle,
  vehiclesByClientName,
  searchVehicles,
  deleteVehicle,
  updateVehicle,
  getStoredVehicle,
  decodeVin,
} from "../../utils/api";

import type { VehicleCreate, Vehicle, VehicleUpdate } from "../../types/vehicle";
import { isoToInputDate, inputDateToIso } from "../../helpers/Date";

/* ---------------- Helpers ---------------- */

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    if (typeof anyErr.message === "string") return anyErr.message;
    if (typeof anyErr.detail === "string") return anyErr.detail;
    if (typeof anyErr.error === "string") return anyErr.error;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/* -------------- Tipos locales (coinciden con /vehicles/search) -------------- */

type RowItem = {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  client_id: string;
  arrived?: boolean;
  freight_paid?: boolean;
  tow_paid?: boolean;
};

type BoolFilter = "all" | "true" | "false";

/* =============================== Página =============================== */

export default function VehiculosAdmin() {

  const [clientName, setClientName] = useState("");

  const [items, setItems] = useState<RowItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [clientId, setClientId] = useState("");
  const [arrived, setArrived] = useState<BoolFilter>("all");
  const [freightPaid, setFreightPaid] = useState<BoolFilter>("all");
  const [towPaid, setTowPaid] = useState<BoolFilter>("all");

  const [editVin, setEditVin] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const toBool = (v: BoolFilter): boolean | undefined => (v === "all" ? undefined : v === "true");

 const load = useCallback(async () => {
  setLoading(true);
  try {
    if (clientName.trim().length >= 2) {
      const data = await vehiclesByClientName(clientName.trim());
      setItems(Array.isArray(data) ? data : []);
    } else {
      const data = await searchVehicles({
        client_id: clientId.trim() || undefined,
        arrived: toBool(arrived),
        freight_paid: toBool(freightPaid),
        tow_paid: toBool(towPaid),
      });
      setItems(Array.isArray(data) ? data : []);
    }
  } catch (e) {
    Swal.fire({ icon: "error", title: "Error cargando", text: getErrorMessage(e) });
  } finally {
    setLoading(false);
  }
}, [clientName, clientId, arrived, freightPaid, towPaid]);


  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return items;
    return items.filter(
      (v) =>
        v.vin.toLowerCase().includes(text) ||
        (v.make ?? "").toLowerCase().includes(text) ||
        (v.model ?? "").toLowerCase().includes(text) ||
        String(v.year ?? "").includes(text) ||
        (v.client_id ?? "").toLowerCase().includes(text)
    );
  }, [q, items]);

  const estado = (v: RowItem): "nuevo" | "proceso" | "entregado" => {
    if (v.arrived) return "entregado";
    if (v.tow_paid || v.freight_paid) return "proceso";
    return "nuevo";
    // *Puedes ajustar la lógica según tu negocio*
  };

  const estadoBadge = (s: ReturnType<typeof estado>) => {
    switch (s) {
      case "nuevo":
        return <Badge bg="secondary">Nuevo</Badge>;
      case "proceso":
        return (
          <Badge bg="warning" text="dark">
            En proceso
          </Badge>
        );
      case "entregado":
        return <Badge bg="success">Entregado</Badge>;
    }
  };

  const onDelete = async (vin: string) => {
    const r = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar ${vin}?`,
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "#d33",
    });
    if (!r.isConfirmed) return;
    try {
      await deleteVehicle(vin);
      await load();
      Swal.fire({ icon: "success", title: "Eliminado" });
    } catch (e: unknown) {
      Swal.fire({ icon: "error", title: "Error eliminando", text: getErrorMessage(e) });
    }
  };

  return (
    <div className="container py-4">
      <Row className="align-items-end g-2">
        <Col xs={12} md={6}>
          <h3 className="mb-0">Vehículos</h3>
          <small className="text-muted">Administración de vehículos</small>
        </Col>
        <Col xs={12} md={6} className="text-md-end">
          <Button onClick={() => setShowCreate(true)}>Nuevo vehículo</Button>
        </Col>
      </Row>

      <Row className="mt-3 g-2">
        <Col md={4}>
          <Form.Control
            placeholder="Buscar por VIN, marca, modelo, año o cliente…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Col>
<Col md={3}>
  <Form.Control
    placeholder="Filtrar Cliente por cédula…"
    value={clientId}
    onChange={(e) => setClientId(e.target.value)}
    disabled={!!clientName.trim()} // opcional: si filtras por nombre, desactiva cédula
  />
</Col>
<Col md={3}>
  <Form.Control
    placeholder="Filtrar por nombre de cliente…"
    value={clientName}
    onChange={(e) => setClientName(e.target.value)}
  />
</Col>

        <Col md={5} className="d-flex gap-2">
          <Form.Select value={arrived} onChange={(e) => setArrived(e.target.value as BoolFilter)}>
            <option value="all">Llegaron al almacén: Todos</option>
            <option value="true">Llegaron al almacén: Sí</option>
            <option value="false">Llegaron al almacén: No</option>
          </Form.Select>
          <Form.Select value={freightPaid} onChange={(e) => setFreightPaid(e.target.value as BoolFilter)}>
            <option value="all">Barco pago: Todos</option>
            <option value="true">Barco pago: Sí</option>
            <option value="false">Barco pago: No</option>
          </Form.Select>
          <Form.Select value={towPaid} onChange={(e) => setTowPaid(e.target.value as BoolFilter)}>
            <option value="all">Grúa paga: Todos</option>
            <option value="true">Grúa paga: Sí</option>
            <option value="false">Grúa paga: No</option>
          </Form.Select>
          <Button variant="outline-secondary" onClick={() => load()}>
            Aplicar
          </Button>
        </Col>
      </Row>

      <div className="mt-3 oval-shadow p-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>VIN</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th style={{ width: 160 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.vin}>
                  <td>{v.vin}</td>
                  <td>{v.make || "-"}</td>
                  <td>{v.model || "-"}</td>
                  <td>{v.year || "-"}</td>
                  <td>{v.client_id || "-"}</td>
                  <td>{estadoBadge(estado(v))}</td>
                  <td className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary" onClick={() => setEditVin(v.vin)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => onDelete(v.vin)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modal de Edición */}
      {editVin && (
        <EditVehicleModal
          vin={editVin}
          onClose={() => setEditVin(null)}
          onSaved={async () => {
            setEditVin(null);
            await load();
          }}
        />
      )}

      {/* Modal de Creación */}
      {showCreate && (
        <CreateVehicleModal
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

/* =========================== Modal de Edición =========================== */

function EditVehicleModal({
  vin,
  onClose,
  onSaved,
}: {
  vin: string;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [initial, setInitial] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);

  const [consignatario, setConsignatario] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [clientId, setClientId] = useState("");
  const [buyDate, setBuyDate] = useState(""); // yyyy-mm-dd
  const [towPaid, setTowPaid] = useState(false);
  const [freightPaid, setFreightPaid] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [agentInfo, setAgentInfo] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const v = await getStoredVehicle(vin);
        setInitial(v);
        setConsignatario(v.consignatario ?? "");
        setMake(v.make ?? "");
        setModel(v.model ?? "");
        setYear(typeof v.year === "number" ? v.year : "");
        setClientId(v.client_id ?? "");
        setBuyDate(v.buy_date ? isoToInputDate(v.buy_date) : "");
        setTowPaid(!!v.tow_paid);
        setFreightPaid(!!v.freight_paid);
        setArrived(!!v.arrived);
        setAgentInfo(v.agent_info ?? "");
        setNote(v.note ?? "");
      } catch (e: unknown) {
        Swal.fire({ icon: "error", title: "No se pudo cargar el vehículo", text: getErrorMessage(e) });
        onClose();
      }
    })();
  }, [vin, onClose]);

  const handleSave = async () => {
    if (!initial) return;
    const changes: VehicleUpdate = {};

    const setIfChanged = <K extends keyof VehicleUpdate>(
      k: K,
      val: VehicleUpdate[K],
      old?: VehicleUpdate[K]
    ) => {
      if (val !== undefined && val !== old) changes[k] = val;
    };

    setIfChanged("consignatario", consignatario || undefined, initial.consignatario);
    setIfChanged("make", make || undefined, initial.make);
    setIfChanged("model", model || undefined, initial.model);
    setIfChanged("year", typeof year === "number" ? year : undefined, initial.year);
    setIfChanged("client_id", clientId || undefined, initial.client_id);
    setIfChanged("buy_date", buyDate ? inputDateToIso(buyDate) : undefined, initial.buy_date);
    setIfChanged("tow_paid", towPaid, initial.tow_paid);
    setIfChanged("freight_paid", freightPaid, initial.freight_paid);
    setIfChanged("arrived", arrived, initial.arrived);
    setIfChanged("agent_info", agentInfo || undefined, initial.agent_info);
    setIfChanged("note", note || undefined, initial.note);

    if (Object.keys(changes).length === 0) {
      Swal.fire({ icon: "info", title: "Sin cambios" });
      return;
    }

    try {
      setSaving(true);
      await updateVehicle(vin, changes);
      await onSaved();
      Swal.fire({ icon: "success", title: "Vehículo actualizado" });
    } catch (e: unknown) {
      Swal.fire({ icon: "error", title: "Error al actualizar", text: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Editar vehículo: {vin}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!initial ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form className="d-grid gap-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Consignatario</Form.Label>
                <Form.Control value={consignatario} onChange={(e) => setConsignatario(e.target.value)} />
              </Col>
              <Col md={6}>
                <Form.Label>Client ID</Form.Label>
                <Form.Control value={clientId} onChange={(e) => setClientId(e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Marca</Form.Label>
                <Form.Control value={make} onChange={(e) => setMake(e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Modelo</Form.Label>
                <Form.Control value={model} onChange={(e) => setModel(e.target.value)} />
              </Col>
              <Col md={4}>
                <Form.Label>Año</Form.Label>
                <Form.Control
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                />
              </Col>
              <Col md={6}>
                <Form.Label>Fecha de compra</Form.Label>
                <Form.Control type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} />
              </Col>
              <Col md={6} className="d-flex flex-column justify-content-end gap-2">
                <Form.Check
                  type="checkbox"
                  label="Pago grúa"
                  checked={towPaid}
                  onChange={(e) => setTowPaid(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="Pago barco"
                  checked={freightPaid}
                  onChange={(e) => setFreightPaid(e.target.checked)}
                />
                <Form.Check
                  type="checkbox"
                  label="¿Llegó?"
                  checked={arrived}
                  onChange={(e) => setArrived(e.target.checked)}
                />
              </Col>
              <Col md={12}>
                <Form.Label>Nombre del agente</Form.Label>
                <Form.Control value={agentInfo} onChange={(e) => setAgentInfo(e.target.value)} />
              </Col>
              <Col md={12}>
                <Form.Label>Notas</Form.Label>
                <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={!initial || saving}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/* =========================== Modal de Creación =========================== */

function CreateVehicleModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  // lista de clientes para el select
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // campos del formulario
  const [vin, setVin] = useState("");
  const [consignatario, setConsignatario] = useState("");
  const [clientId, setClientId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [buyDate, setBuyDate] = useState(""); // yyyy-mm-dd
  const [towPaid, setTowPaid] = useState(false);
  const [freightPaid, setFreightPaid] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [agentInfo, setAgentInfo] = useState("");
  const [note, setNote] = useState("");
  const [vinPreview, setVinPreview] = useState<string | null>(null);

  const errMsg = (e: unknown) =>
    e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e);

  // Cargar clientes
  useEffect(() => {
    (async () => {
      try {
        setLoadingClients(true);
        const data = await listClients();
        setClients(data.filter((c) => !c.disabled)); // si quieres excluir deshabilitados
      } catch (e) {
        Swal.fire({ icon: "error", title: "No se pudieron cargar clientes", text: errMsg(e) });
      } finally {
        setLoadingClients(false);
      }
    })();
  }, []);

  const onDecodeVin = async () => {
  const v = vin.trim();
  if (!v) return;
  try {
    const resp = await decodeVin(v); // { vehiculo, make, model, year }
    setVinPreview(resp.vehiculo);

    // Rellenar SOLO si están vacíos (para no pisar lo que el usuario escribió)
    if (!make && resp.make) setMake(resp.make);
    if (!model && resp.model) setModel(resp.model);
    if (!year && typeof resp.year === "number") setYear(resp.year);
  } catch (e) {
    Swal.fire({ icon: "error", title: "No se pudo verificar el VIN", text: errMsg(e) });
  }
};

  const handleCreate = async () => {
    const v_vin = vin.trim();
    const v_client = clientId.trim();

    if (!v_vin || !v_client) {
      Swal.fire({ icon: "warning", title: "Campos requeridos", text: "VIN y Cliente son obligatorios." });
      return;
    }

    const payload: VehicleCreate = {
      vin: v_vin,
      client_id: v_client,
      consignatario: consignatario.trim() || undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
      year: typeof year === "number" ? year : undefined,
      buy_date: buyDate ? new Date(`${buyDate}T00:00:00`).toISOString() : undefined,
      tow_paid: !!towPaid,
      freight_paid: !!freightPaid,
      arrived: !!arrived,
      agent_info: agentInfo.trim() || undefined,
      note: note.trim() || undefined,
    };

    try {
      setSaving(true);
      await createVehicle(payload);
      await onSaved();
      Swal.fire({ icon: "success", title: "Vehículo creado" });
      onClose();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Error al crear", text: errMsg(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Nuevo vehículo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form className="d-grid gap-3">
          <Row className="g-3">
            <Col md={8}>
              <Form.Label>VIN *</Form.Label>
              <Form.Control
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="1NXBU4EE5AZ213394"
                disabled={saving}
              />
            </Col>
            <Col md={4} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={onDecodeVin} disabled={!vin.trim() || saving}>
                Verificar VIN
              </Button>
            </Col>
            {vinPreview && (
              <Col xs={12}>
                <small className="text-muted">Decodificación: {vinPreview}</small>
              </Col>
            )}

            <Col md={6}>
              <Form.Label>Cliente *</Form.Label>
              <Form.Select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loadingClients || saving}
              >
                <option value="">-- Selecciona un cliente --</option>
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.client_id} — {c.full_name}
                  </option>
                ))}
              </Form.Select>
              {!loadingClients && clients.length === 0 && (
                <small className="text-muted">No hay clientes disponibles.</small>
              )}
            </Col>
            <Col md={6}>
              <Form.Label>Consignatario</Form.Label>
              <Form.Control
                value={consignatario}
                onChange={(e) => setConsignatario(e.target.value)}
                disabled={saving}
              />
            </Col>

            <Col md={4}>
              <Form.Label>Marca</Form.Label>
              <Form.Control value={make} onChange={(e) => setMake(e.target.value)} disabled={saving} />
            </Col>
            <Col md={4}>
              <Form.Label>Modelo</Form.Label>
              <Form.Control value={model} onChange={(e) => setModel(e.target.value)} disabled={saving} />
            </Col>
            <Col md={4}>
              <Form.Label>Año</Form.Label>
              <Form.Control
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")}
                disabled={saving}
              />
            </Col>

            <Col md={6}>
              <Form.Label>Fecha de compra</Form.Label>
              <Form.Control type="date" value={buyDate} onChange={(e) => setBuyDate(e.target.value)} disabled={saving} />
            </Col>
            <Col md={6} className="d-flex flex-column justify-content-end gap-2">
              <Form.Check type="checkbox" label="Pago grúa" checked={towPaid} onChange={(e) => setTowPaid(e.target.checked)} disabled={saving} />
              <Form.Check type="checkbox" label="Pago barco" checked={freightPaid} onChange={(e) => setFreightPaid(e.target.checked)} disabled={saving} />
              <Form.Check type="checkbox" label="¿Llegó?" checked={arrived} onChange={(e) => setArrived(e.target.checked)} disabled={saving} />
            </Col>

            <Col md={12}>
              <Form.Label>Nombre del agente</Form.Label>
              <Form.Control value={agentInfo} onChange={(e) => setAgentInfo(e.target.value)} disabled={saving} />
            </Col>
            <Col md={12}>
              <Form.Label>Notas</Form.Label>
              <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={saving} />
            </Col>
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleCreate}
          disabled={saving || !vin.trim() || !clientId.trim()}
        >
          {saving ? "Creando..." : "Crear"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
