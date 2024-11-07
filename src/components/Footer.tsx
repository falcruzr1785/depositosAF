import { Container, Row, Col } from 'react-bootstrap';
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="footer bg-dark text-white py-3 w-100">
      <Container>
        <Row>
          <Col className="text-center">
            <p>- Importación de vehículos -</p>
            <Link 
              to="https://www.facebook.com/autosfreddycr" 
              className="text-white" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Autos Freddy CR
            </Link>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
