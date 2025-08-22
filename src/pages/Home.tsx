// src/pages/Home.tsximport { Image } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import RBImage from "react-bootstrap/Image"; // <- en vez de { Image } from "react-bootstrap"
import { useAuth } from "../hooks/useAuth";
import miImagen from "../assets/inicio.svg";

export default function Home() {
  const { user } = useAuth();


type FromState = { from?: { pathname: string } };

const location = useLocation();
const state = location.state as FromState | null;
const from = state?.from?.pathname ?? "/perfil";

  return (
    <div className="text-center mt-4">
      <div className="mb-3">
        <Link to="/plantilla" className="btn btn-primary">Ir a Plantillas</Link>
        {user && (
          <Link to={from} className="btn btn-secondary ms-2">Ir a mi perfil</Link>
        )}
      </div>

      <h5 className="mb-3">Hola {user?.full_name || user?.cedula || "visitante"}</h5>
<RBImage
  src={miImagen}
  alt="Descripción de la imagen"
  fluid
  style={{ maxWidth: 500, height: "auto" }}
/>    </div>
  );
}
