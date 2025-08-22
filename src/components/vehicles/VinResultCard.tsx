//vehicles/VinResultCard.tsx
import { Card, Badge } from "react-bootstrap";

export type VinResult = {
  vehiculo?: string;
  make?: string;
  model?: string;
  year?: number;
};

type Props = {
  data: VinResult | null;
};

export default function VinResultCard({ data }: Props) {
  if (!data) return null;

  const title =
    [data.make, data.model, data.year].filter(Boolean).join(" ") || data.vehiculo || "Resultado";

  return (
    <Card className="shadow-sm border-10 rounded-20">
      <Card.Body>
        <Card.Title className="h6 d-flex align-items-center gap-2">
          {title}
          {!!data.year && <Badge bg="secondary">{data.year}</Badge>}
        </Card.Title>

        <ul className="list-unstyled small mb-0 mt-2">
          {data.make && (
            <li>
              <span className="text-muted">Marca:</span> <strong>{data.make}</strong>
            </li>
          )}
          {data.model && (
            <li>
              <span className="text-muted">Modelo:</span> <strong>{data.model}</strong>
            </li>
          )}
          {typeof data.year === "number" && (
            <li>
              <span className="text-muted">Año:</span> <strong>{data.year}</strong>
            </li>
          )}
          {data.vehiculo && (
            <li>
              <span className="text-muted">Etiqueta:</span> <strong>{data.vehiculo}</strong>
            </li>
          )}
        </ul>
      </Card.Body>
    </Card>
  );
}
