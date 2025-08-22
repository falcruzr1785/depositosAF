import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useForm } from 'react-hook-form';

import { copiarAlPortapapeles } from '../utils/clipboard';

import PrintPdf from '../utils/PrintPdf';
import InfoVehiculo from './InfoVehiculo';


export default function Naviera() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [detalle, setDetalle] = useState(''); // Estado para almacenar el detalle

  const onSubmit = handleSubmit((data) => {
    let detalleText = '';
  



    switch (data.naviera) {
      case 'atm':
       
        break;
      case 'na':
    
        break;
      default:
        detalleText = 'Subasta no especificada';
        break;
    }

    setDetalle(detalleText); // Actualizar el estado "detalle"
  })
  
  ;

  return (
    <div className="container mt-4">

<div className="row">

{/* Columna izquierda para InfoVehiculo */}
<div className="col-md-4">
          <InfoVehiculo />
        </div>


{/* Columna derecha para el formulario de Subasta */}
<div className="col-md-8">
<div className="oval-shadow p-4">
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="naviera">
          <Form.Label>NAVIERA</Form.Label>
          <Form.Select
            {...register("naviera", { required: true })}
            className="form-control"
          >
            <option value="">Seleccionar</option>
            <option value="na">NorthAtlantic</option>
            <option value="atm">ATM</option>
          </Form.Select>
          {errors.naviera && (
            <span className="text-danger">Naviera es requerida</span>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="idDetalle">
          <Form.Label>Detalle</Form.Label>
          <Form.Control
            type="text"
            {...register("idDetalle", { required: true })}
            placeholder="Ingresa el detalle"
          />
          {errors.idDetalle && (
            <span className="text-danger">Detalle es requerido</span>
          )}
        </Form.Group>

        <Form.Group className="mb-3" controlId="monto">
          <Form.Label>Monto</Form.Label>
          <Form.Control
            type="number"
            {...register("monto", { required: true })}
            placeholder="Ingresa el monto"
          />
          {errors.monto && (
            <span className="text-danger">El monto es requerido</span>
          )}
        </Form.Group>

        {/* Botón para enviar el formulario */}
        <Button variant="primary" type="submit">
          Generar
        </Button>
      
      </Form>

        {/* Botón para borrar el inputs */}
        <Button variant="danger" onClick={() => {reset(); setDetalle('') } } className="mt-2">
        Borrar
      </Button>

      {/* Campo de texto que despliega el detalle */}
      <Form.Group className="mt-4" controlId="detalle">
        <Form.Label>Detalle</Form.Label>
        <Form.Control as="textarea" value={detalle} readOnly rows={3} />
      </Form.Group>


      <div className="d-flex gap-3 mt-2">
      {/* Botón para copiar el detalle */}
      <Button
        variant="secondary"
        onClick={() => copiarAlPortapapeles(detalle)}
        className="mt-2"
      >
        Copiar
      </Button>
      
      {/*para imprimir el detalle */}
      <Button variant="secondary" 
      onClick={() => PrintPdf(detalle,  ` ${detalle.split(" ",6)}`)} className="mt-2">
            pdf
          </Button>
          </div>
          </div>
          </div>
    </div>
    </div>
  );
}
