// src/pages/Profile.tsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge, Button, Card, Col, Row, Spinner } from "react-bootstrap";
import { getMe, clearAuthToken } from "../utils/api";
import type { Me } from "../types/auth";

// estilos del perfil (crea src/styles/profile.css con las clases usadas)
import "../styles/profile.css";

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const u = await getMe();
      setMe(u);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      // token vencido/ausente → limpiar y enviar a login
      if (msg.startsWith("401")) {
        clearAuthToken();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const initials = (me?.full_name || me?.email || me?.cedula || "?")
    .split(" ")
    .map((s) => s.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="container py-5">
      {error && (
        <Alert variant="danger" className="mb-3">
          <div className="d-flex align-items-center gap-2">
            <strong>Error:</strong>
            <span className="flex-grow-1">{error}</span>
            <Button size="sm" variant="outline-light" onClick={load}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      <div className="profile-card">
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
          {/* Banner */}
          <div className="profile-cover" />

          {/* Header */}
          <div className="p-4 pb-0">
            <Row className="align-items-end g-3">
              <Col xs="auto">
                <div className="profile-avatar shadow-sm">
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
              </Col>

              <Col className="pb-2">
                <h4 className="mb-1">
                  {me?.full_name || "Mi perfil"}
                  {me?.is_admin && (
                    <Badge bg="primary" className="ms-2">
                      Admin
                    </Badge>
                  )}
                  {"disabled" in (me ?? {}) && (
                    <Badge
                      bg={me?.disabled ? "secondary" : "success"}
                      className="ms-2"
                    >
                      {me?.disabled ? "Inactivo" : "Activo"}
                    </Badge>
                  )}
                </h4>
                <div className="text-muted small">
                  {me?.email || "—"} · C.I. {me?.cedula || "—"}
                </div>
              </Col>

              
            </Row>
          </div>

          {/* Body */}
          <Card.Body className="pt-3">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <Spinner animation="border" />
              </div>
            ) : me ? (
              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100 border-0 rounded-3 shadow-xs">
                    <Card.Body>
                      <Card.Title className="h6">Información</Card.Title>
                      <ul className="list-unstyled mb-0 mt-3 small profile-info">
                        <li className="mb-2">
                          <span className="label">Cédula:</span>{" "}
                          <strong>{me.cedula}</strong>
                        </li>
                        <li className="mb-2">
                          <span className="label">Email:</span>{" "}
                          <strong>{me.email}</strong>
                        </li>
                        {me.full_name && (
                          <li className="mb-2">
                            <span className="label">Nombre:</span>{" "}
                            <strong>{me.full_name}</strong>
                          </li>
                        )}
                        {"is_admin" in me && (
                          <li className="mb-2">
                            <span className="label">Rol:</span>{" "}
                            <strong>
                              {me.is_admin ? "Administrador" : "Usuario"}
                            </strong>
                          </li>
                        )}
                        {"disabled" in me && (
                          <li>
                            <span className="label">Estado:</span>{" "}
                            <strong>{me.disabled ? "Inactivo" : "Activo"}</strong>
                          </li>
                        )}
                      </ul>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Alert variant="warning" className="mb-0">
                No se pudo cargar tu perfil.
              </Alert>
            )}

           
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
