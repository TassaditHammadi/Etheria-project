import { useQuery } from "@apollo/client";
import { GET_LOGEMENTS } from "../src/graphql/logements";
import type { NavigateFunction } from "react-router-dom";

type ListeLogementsProps = {
  pageLogs: number;
  goPageLogs: (p: number) => void;
  fmtPrix: (n: number) => string;
  navigate: NavigateFunction;
};

export default function ListeLogements({
  pageLogs,
  goPageLogs,
  fmtPrix,
  navigate,
}: ListeLogementsProps) {
  const { loading, error, data } = useQuery(GET_LOGEMENTS, {
    variables: { page: pageLogs },
  });

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error.message}</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Logements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.logements?.map((logement: any) => (
          <div
            key={logement.id}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            <img
              src={logement.image}
              alt={logement.nom}
              className="w-full h-40 object-cover rounded-md mb-3"
            />
            <h3 className="text-lg font-semibold">{logement.nom}</h3>
            <p>{fmtPrix(logement.prix)} / nuit</p>
            <p>
              {logement.ville} • {logement.etoiles} ★
            </p>
            <p>Capacité {logement.capacite}</p>

            {/* ✅ bouton réserver */}
            <button
              onClick={() => navigate(`/reservation/${logement.id}`)}
              className="mt-3 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Réserver
            </button>
          </div>
        ))}
      </div>

      {/* pagination */}
      <div className="flex justify-between mt-6">
        <button
          disabled={pageLogs === 1}
          onClick={() => goPageLogs(pageLogs - 1)}
          className={`px-4 py-2 rounded-lg ${
            pageLogs === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          Précédent
        </button>
        <button
          onClick={() => goPageLogs(pageLogs + 1)}
          className="px-4 py-2 rounded-lg bg-blue-100 text-blue-600"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
