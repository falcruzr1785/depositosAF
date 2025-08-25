// src/components/Navbar.tsx
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import { useAuth } from "../hooks/useAuth";

export default function AppNavbar() {
  const [expanded, setExpanded] = useState(false);
  const { user, logout } = useAuth(); // <- viene de tu AuthContext
  const navigate = useNavigate();

  const handleSelect = () => setExpanded(false);

  const handleLogout = () => {
    logout(); // limpia token y user en el contexto
    Swal.fire({
      icon: "success",
      title: "Sesión cerrada",
      timer: 900,
      showConfirmButton: false,
    });
    navigate("/login", { replace: true });
  };

  const isLogged = !!user;
  const userLabel = user?.full_name || "Usuario";

  return (
    <Navbar
      bg="light"
      expand="lg"
      expanded={expanded}
      onToggle={(n) => setExpanded(n)}
      className="mb-3 w-100"
    >
      {/* Marca */}
      <Navbar.Brand as={Link} to="/" onClick={handleSelect}>
        Inicio
      </Navbar.Brand>

      {/* Botón toggle en pantallas pequeñas */}
      <Navbar.Toggle
        aria-controls="main-navbar"
        onClick={() => setExpanded((e) => !e)}
      />

      <Navbar.Collapse id="main-navbar">
        {/* Menú lado izquierdo */}
        <Nav className="me-auto" onSelect={handleSelect}>
          <Nav.Link as={NavLink} to="/plantilla" end>
            Plantilla
          </Nav.Link>

          <Nav.Link as={NavLink} to="/infovehiculo" end>
            Info vehículo
          </Nav.Link>
          {isLogged && (
          <>
          <NavDropdown title="Reportes" id="reportes-dropdown" autoClose="outside">
            <NavDropdown.Item as={NavLink} to="/reports/VehiculosPorCliente" onClick={handleSelect}>
              Vehiculos de Cliente
            </NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/reports/ListadoTotalVehiculos" onClick={handleSelect}>
              Listado Total de Vehiculos
            </NavDropdown.Item>
          </NavDropdown>

          <NavDropdown title="Depósitos" id="depositos-dropdown" autoClose="outside">
            <NavDropdown.Item as={NavLink} to="/plantilla" onClick={handleSelect}>
              Plantilla
            </NavDropdown.Item>
          </NavDropdown>

          <NavDropdown title="Administración" id="admin-dropdown" autoClose="outside">
            <NavDropdown.Item as={NavLink} to="/admin/bancos" onClick={handleSelect}>
              Bancos
            </NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/admin/clientes" onClick={handleSelect}>
              Clientes
            </NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/admin/usuarios" onClick={handleSelect}>
              Usuarios
            </NavDropdown.Item>
            <NavDropdown.Item as={NavLink} to="/admin/vehiculos" onClick={handleSelect}>
              Vehículos(ingresar nuevos)
            </NavDropdown.Item>
          </NavDropdown>
          </>
          )}
        </Nav>

        {/* Menú usuario lado derecho */}
        <Nav className="ms-auto" onSelect={handleSelect}>
          <NavDropdown align="end" title={userLabel} id="user-dropdown" autoClose="outside">
            <NavDropdown.Item as={NavLink} to="/perfil" onClick={handleSelect}>
              Perfil
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleLogout}>
              Cerrar sesión
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}
