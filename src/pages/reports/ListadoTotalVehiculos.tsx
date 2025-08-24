// src/pages/reports/ListadoTotalVehiculos.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Badge, Button, Form, Row, Col, Table, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";



// listClients,
import {
 
  vehiclesByClientName,
  searchVehicles,

 
  
} from "../../utils/api";



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

  const estado = (v: RowItem): "NoPagos" | "proceso" | "entregado" => {
    if (v.arrived) return "entregado";
    if (v.tow_paid || v.freight_paid) return "proceso";
    return "NoPagos";
    // *Puedes ajustar la lógica según tu negocio*
  };

  const estadoBadge = (s: ReturnType<typeof estado>) => {
    switch (s) {
      case "NoPagos":
        return <Badge bg="secondary">Sin pago de transporte</Badge>;
      case "proceso":
        return (
          <Badge bg="warning" text="dark">
            En proceso
          </Badge>
        );
      case "entregado":
        return <Badge bg="success">En almacén</Badge>;
    }
  };



  return (
    <div className="container py-4">
      <Row className="align-items-end g-2">
        <Col xs={12} md={6}>
          <h3 className="mb-0">Vehículos</h3>
          <small className="text-muted">Lista de vehículos(cantidad: {filtered.length}) </small>
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
                  <td className="d-flex gap-2"> </td>
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

     

    
      
    </div>
  );
}

/* =========================== Modal de Edición =========================== */

