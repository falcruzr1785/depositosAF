import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useForm } from "react-hook-form";
import { copiarAlPortapapeles } from "../utils/clipboard";

export default function InfoVehiculo() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [marca, setMarca] = useState(""); // Estado para almacenar el detalle de la marca

  const onSubmit = handleSubmit(async (data) => {
    const vinData = data.vin; // VIN ingresado por el usuario
    try {
      // Llama a la API para obtener los datos
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vinData}?format=json`
      );
      const result = await response.json();


// Verificar si los datos existen, y si no, mostrar un mensaje de "Datos no encontrados"
const marcaData = result.Results?.[0]?.Make;
const yearData = result.Results?.[0]?.ModelYear;
const modelData = result.Results?.[0]?.Model;
let marcaCompleta = "Datos no encontrados";
      // Procesa y establece la marca usando el primer resultado devuelto
      if (marcaData && yearData && modelData ) {
        marcaCompleta = `${marcaData || ""} ${modelData || ""} ${yearData || ""}`;
      } 
      
      setMarca(marcaCompleta);

    {
      /* Mostrar el detalle en una alerta */
    }
    Swal.fire({
      title: "Información del vehiculo",
      icon: "info",
      text: marcaCompleta,
      showCancelButton: true,
      confirmButtonText: "Copiar",
      cancelButtonText: "Cerrar",
      allowOutsideClick: true, // Permite cerrar la alerta haciendo clic fuera de ella
    }).then((result) => {
      if (result.value) {
        copiarAlPortapapeles(marcaCompleta);
      }
    });
  } catch (error) {
    console.error("Error al consultar la API:", error);
    setMarca("Error al obtener datos");
  }
  });

  return (
    <div className="container mt-1">
      <Form onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="vin">
          <Form.Label className="text-muted, fst-italic">Ingresa el # de vin para verificar el vehículo </Form.Label>
          <Form.Control
            type="text"
            {...register("vin", { required: true })}
            placeholder="Ingresa el numero de vin"
          />
          {errors.vin && (
            <span className="text-danger">El vin es requerido</span>
          )}
         </Form.Group>
          {/* Botón para enviar el formulario */}
          <Form.Group className="mb-3" controlId="comprobar">
          <Button variant="primary" type="submit">
            Comprobar
          </Button>
          </Form.Group>
        

        <Form.Group className="mb-3" controlId="borrar">
          {/* Botón para borrar el inputs */}
          <Button
            variant="danger"
            onClick={() => {
              reset();
            }}
            className="mt-2"
          >
            Borrar
          </Button>

        </Form.Group>

      </Form>
    </div>
  );
}
