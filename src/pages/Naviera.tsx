import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useForm } from 'react-hook-form';
import { detalleTxtTransport } from '../utils/auctionTexts';
import { copiarAlPortapapeles } from '../utils/clipboard';
import { BANK_INFO } from '../utils/bankingInfo';

export default function Naviera() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [detalle, setDetalle] = useState(''); // Estado para almacenar el detalle

  const onSubmit = handleSubmit((data) => {
    let detalleText = '';
    let montoFinal = data.monto;

    // Si el checkbox de costos está marcado, sumar 55 al monto
    if (data.costos) {
      montoFinal = Number(data.monto) + 55;
    }

    switch (data.naviera) {
      case 'atm':
        detalleText = BANK_INFO.atm + detalleTxtTransport(montoFinal, data.idDetalle);
        break;
      case 'na':
        detalleText = BANK_INFO.na + detalleTxtTransport(montoFinal, data.idDetalle);
        break;
      default:
        detalleText = 'Subasta no especificada';
        break;
    }

    setDetalle(detalleText); // Actualizar el estado "detalle"
  });

  return (
    <div className="container mt-4">
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="naviera">
          <Form.Label>NAVIERA</Form.Label>
          <Form.Select
            {...register('naviera', { required: true })}
            className="form-control"
          >
            <option value="">Seleccionar</option>
            <option value="na">NorthAtlantic</option>
            <option value="atm">ATM</option>
          </Form.Select>
          {errors.naviera && <span className="text-danger">Naviera es requerida</span>}
        </Form.Group>

        <Form.Group className="mb-3" controlId="idDetalle">
          <Form.Label>Detalle</Form.Label>
          <Form.Control
            type="text"
            {...register('idDetalle', { required: true })}
            placeholder="Ingresa el detalle"
          />
          {errors.idDetalle && <span className="text-danger">Detalle es requerido</span>}
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

        {/* Botón para enviar el formulario */}
        <Button variant="primary" type="submit">
          Generar
        </Button>
      </Form>

      {/* Campo de texto que despliega el detalle */}
      <Form.Group className="mt-4" controlId="detalle">
        <Form.Label>Detalle</Form.Label>
        <Form.Control as="textarea" value={detalle} readOnly rows={3} />
      </Form.Group>

      {/* Botón para copiar el detalle */}
      <Button variant="secondary" onClick={() => copiarAlPortapapeles(detalle)} className="mt-2">
        Copiar
      </Button>
    </div>
  );
}
