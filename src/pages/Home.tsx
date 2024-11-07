import { Image } from 'react-bootstrap';
import miImagen from '../assets/inicio.svg';

export default function Inicio() {
  return (
    <div className="text-center mt-4">
      <Image 
        src={miImagen} 
        alt="Descripción de la imagen" 
        fluid // Esto hace que la imagen sea responsiva
        width="500" 
        height="auto" 
        className="imagen-inicio" 
      />
    </div>
  );
}
