import { Form, InputGroup, Button } from "react-bootstrap";
import { useId } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  loading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  clearLabel?: string;
};

export default function VinSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  loading = false,
  placeholder = "Ingresa el VIN…",
  submitLabel = "Comprobar",
  clearLabel = "Borrar",
}: Props) {
  const id = useId();

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Form.Label htmlFor={id} className="mb-2 fw-semibold">
        Ingresa el # de VIN para verificar el vehículo
      </Form.Label>

      <InputGroup className="mb-2">
        <Form.Control
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        />
        <Button variant="primary" type="submit" disabled={loading || !value.trim()}>
          {submitLabel}
        </Button>
        <Button variant="outline-danger" onClick={onClear} disabled={loading && !value}>
          {clearLabel}
        </Button>
      </InputGroup>
    </Form>
  );
}
