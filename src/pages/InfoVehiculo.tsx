// src/pages/InfoVehiculo.tsx
import  { useCallback, useEffect, useMemo, useState } from "react";
import type { Vehicle } from "../types/vehicle";
import { getStoredVehicle, decodeVin } from "../utils/api";
import { Button } from "react-bootstrap";
import { copiarAlPortapapeles } from "../utils/clipboard";

type Props = {
  vin?: string;
};

type VehicleExtra = {
  arrival_date?: string | Date;
  buy_date?: string | Date;
  arrived?: boolean;
  freight_paid?: boolean;
  tow_paid?: boolean;
  agent_info?: string;
  consignatario?: string;
  note?: string;
  client_id?: string;
};

type StoredVehicle = Vehicle & VehicleExtra;

type Decoded = {
  vehiculo?: string;
  make?: string;
  model?: string;
  year?: number;
};

function formatDate(value?: string | Date): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

function boolText(b?: boolean): string {
  if (b === true) return "Sí";
  if (b === false) return "No";
  return "—";
}

function getStatusCode(e: unknown): number | null {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/^(\d{3})(?:\s|:)/);
  return m ? parseInt(m[1], 10) : null;
}

export default function InfoVehiculo({ vin }: Props) {
  const hasPropVin = typeof vin === "string" && vin.trim().length > 0;
  const [vinLocal, setVinLocal] = useState<string>(vin?.trim() ?? "");
  const effectiveVin = useMemo(
    () => (hasPropVin ? vin!.trim() : vinLocal.trim()),
    [hasPropVin, vin, vinLocal]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veh, setVeh] = useState<StoredVehicle | null>(null);
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [origen, setOrigen] = useState<"Vehiculos registrados en el sistema" | "DMV" | null>(null);

  const load = useCallback(async () => {
    if (!effectiveVin) {
      setError("Ingrese un VIN para consultar.");
      setVeh(null);
      setDecoded(null);
      setOrigen(null);
      return;
    }
    setLoading(true);
    setError(null);
    setVeh(null);
    setDecoded(null);
    setOrigen(null);

    try {
      const v = await getStoredVehicle(effectiveVin);
      setVeh(v as StoredVehicle);
      setOrigen("Vehiculos registrados en el sistema");
      setLoading(false);
      return;
    } catch (e) {
      const code = getStatusCode(e);
      if (code !== 404) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
        return;
      }
    }

    try {
      const d = await decodeVin(effectiveVin);
      setDecoded(d);
      setOrigen("DMV");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [effectiveVin]);

  useEffect(() => {
    if (hasPropVin) {
      void load();
    }
  }, [hasPropVin, load]);

  const title =
    veh
      ? [veh.make, veh.model, veh.year].filter(Boolean).join(" ") || "Vehículo"
      : decoded
      ? [decoded.make, decoded.model, decoded.year].filter(Boolean).join(" ") ||
        decoded.vehiculo ||
        "Vehículo"
      : "Vehículo";

  const generarTextoInfo = (): string => {
    let text = `VIN: ${effectiveVin}\n`;
    if (veh) {
      text += `Marca: ${veh.make ?? "—"}\nModelo: ${veh.model ?? "—"}\nAño: ${
        veh.year ?? "—"
      }\nID Cliente: ${veh.client_id ?? "—"}\nFecha de compra: ${formatDate(
        veh.buy_date
      )}\nFecha de ingreso: ${formatDate(veh.arrival_date)}\nArribó: ${boolText(
        veh.arrived
      )}\nFlete pagado: ${boolText(veh.freight_paid)}\nGrúa pagada: ${boolText(
        veh.tow_paid
      )}\nAgente/Documentos: ${
        veh.agent_info ?? "—"
      }\nConsignatario: ${veh.consignatario ?? "—"}\nNota: ${veh.note ?? "—"}`;
    } else if (decoded) {
      text += `Marca: ${decoded.make ?? "—"}\nModelo: ${
        decoded.model ?? "—"
      }\nAño: ${decoded.year ?? "—"}\nDescripción: ${decoded.vehiculo ?? "—"}`;
    }
    return text;
  };

  return (
    <section>
      <h3>{title}</h3>

      {/* Input VIN si no viene por props */}
      {!hasPropVin && (
        <p>
          <label>
            <strong>VIN:</strong>{" "}
            <input
              value={vinLocal}
              onChange={(e) => setVinLocal(e.target.value)}
              placeholder="Digite el VIN"
            />
          </label>{" "}
          <Button variant="primary" onClick={load} disabled={loading}>
            {loading ? "Cargando..." : "Consultar"}
          </Button>
        </p>
      )}

      {/* Botones de acción */}
      {effectiveVin && (
        <div className="d-flex gap-3 mt-2">
          <Button
            variant="secondary"
            onClick={() => copiarAlPortapapeles(effectiveVin)}
            disabled={!effectiveVin}
          >
            Copiar VIN
          </Button>

          <Button
            variant="primary"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Recargar"}
          </Button>

          <Button
            variant="success"
            onClick={() => copiarAlPortapapeles(generarTextoInfo())}
            disabled={!veh && !decoded}
          >
            Copiar info
          </Button>
        </div>
      )}

      {origen && <p className="mt-2"><em>Origen: {origen}</em></p>}

      {error && (
        <p>
          <strong>Error:</strong> {error}
        </p>
      )}

      {/* Vista Decodificada */}
      {decoded && !veh && (
        <div>
          <h4>Datos decodificados</h4>
          <table>
            <tbody>
              <tr><td><strong>Marca</strong></td><td>{decoded.make ?? "—"}</td></tr>
              <tr><td><strong>Modelo</strong></td><td>{decoded.model ?? "—"}</td></tr>
              <tr><td><strong>Año</strong></td><td>{decoded.year ?? "—"}</td></tr>
              <tr><td><strong>Descripción</strong></td><td>{decoded.vehiculo ?? "—"}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Vista Guardada en BD */}
      {veh && (
        <div>
          <h4>Datos guardados</h4>
          <table>
            <tbody>
              <tr><td><strong>Marca</strong></td><td>{veh.make ?? "—"}</td></tr>
              <tr><td><strong>Modelo</strong></td><td>{veh.model ?? "—"}</td></tr>
              <tr><td><strong>Año</strong></td><td>{veh.year ?? "—"}</td></tr>
              <tr><td><strong>ID Cliente</strong></td><td>{veh.client_id ?? "—"}</td></tr>
              <tr><td><strong>Fecha de compra</strong></td><td>{formatDate(veh.buy_date)}</td></tr>
              <tr><td><strong>Fecha de ingreso</strong></td><td>{formatDate(veh.arrival_date)}</td></tr>
              <tr><td><strong>Arribó</strong></td><td>{boolText(veh.arrived)}</td></tr>
              <tr><td><strong>Flete pagado</strong></td><td>{boolText(veh.freight_paid)}</td></tr>
              <tr><td><strong>Grúa pagada</strong></td><td>{boolText(veh.tow_paid)}</td></tr>
              <tr><td><strong>Agente / Documentos</strong></td><td>{veh.agent_info ?? "—"}</td></tr>
              <tr><td><strong>Consignatario</strong></td><td>{veh.consignatario ?? "—"}</td></tr>
              <tr><td><strong>Nota</strong></td><td>{veh.note ?? "—"}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
