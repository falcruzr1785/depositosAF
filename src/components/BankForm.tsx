// src/components/BankForm.tsx
import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import type { Bank, BankCreate, BankUpdate } from "../types/bank";

type Common = {
  show: boolean;
  initial?: Partial<Bank>;
  onClose: () => void;
};

type CreateProps = Common & {
  mode: "create";
  onSubmit: (data: BankCreate) => Promise<void> | void;
};

type EditProps = Common & {
  mode: "edit";
  onSubmit: (data: BankUpdate) => Promise<void> | void;
};

type Props = CreateProps | EditProps;

export default function BankForm(props: Props) {
  const { show, mode, initial, onClose, onSubmit } = props;

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<Partial<Bank>>({
    defaultValues: initial,
  });

  useEffect(() => {
    reset(initial);
  }, [initial, reset]);

  // ✅ Crear banco: requiere todos los campos obligatorios
  const submitCreate: SubmitHandler<Partial<Bank>> = async (data) => {
    if (mode !== "create") return;
    const payload: BankCreate = {
      name: data.name!,
      account_number: data.account_number!,
      bank_name: data.bank_name!,
      swift_code: data.swift_code,
      routing_number: data.routing_number,
      bank_address: data.bank_address,
      legal_address: data.legal_address,
      beneficiary: data.beneficiary,
      buyer_id: data.buyer_id,
    };
    await (onSubmit as CreateProps["onSubmit"])(payload);
  };

  // ✅ Editar banco: solo manda cambios
  const submitEdit: SubmitHandler<Partial<Bank>> = async (data) => {
    if (mode !== "edit") return;

    const changes: BankUpdate = {};
    (Object.keys(data) as (keyof BankUpdate)[]).forEach((k) => {
      const newVal = data[k];
      const oldVal = initial?.[k];
      if (newVal !== undefined && newVal !== oldVal && newVal !== "") {
        changes[k] = newVal;
      }
    });

    console.log("FINAL PAYLOAD", changes); // 👈 DEBUG
    await (onSubmit as EditProps["onSubmit"])(changes);
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form
        onSubmit={handleSubmit(mode === "create" ? submitCreate : submitEdit)}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === "create" ? "Nuevo banco" : `Editar: ${initial?.name ?? ""}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Label>Nombre (clave)</Form.Label>
              <Form.Control
                {...register("name", { required: mode === "create" })}
                placeholder="copart / iaa / ..."
                disabled={mode === "edit"}
              />
              {errors.name && <div className="text-danger small">Requerido</div>}
            </Col>
            <Col md={6}>
              <Form.Label>Bank name</Form.Label>
              <Form.Control {...register("bank_name")} 
              placeholder="Nombre del banco"/>
              
            </Col>
            <Col md={6}>
              <Form.Label>Account number</Form.Label>
              <Form.Control {...register("account_number")} 
              placeholder="Numero de cuenta"/>
              
            </Col>
            <Col md={6}>
              <Form.Label>Swift</Form.Label>
              <Form.Control {...register("swift_code")} 
              placeholder="para transferencias internacionales"/>
            </Col>
            <Col md={6}>
              <Form.Label>Routing number</Form.Label>
              <Form.Control {...register("routing_number")} 
              placeholder="para transferencias internacionales"/>
            </Col>
            <Col md={6}>
              <Form.Label>Numero de comprador</Form.Label>
              <Form.Control {...register("buyer_id")} 
              placeholder=" para depositos a subastas"/>
            </Col>
            <Col md={6}>
              <Form.Label>Beneficiary</Form.Label>
              <Form.Control {...register("beneficiary")} 
              placeholder="titular de la cuenta"/>
            </Col>
            <Col md={12}>
              <Form.Label>Bank address</Form.Label>
              <Form.Control as="textarea" rows={2} {...register("bank_address")} 
              placeholder="dirección del banco"/>
            </Col>
            <Col md={12}>
              <Form.Label>Legal address</Form.Label>
              <Form.Control as="textarea" rows={2} {...register("legal_address")} 
              placeholder="dirección del titular de la cuenta"/>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {mode === "create" ? "Crear" : "Guardar"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
