import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar"; // ajusta la ruta si cambia

export default function Layout() {
  return (
    <>
      {/* Barra fija arriba */}
      <header className="navbar fixed-top p-0">
        <Navbar />
        {/* Si no usas <Navbar/>, puedes dejar tu <nav> simple aquí */}
      </header>

      {/* Contenido principal (queda debajo del header y encima del footer) */}
      <main className="main-content container-fluid">
        <Outlet />
      </main>

      {/* Footer fijo abajo */}
      <footer className="footer fixed-bottom">
        © Depósitos AF
      </footer>
    </>
  );
}
