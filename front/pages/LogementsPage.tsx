import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ListeLogements from "../composants/ListeLogements";

const fmtPrix = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);

export default function LogementsPage() {
  const navigate = useNavigate();
  const [pageLogs, setPageLogs] = useState(1);

  return (
    <ListeLogements
      pageLogs={pageLogs}
      goPageLogs={setPageLogs}
      fmtPrix={fmtPrix}
      navigate={navigate}
    />
  );
}
