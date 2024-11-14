import { Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light w-100">
      <div className="container-fluid">
        {/* Logo o enlace inicial */}
        <Link className="navbar-brand" to="/">Inicio</Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNavDropdown" 
          aria-controls="navbarNavDropdown" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav ms-auto"> {/* `ms-auto` alinea esta lista a la derecha */}
            <li className="nav-item dropdown">
              <button 
                className="nav-link dropdown-toggle" 
                id="navbarDropdownMenuLink" 
                role="button" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                type="button"
              >
                Depósitos
              </button>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                <li><Link className="dropdown-item" to="/Naviera">Navieras</Link></li>
                <li><Link className="dropdown-item" to="/Subasta">Subastas</Link></li>
              </ul>
            </li>
          </ul> 
        </div>
      </div>
       {/* Versión del programa */}
       <span style={{ fontSize: '0.4em', color: '#888', position: 'absolute', bottom: '5px', right: '10px' }}>
        v1.2
      </span>
    </nav>
  );
}

export default Navbar;
