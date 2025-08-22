// src/pages/reports/VehiculosPorCliente.tsx
import { useCallback, useMemo, useState } from "react";
import { Row, Col, Form, Button, Table, Spinner, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import { copiarAlPortapapeles } from "../../utils/clipboard";
import {
  listClients,
  vehiclesByClient,
  vehiclesByClientName,
} from "../../utils/api";
import type { Vehicle } from "../../types/vehicle";
import type { Client } from "../../types/client";

/* ---------------- helpers ---------------- */
const fmtDate = (v?: string | Date) => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const estadoBadge = (v: Vehicle) => {
  if (v.arrived) return <Badge bg="success">Entregado</Badge>;
  if (v.tow_paid || v.freight_paid) {
    return (
      <Badge bg="warning" text="dark">
        En proceso
      </Badge>
    );
  }
  return <Badge bg="secondary">Nuevo</Badge>;
};

const errMsg = (e: unknown): string =>
  e instanceof Error
    ? e.message
    : typeof e === "string"
    ? e
    : (() => {
        try {
          return JSON.stringify(e);
        } catch {
          return String(e);
        }
      })();

/* ======================= Informe por cliente (solo lectura) ======================= */

export default function VehiculosPorCliente() {
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);

  const [cliente, setCliente] = useState<Client | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);

  const buscar = useCallback(async () => {
    const id = clientId.trim();
    const name = clientName.trim();

    if (!id && name.length < 2) {
      Swal.fire({
        icon: "info",
        title: "Ingrese filtros",
        text: "Escriba cédula del cliente o al menos 2 letras del nombre.",
      });
      return;
    }

    setLoading(true);
    setVehiculos([]);
    setCliente(null);

    try {
      if (id) {
        // ✅ Backend permite GET /clients?client_id=... (listado filtrado)
        const found = await listClients({ client_id: id });
        const cli = Array.isArray(found) ? found[0] ?? null : null;
        setCliente(cli);

        // Cargar vehículos del cliente
        const vs = await vehiclesByClient(id);
        setVehiculos((vs ?? []) as Vehicle[]);
      } else {
        // Por nombre: devuelve filas compatibles con VehicleSearchRow; mapeamos a Vehicle parcialmente
        const rows = await vehiclesByClientName(name, false);
        setVehiculos((rows as unknown as Vehicle[]) ?? []);
      }
    } catch (e) {
      Swal.fire({ icon: "error", title: "No se pudo cargar", text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [clientId, clientName]);

  const textoInforme = useMemo(() => {
    const owner = cliente
      ? `${cliente.client_id} — ${cliente.full_name ?? ""}`
      : clientName.trim() || clientId.trim();

    const header = `INFORME DE VEHÍCULOS POR CLIENTE
Cliente: ${owner}
Total: ${vehiculos.length}

`;
    const lines = vehiculos.map((v) => {
      const estado = v.arrived ? "Entregado" : v.tow_paid || v.freight_paid ? "En proceso" : "Nuevo";
      return [
        `VIN: ${v.vin}`,
        `Marca/Modelo/Año: ${(v.make ?? "—")} ${(v.model ?? "")} ${(v.year ?? "")}`.trim(),
        `Compra: ${fmtDate(v.buy_date)}  |  Ingreso: ${v.arrived}`,
        `Pagos -> Barco: ${v.freight_paid ? "Sí" : "No"}; Grúa: ${v.tow_paid ? "Sí" : "No"}`,
        `Consignatario: ${v.consignatario ?? "—"}`,
        `Agente: ${v.agent_info ?? "—"}`,
        `Notas: ${v.note ?? "—"}`,
        `Estado: ${estado}`,
      ].join("\n");
    });
    return header + lines.join("\n\n");
  }, [vehiculos, cliente, clientId, clientName]);

  return (
    <div className="container py-4">
      <Row className="align-items-end g-2">
        <Col xs={12} md={6}>
          <h3 className="mb-0">Informe por cliente</h3>
          <small className="text-muted">Consulta de vehículos (solo lectura)</small>
        </Col>
        <Col xs={12} md={6} className="text-md-end d-flex gap-2 justify-content-md-end">
          <Button
            variant="outline-secondary"
            onClick={() => copiarAlPortapapeles(textoInforme)}
            disabled={!vehiculos.length}
          >
            Copiar informe
          </Button>
          <Button variant="outline-primary" onClick={() => window.print()} disabled={!vehiculos.length}>
            Imprimir
          </Button>
        </Col>
      </Row>

      <Row className="mt-3 g-2">
        <Col md={4}>
          <Form.Label className="mb-1">Cédula (client_id)</Form.Label>
          <Form.Control
            placeholder="206912345"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
          <small className="text-muted">Si completas cédula, ignora el nombre.</small>
        </Col>
        <Col md={5}>
          <Form.Label className="mb-1">Nombre del cliente</Form.Label>
          <Form.Control
            placeholder="Ej: Pedro Pérez"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            disabled={!!clientId.trim()}
          />
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button onClick={buscar} className="w-100" disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </Col>
      </Row>

      {/* Encabezado del cliente (si se buscó por cédula) */}
      {cliente && (
        <div className="mt-3">
          <strong>Cliente:</strong> {cliente.client_id} — {cliente.full_name ?? "—"}
        </div>
      )}

      <div className="mt-3 oval-shadow p-3">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>VIN</th>
                <th>Consignatario</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Compra</th>
                <th>LLegó</th>
                <th>Barco</th>
                <th>Grúa</th>
                <th>Agente</th>
                <th>Notas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((v) => (
                <tr key={v.vin}>
                  <td>{v.client_id}</td>
                  <td>{v.vin}</td>
                  <td>{v.consignatario ?? "—"}</td>
                  <td>{v.make ?? "—"}</td>
                  <td>{v.model ?? "—"}</td>
                  <td>{v.year ?? "—"}</td>
                  <td>{fmtDate(v.buy_date)}</td>
                  <td>{v.arrived ? "Sí" : "No"}</td>
                  <td>{v.freight_paid ? "Sí" : "No"}</td>
                  <td>{v.tow_paid ? "Sí" : "No"}</td>
 
                  <td>{v.agent_info ?? "—"}</td>
                  <td>{v.note ?? "—"}</td>
                  <td>{estadoBadge(v)}</td>
                </tr>
              ))}

              {!vehiculos.length && !loading && (
                <tr>
                  <td colSpan={12} className="text-center text-muted py-4">
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
