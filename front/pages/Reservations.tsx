import { useEffect, useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Link, useLocation } from 'react-router-dom';

const GET_RESERVATIONS = gql`
  query {
    reservations {
      id
      nom
      prenom
      email
      destination
      dateVoyage
      nombrePersonnes
      statut
      dateReservation
    }
  }
`;

interface Reservation {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  destination: string;
  dateVoyage: string;           // YYYY-MM-DD
  nombrePersonnes: number;
  statut: string;
  dateReservation: string;      // ISO
}

const Reservations = () => {
  const location = useLocation();
  const [banner, setBanner] = useState<string | null>(null);

  // Forcer réseau au premier rendu
  const { loading, error, data, refetch } = useQuery(GET_RESERVATIONS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  });

  // Refetch au montage
  useEffect(() => { refetch(); }, [refetch]);

  // Refetch quand on revient sur l’onglet
  useEffect(() => {
    const onFocus = () => refetch();
    const onVisible = () => { if (document.visibilityState === 'visible') refetch(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refetch]);

  // Bandeau succès (?paid=1) après redirection backend
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('paid') === '1') {
      setBanner('Paiement réussi : la réservation a été mise à jour.');
      const url = new URL(window.location.href);
      url.searchParams.delete('paid');
      window.history.replaceState({}, '', url.toString());
    }
  }, [location.search]);

  if (loading) return <p className="text-center text-blue-700 mt-8">Chargement...</p>;
  if (error) return <p className="text-center text-red-600 mt-8">Erreur : {error.message}</p>;

  const reservations: Reservation[] = data?.reservations ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b via-white to-blue-50 text-gray-800">


      {/* Bandeau succès */}
      {banner && (
        <div className="max-w-4xl mx-auto mt-6 px-4">
          <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 text-green-800 px-4 py-3 shadow-sm">
            <span>{banner}</span>
            <button onClick={() => setBanner(null)} className="text-sm font-semibold hover:underline">Fermer</button>
          </div>
        </div>
      )}

      {/* Titre */}
      <h2 className="text-3xl font-bold text-center text-blue-900 my-10 tracking-wide">Mes réservations</h2>

      {/* Cartes */}
      <div className="space-y-8 max-w-4xl mx-auto px-4">
        {reservations.map((res) => (
          <div
            key={res.id}
            className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100"
          >
            {/* Bandeau destination + statut (forcé PAYÉE) */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-blue-900">{res.destination}</h3>
              <span className="text-sm font-semibold px-4 py-1 rounded-full bg-green-200 text-green-800">
                PAYÉE
              </span>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 py-4 text-base">
              <p><strong>Nom :</strong> {res.nom}</p>
              <p><strong>Prénom :</strong> {res.prenom}</p>
              <p><strong>Email :</strong> {res.email}</p>
              <p><strong>Date du voyage :</strong> {res.dateVoyage}</p>
              <p><strong>Nombre de personnes :</strong> {res.nombrePersonnes}</p>
              <p><strong>Date de réservation :</strong> {new Date(res.dateReservation).toLocaleString()}</p>
            </div>

            {/* Actions : uniquement Annuler */}
            <div className="flex justify-end gap-4 px-6 pb-6">
              <Link
                to={`/annulation/${res.id}/${encodeURIComponent(res.dateVoyage)}`}
                className="bg-gradient-to-r from-red-400 to-red-500 text-white px-5 py-2 rounded-lg shadow hover:from-red-500 hover:to-red-600 transition"
              >
                Annuler
              </Link>
            </div>
          </div>
        ))}

        {reservations.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-slate-500">
            Aucune réservation pour le moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
