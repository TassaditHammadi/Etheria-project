import { useEffect, useState } from "react";
import axios from "axios";

type Facture = {
  id: number;
  fichier_pdf: string;
  date_creation: string;
};

const Factures = () => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const res = await axios.get<Facture[]>("http://localhost:8000/api/factures/");
        if (Array.isArray(res.data)) setFactures(res.data);
        else throw new Error("Format de données inattendu");
      } catch (err) {
        console.error("Erreur lors du chargement des factures :", err);
        setError("Erreur lors du chargement des factures.");
      }
    };
    fetchFactures();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-b  via-white to-blue-50 text-gray-800">
      {/* NavBar – même style premium que Réservations */}

      {/* Titre */}
      <h2 className="text-3xl font-bold text-center text-blue-900 my-10 tracking-wide">
        Mes factures
      </h2>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        {/* Erreur */}
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 text-red-800 px-4 py-3 shadow-sm mb-6">
            {error}
          </div>
        )}

        {/* Aucune facture */}
        {!error && factures.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-500">
            Aucune facture pour le moment.
          </div>
        )}

        {/* Liste */}
        <ul className="space-y-8">
          {factures.map((facture) => (
            <li
              key={facture.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100"
            >
              {/* En-tête de carte */}
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-blue-900">Facture #{facture.id}</h3>
                <span className="text-sm font-semibold px-4 py-1 rounded-full bg-slate-200 text-slate-700">
                  PDF
                </span>
              </div>

              {/* Corps */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-slate-800">
                  <p>
                    <span className="font-semibold">Date :</span> {formatDate(facture.date_creation)}
                  </p>
                  <p className="md:text-right">
                    <span className="font-semibold">Fichier :</span> PDF
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3 md:justify-end">
                  <a
                    href={`http://localhost:8000${facture.fichier_pdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                   className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium
                       !text-white shadow bg-gradient-to-r from-blue-500 to-blue-600
                       hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                  
                    Voir le PDF
                  </a>
                  <a
                    href={`http://localhost:8000${facture.fichier_pdf}`}
                    download
                    className="inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-medium
                               bg-gray-100 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
                  >
                    Télécharger
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Factures;
