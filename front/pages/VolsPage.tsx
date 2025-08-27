import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ListeVols from "../composants/ListeVols";

const fmtPrix = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(n);

export default function VolsPage() {
  const navigate = useNavigate();
  const [pageVols, setPageVols] = useState(1);

  return (
    <ListeVols
      pageVols={pageVols}
      goPageVols={setPageVols}
      fmtPrix={fmtPrix}
      navigate={navigate}
    />
  );
}
