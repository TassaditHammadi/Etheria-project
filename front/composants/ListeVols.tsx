// src/composants/ListeVols.tsx
import { useQuery } from "@apollo/client";
import { GET_VOLS } from "../src/graphql/vols";
import type { NavigateFunction } from "react-router-dom";

type ListeVolsProps = {
  pageVols: number;
  goPageVols: (p: number) => void;
  fmtPrix: (n: number) => string;
  navigate: NavigateFunction;
};

export default function ListeVols({
  pageVols,
  goPageVols,
  fmtPrix,
  navigate,
}: ListeVolsProps) {
  const { loading, error, data } = useQuery(GET_VOLS, {
    variables: { page: pageVols },
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Vols</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.vols?.map((vol: any) => (
          <div
            key={vol.id}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            <h3 className="text-lg font-semibold">
              {vol.depart} → {vol.destination}
            </h3>
            <p className="text-sm text-gray-600">{vol.date}</p>
            <p>{vol.compagnie}</p>
            <p className="text-blue-700 font-bold">{fmtPrix(vol.prix)}</p>

            <button
              onClick={() => navigate(`/reservation/${vol.id}`)}
              className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Réserver
            </button>
          </div>
        ))}
      </div>

      {/* ✅ pagination */}
      <div className="flex justify-between mt-6">
        <button
          disabled={pageVols === 1}
          onClick={() => goPageVols(pageVols - 1)}
          className={`px-4 py-2 rounded-lg ${
            pageVols === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          Précédent
        </button>
        <button
          onClick={() => goPageVols(pageVols + 1)}
          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
