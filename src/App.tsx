// src/App.tsx
import { Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import Plantilla from "./pages/Plantilla";
import InfoVehiculo from "./pages/InfoVehiculo";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import BancosAdmin from "./pages/admin/Bancos";
import UsuariosAdmin from "./pages/admin/Usuarios";
import ClientesAdmin from "./pages/admin/Clientes";
import VehiculosAdmin from "./pages/admin/Vehiculos";
import VehiculosPorCliente from "./pages/reports/VehiculosPorCliente";
import Private from "./routes/Private";     // <- guard: requiere login
import AdminOnly from "./routes/AdminOnly"; // <- guard: requiere admin
import "./App.css";
import ListadoTotalVehiculos from "./pages/reports/ListadoTotalVehiculos";

export default function App() {
  return (
    <Routes>
      {/* Páginas sin layout (por ejemplo, Login sin navbar/footer) */}
      <Route path="/login" element={<Login />} />

      {/* Todo lo demás va dentro del Layout */}
      <Route element={<Layout />}>
        {/* Inicio */}
        <Route index element={<Home />} />

        {/* Públicas */}
        <Route path="plantilla" element={<Plantilla />} />
        <Route path="infovehiculo" element={<InfoVehiculo />} />

        {/* Privadas (requiere estar logueado) */}
        <Route element={<Private />}>
          <Route path="perfil" element={<Profile />} />
          <Route path="reports/VehiculosPorCliente" element={<VehiculosPorCliente />} />
          <Route path="reports/ListadoTotalVehiculos" element={<ListadoTotalVehiculos />} />  

          {/* Solo admin dentro de las privadas */}
          <Route element={<AdminOnly />}>
          < Route path="admin/bancos" element={<BancosAdmin />} />
          <Route path="admin/usuarios" element={<UsuariosAdmin />} />
          <Route path="admin/clientes" element={<ClientesAdmin />} />
           <Route path="admin/vehiculos" element={<VehiculosAdmin />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}
