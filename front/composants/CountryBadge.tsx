import { useEffect, useState } from "react";
import { fetchCountry } from "../src/utils/restCountries";

export default function CountryBadge({ code }: { code: string }) {
  const [c, setC] = useState<null | {
    name: string; capital?: string; region?: string; flagPng?: string; flagAlt?: string;
  }>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setErr(null);
    if (!code) return;
    fetchCountry(code.toUpperCase())
      .then((d) => { if (alive) setC(d); })
      .catch((e) => setErr(e.message));
    return () => { alive = false; };
  }, [code]);

  if (!code) return null;
  if (err) return <span className="text-sm text-red-600">Pays invalide</span>;
  if (!c) return <span className="text-sm">Chargement pays…</span>;

  return (
    <div className="flex items-center gap-2 text-sm">
      {c.flagPng && <img src={c.flagPng} alt={c.flagAlt || c.name} className="h-4 w-6 object-cover border rounded" />}
      <span>{c.name}{c.capital ? ` — ${c.capital}` : ""}{c.region ? ` (${c.region})` : ""}</span>
    </div>
  );
}
