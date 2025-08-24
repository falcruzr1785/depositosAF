// src/pages/plantilla.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Row, Col, Card, Form, Button, Spinner, Alert } from "react-bootstrap";

import { copiarAlPortapapeles } from "../utils/clipboard";
import PrintPdf from "../utils/PrintPdf";
import {
  generateTransferText,
  listBanks,
  getStoredVehicle,
  decodeVin,
} from "../utils/api";
import type { Bank } from "../types/bank";
import type { Vehicle } from "../types/vehicle";

/* ---------------- types ---------------- */
type PlantillaForm = {
  plantilla: string;
  stock: string;
  monto: number;
  costos?: boolean;
  add_mount: number;
};

type Decoded = { vehiculo: string; make?: string; model?: string; year?: number };

/* ---------------- helpers ---------------- */
/** Construye el "deposit_detail" que consume /transfer */
const buildAuctionDetail = (stock: string) => {
  //const amountFmt = Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
  const stockFmt = (stock || "").trim().toUpperCase();
  // Ajusta la redacción si lo deseas
  return `-> *${stockFmt}* `;
};

const toTitle = (s: string) =>
  s.replace(/\b\p{L}/gu, (m) => m.toLocaleUpperCase("es-CR"));

/* ---------------- component ---------------- */
export default function Plantilla() {
  // ----- Form Depósito -----
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlantillaForm>({
  defaultValues: {
    plantilla: "",
    stock: "",
    monto: 0,
    costos: false,
    add_mount: 0,
  },
});
const costosChecked = watch("costos");
const monto = watch("monto") ?? 0;
const addMount = watch("add_mount") ?? 0;
const totalPreview = (Number(monto) || 0) + (costosChecked && Number(addMount) ? Number(addMount) : 0);


  const [detalle, setDetalle] = useState("");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [banksError, setBanksError] = useState<string | null>(null);

  // ----- VIN Panel -----
  const [vinLookup, setVinLookup] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState("");
  const [vinInfo, setVinInfo] = useState<Vehicle | Decoded | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadingBanks(true);
    listBanks()
      .then((b) => alive && setBanks(b))
      .catch((e: unknown) =>
        alive && setBanksError(e instanceof Error ? e.message : String(e))
      )
      .finally(() => {
        if (alive) setLoadingBanks(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const onSubmit = handleSubmit(async ({ plantilla, stock, monto, costos, add_mount }) => {
    if (!plantilla) return;
    const stockNorm = (stock || "").trim().toUpperCase();
    const montoBase = Number.isFinite(monto) ? Number(monto) : 0;


    const extraValido =
    costos && Number.isFinite(add_mount) && !Number.isNaN(add_mount) ? Number(add_mount) : 0;

  const montoFinal = montoBase + extraValido;

    // Construye el detalle para el backend (ya no usamos detalleTxtAuction)
    const depositDetail = buildAuctionDetail(stockNorm);

    try {
      const { texto } = await generateTransferText({
        bank: plantilla,
        detail: depositDetail,
        amount: montoFinal,
      });
      setDetalle(texto);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setDetalle(`Error: ${msg}`);
    }
  });

  const nothingToSelect = !loadingBanks && !banksError && banks.length === 0;

  const fetchVin = async () => {
    const v = vinLookup.trim();
    if (!v) {
      setVinError("Ingresa un VIN.");
      setVinInfo(null);
      return;
    }
    setVinError("");
    setVinInfo(null);
    setVinLoading(true);
    try {
      try {
        // Primero intenta buscar en BD
        const stored = await getStoredVehicle(v);
        setVinInfo(stored);
      } catch {
        // Si no está en BD, consulta al NHTSA
        const decoded = await decodeVin(v);
        setVinInfo(decoded);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setVinError(msg);
    } finally {
      setVinLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <Row className="g-4">
        {/* Izquierda: Plantilla */}
        <Col lg={5} xl={4}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body>
              <Card.Title>Plantilla</Card.Title>

              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3" controlId="plantilla">
                  <Form.Label>Plantilla</Form.Label>
                  <Form.Select
                    {...register("plantilla", { required: true })}
                    disabled={loadingBanks || !!banksError || nothingToSelect}
                  >
                    <option value="">
                      {loadingBanks
                        ? "Cargando bancos..."
                        : banksError
                        ? "No se pudo cargar"
                        : nothingToSelect
                        ? "Sin plantillas"
                        : "Seleccionar"}
                    </option>
                    {banks
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((b) => (
                        <option key={b.name} value={b.name}>
                          {toTitle(b.name)}
                        </option>
                      ))}
                  </Form.Select>
                  {errors.plantilla && (
                    <span className="text-danger">La plantilla es requerida</span>
                  )}
                  {banksError && (
                    <div className="text-danger small mt-1">{banksError}</div>
                  )}
                </Form.Group>

                <Form.Group className="mb-3" controlId="stock">
                  <Form.Label>Detalle</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ingresa el número de stock o detalle"
                    {...register("stock", {
                      required: true,
                      onChange: (e) =>
                        (e.target.value = e.target.value.toUpperCase()),
                    })}
                  />
                  {errors.stock && (
                    <span className="text-danger">
                      El detalle es requerido
                    </span>
                  )}
                </Form.Group>
<Form.Group className="mb-3" controlId="monto">
  <Form.Label>Monto</Form.Label>
  <Form.Control
    type="number"
    step="0.1"
    min="0"
    placeholder="Ingresa el monto"
    // se parsea a number automáticamente
    {...register("monto",  {required: true, valueAsNumber: true })}
    
  />
</Form.Group>
                
                <Form.Group className="mb-3" controlId="add_mount">
  <Form.Label>Monto extra (opcional)</Form.Label>
  <Form.Control
    type="number"
    step="0.01"
    min="0"
    placeholder="Ingresa el monto extra"
    // se parsea a number automáticamente
    {...register("add_mount", { valueAsNumber: true })}
    // deshabilita si el checkbox no está marcado
    disabled={!costosChecked}
  />
</Form.Group>
               

                 {/* Costos extras */}
        
        <input
          type="checkbox"
          {...register("costos")}
        />
        <span> Sumar costos extra? </span>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmitting || loadingBanks || nothingToSelect}
                >
                  {isSubmitting ? "Generando..." : "Generar"}
                </Button>
              </Form>

              <Button
                variant="danger"
                onClick={() => {
                  reset();
                  setDetalle("");
                }}
                className="mt-2"
              >
                Borrar
              </Button>

              <Form.Group className="mt-4" controlId="detalle">
                <Form.Label>Detalle</Form.Label>
                <Form.Control as="textarea" value={detalle} readOnly rows={6} />
              </Form.Group>
              <div className="text-muted small mt-1">
  Total estimado: <b>{totalPreview.toFixed(0)}</b>
</div>

              <div className="d-flex gap-3 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => copiarAlPortapapeles(detalle)}
                  disabled={!detalle}
                >
                  Copiar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    detalle && PrintPdf(detalle, detalle.split(" ", 6).join(" "))
                  }
                  disabled={!detalle}
                >
                  PDF
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

{/* {{{{{{{{{{{{{{}}}}}}}}}}}}}} */}
        {/* Derecha: Información del VIN */}
        <Col lg={7} xl={8}>
          <Card className="shadow-sm border-0 rounded-4 sticky-side">
            <Card.Header className="bg-white fw-semibold">
              Información del VIN
            </Card.Header>
            <Card.Body>
              <Form className="d-flex gap-2">
                <Form.Control
                  placeholder="Ingresa el # de VIN (17 caracteres)"
                  value={vinLookup}
                  onChange={(e) => setVinLookup(e.target.value.toUpperCase())}
                  maxLength={17}
                />
                <Button onClick={fetchVin} disabled={vinLoading || !vinLookup.trim()}>
                  {vinLoading ? <Spinner size="sm" animation="border" /> : "Consultar"}
                </Button>
              </Form>

              {vinError && (
                <Alert variant="danger" className="mt-3">
                  {vinError}
                </Alert>
              )}

              {!!vinInfo && (
                <div className="mt-3">
                  {"vehiculo" in vinInfo ? (
                    <Card className="border-0 shadow-xs rounded-3">
                      <Card.Body>
                        <div className="h6 mb-2">{vinInfo.vehiculo}</div>
                        <div className="text-muted small">
                          <div>
                            <b>Marca:</b> {vinInfo.make ?? "—"}
                          </div>
                          <div>
                            <b>Modelo:</b> {vinInfo.model ?? "—"}
                          </div>
                          <div>
                            <b>Año:</b> {vinInfo.year ?? "—"}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ) : (
                    <Card className="border-0 shadow-xs rounded-3">
                      <Card.Body>
                        <div className="h6 mb-2">
                          {vinInfo.make} {vinInfo.model} {vinInfo.year ?? ""}
                        </div>
                        <div className="text-muted small mb-2">
                          VIN: <b>{vinLookup}</b>
                        </div>
                        <div className="text-muted small">
                          <div>
                            <b>Cliente:</b> {vinInfo.client_id ?? "—"}
                          </div>
                          <div>
                            <b>Consignatario:</b> {vinInfo.consignatario ?? "—"}
                          </div>
                          <div>
                            <b>Fecha de compra:</b>{" "}
                            {vinInfo.buy_date
                              ? new Date(vinInfo.buy_date).toLocaleDateString()
                              : "—"}
                          </div>
                          <div>
                            <b>Pago grúa:</b> {vinInfo.tow_paid ? "Sí" : "No"}
                          </div>
                          <div>
                            <b>Pago barco:</b> {vinInfo.freight_paid ? "Sí" : "No"}
                          </div>
                          <div>
                            <b>¿Llegó?:</b> {vinInfo.arrived ? "Sí" : "No"}
                          </div>
                          <div>
                            <b>Agente:</b> {vinInfo.agent_info ?? "—"}
                          </div>
                          {!!vinInfo.note && (
                            <div>
                              <b>Notas:</b> {vinInfo.note}
                            </div>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
