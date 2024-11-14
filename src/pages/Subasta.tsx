import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { detalleTxtAuction } from '../utils/auctionTexts';
import { copiarAlPortapapeles } from '../utils/clipboard';
import { BANK_INFO } from '../utils/bankingInfo';
import InfoVehiculo from './InfoVehiculo';
import PrintPdf from '../utils/PrintPdf';


export default function Subasta() {
  const { register, reset, handleSubmit, formState: { errors } } = useForm();
  const [detalle, setDetalle] = useState(''); // Estado para almacenar el detalle
  const onSubmit = handleSubmit((data) => {
    let detalleText = '';
    let montoFinal = data.monto;

    // Si el checkbox de costos está marcado, sumar 55 al monto
    if (data.costos) {
      montoFinal = Number(data.monto) + 55;
    }

    switch (data.subasta) {
      case 'copart':
        detalleText = BANK_INFO.copart + detalleTxtAuction(montoFinal, data.stock);
        break; // Salir del caso 'copart'

      case 'iaa':
        detalleText = BANK_INFO.iaa + detalleTxtAuction(montoFinal, data.stock);
        break; // Salir del caso 'IAA'

      default:
        detalleText = 'Subasta no especificada';
        break;
    }

    setDetalle(detalleText); // Actualizar el estado "detalle"
  });

  return (
    <div className="container mt-4">
     
      <div className="row">


 {/* Columna izquierda para InfoVehiculo */}
 <div className="col-md-4">
      {/*    <InfoVehiculo />  */}
        </div>


 {/* Columna derecha para el formulario de Subasta */}
 <div className="col-md-8">
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="subasta">
          <Form.Label>SUBASTA</Form.Label>
          <Form.Select
            {...register('subasta', { required: true })}
            className="form-control"
          >
            <option value="">Seleccionar</option>
            <option value="copart">Copart</option>
            <option value="iaa">IAA</option>
          </Form.Select>
          {errors.subasta && <span className="text-danger">Subasta es requerida</span>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="stock">
          <Form.Label>Número de Stock</Form.Label>
          <Form.Control
            type="text"
            {...register('stock', { required: true })}
            placeholder="Ingresa el número de stock"
          />
          {errors.stock && <span className="text-danger">Número de stock es requerido</span>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="monto">
          <Form.Label>Monto</Form.Label>
          <Form.Control
            type="number"
            {...register('monto', { required: true })}
            placeholder="Ingresa el monto"
          />
          {errors.monto && <span className="text-danger">El monto es requerido</span>}
        </Form.Group>

        <div className="costos mb-3">
          <Form.Check
            type="checkbox"
            {...register('costos')}
            id="costos"
            label="Marque el check para sumar costos"
          />
        </div>

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
      <Button variant="secondary" onClick={() => copiarAlPortapapeles(detalle)} className="mt-2">
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
  );
}
