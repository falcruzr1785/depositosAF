///src/pages/admin/Bancos.tsx

import { useEffect, useMemo, useState } from "react";
import { Button, Table, Form, Badge, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { listBanks, createBank, updateBank, deleteBank } from "../../utils/api";
import type { Bank } from "../../types/bank";
import BankForm from "../../components/BankForm";
import { useAuth } from "../../hooks/useAuth"; // para proteger por admin

export default function BancosAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<{mode:"create"|"edit"; data?: Bank} | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listBanks()
      .then(b => alive && setItems(b))
      .catch(e => Swal.fire({icon:"error", title:"Error", text: e instanceof Error ? e.message : String(e)}))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(b =>
      b.name.toLowerCase().includes(s) ||
      (b.bank_name ?? "").toLowerCase().includes(s) ||
      (b.account_number ?? "").toLowerCase().includes(s)
    );
  }, [items, q]);

  if (!user?.is_admin) {
    return <div className="container mt-4">No autorizado</div>;
  }

  const toTitle = (s: string) => s.replace(/\b\p{L}/gu, m => m.toLocaleUpperCase("es"));

  const refresh = async () => {
    setLoading(true);
    try { setItems(await listBanks()); }
    finally { setLoading(false); }
  };
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
  async function handleCreate(data: Bank | Partial<Bank>) {
    try {
      await createBank(data as Bank);
      setModal(null);
      await refresh();
      Swal.fire({icon:"success", title:"Creado"});
    } catch (err: unknown) {
  Swal.fire({ icon: "error", title: "Error", text: getErrorMessage(err) });
}
  }

  async function handleEdit(data: Partial<Bank>) {
    if (!modal?.data?.name) return;
    try {
      await updateBank(modal.data.name, data);
      setModal(null);
      await refresh();
      Swal.fire({icon:"success", title:"Actualizado"});
    } catch (err: unknown) {
  Swal.fire({ icon: "error", title: "Error", text: getErrorMessage(err) });
}
  }

  async function handleDelete(name: string) {
    const r = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar "${name}"?`,
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      confirmButtonColor: "#d33",
    });
    if (!r.isConfirmed) return;
    try {
      await deleteBank(name);
      await refresh();
      Swal.fire({icon:"success", title:"Eliminado"});
    } catch (err: unknown) {
  Swal.fire({ icon: "error", title: "Error", text: getErrorMessage(err) });
}
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Bancos</h3>
        <div className="d-flex gap-2">
          <Form.Control
            size="sm"
            placeholder="Buscar…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <Button size="sm" onClick={() => setModal({mode:"create"})}>
            + Nuevo
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-5 text-center">
          <Spinner animation="border" /> Cargando…
        </div>
      ) : (
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre (clave)</th>
              <th>Bank name</th>
              <th>Cuenta</th>
              <th>SWIFT</th>
              <th>Routing</th>
              <th>Beneficiario</th>
              <th>BuyerId</th>
              <th>Direcciones</th>
              <th style={{width: 160}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.name}>
                <td><Badge bg="secondary">{toTitle(b.name)}</Badge></td>
                <td>{b.bank_name || "-"}</td>
                <td>{b.account_number || "-"}</td>
                <td>{b.swift_code || "-"}</td>
                <td>{b.routing_number || "-"}</td>
                <td>{b.beneficiary || "-"}</td>
                <td>{b.buyer_id || "-"}</td>
                <td className="small">
                  {b.bank_address && <div><b>Bank:</b> {b.bank_address}</div>}
                  {b.legal_address && <div><b>Legal:</b> {b.legal_address}</div>}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-primary"
                      onClick={() => setModal({mode:"edit", data: b})}
                    >
                      Editar
                    </Button>
                    <Button size="sm" variant="outline-danger"
                      onClick={() => handleDelete(b.name)}
                    >
                      Borrar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-muted">Sin resultados</td></tr>
            )}
          </tbody>
        </Table>
      )}

      {modal && (
        <BankForm
          show
          mode={modal.mode}
          initial={modal.data}
          onClose={() => setModal(null)}
          onSubmit={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}
    </div>
  );
}
