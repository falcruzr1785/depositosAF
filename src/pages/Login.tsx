// src/pages/Login.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getAuthToken, clearAuthToken } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

type FormValues = { cedula: string; password: string };

export default function Login() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>();
  const [authed, setAuthed] = useState<boolean>(!!getAuthToken());
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const from = (location.state )?.from?.pathname ?? "/perfil"; // destino por defecto

  const onSubmit = async ({ cedula, password }: FormValues) => {
    try {
      await login(cedula, password);
      navigate("/", { replace: true }); // ⬅️ directo a Inicio
      setAuthed(true);
      Swal.fire({ icon: "success", title: "Sesión iniciada", timer: 1400, showConfirmButton: false });
      navigate(from, { replace: true });        // << redirección
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      Swal.fire({ icon: "error", title: "Error al iniciar sesión", text: message });
    }
  };

  const logout = () => {
    clearAuthToken();
    setAuthed(false);
    Swal.fire({ icon: "success", title: "Sesión cerrada", timer: 900, showConfirmButton: false });
    navigate("/login", { replace: true });
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 420 }}>
      <h3 className="mb-3">Iniciar sesión</h3>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Form.Group className="mb-3">
          <Form.Label>Cédula</Form.Label>
          <Form.Control placeholder="206930242" {...register("cedula", { required: true })} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Contraseña</Form.Label>
          <Form.Control type="password" placeholder="••••••••" {...register("password", { required: true })} />
        </Form.Group>
        <div className="d-flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
          {authed && (
            <Button variant="secondary" type="button" onClick={logout}>
              Cerrar sesión
            </Button>
          )}
        </div>
      </Form>
      <div className="mt-3">
        <small className="text-muted">Estado: {authed ? "autenticado ✅" : "no autenticado"}</small>
      </div>
    </div>
  );
}
