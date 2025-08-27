import { useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';

const GET_RESERVATION = gql`
  query GetReservation($id: ID!) {
    reservation(id: $id) {
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

const DELETE_RESERVATION = gql`
  mutation DeleteReservation($id: ID!) {
    deleteReservation(id: $id) {
      ok
    }
  }
`;

const UPDATE_RESERVATION = gql`
  mutation UpdateReservation(
    $id: ID!
    $nom: String
    $prenom: String
    $email: String
    $nombrePersonnes: Int
    $statut: String
  ) {
    updateReservation(
      id: $id
      nom: $nom
      prenom: $prenom
      email: $email
      nombrePersonnes: $nombrePersonnes
      statut: $statut
    ) {
      reservation { id statut }
    }
  }
`;

const ReservationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_RESERVATION, {
    variables: { id: String(id) },
  });

  const [deleteReservation] = useMutation(DELETE_RESERVATION);
  const [updateReservation] = useMutation(UPDATE_RESERVATION);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    nombrePersonnes: 1,
  });

  const handleDelete = async () => {
    await deleteReservation({ variables: { id: String(id) } });
    navigate('/reservations');
  };

  const handleEdit = () => {
    const r = data!.reservation;
    setFormData({
      nom: r.nom,
      prenom: r.prenom,
      email: r.email,
      nombrePersonnes: r.nombrePersonnes,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    await updateReservation({
      variables: {
        id: String(id),
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        nombrePersonnes: formData.nombrePersonnes,
      },
    });
    await refetch();
    setIsEditing(false);
  };

  const handleConfirm = async () => {
    try {
      const resp = await fetch('http://127.0.0.1:8000/create-checkout-session/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: id }),
      });
      const payload = await resp.json();
      if (payload?.url) {
        window.location.href = payload.url;
      } else {
        alert("Impossible d’ouvrir le paiement Stripe.");
        console.error('Stripe payload:', payload);
      }
    } catch (e) {
      console.error('Erreur de redirection Stripe:', e);
      alert('Erreur lors de la redirection vers le paiement.');
    }
  };

  if (loading) return <p className="text-center text-blue-700 mt-10">Chargement…</p>;
  if (error) return <p className="text-center text-red-600 mt-10">Erreur : {error.message}</p>;
  if (!data?.reservation) return <p className="text-center text-red-500 mt-10">Aucune réservation.</p>;

  const r = data.reservation;
  const badge =
    r.statut === 'PAYEE'
      ? { text: 'PAYÉE', cls: 'bg-green-200 text-green-800' }
      : r.statut === 'CONFIRMEE'
      ? { text: 'CONFIRMÉE', cls: 'bg-yellow-200 text-yellow-800' }
      : { text: r.statut || '—', cls: 'bg-slate-200 text-slate-700' };

  return (
    <div className="min-h-screen bg-[#f9fbfd] text-gray-800">

      {/* Titre */}
      <h2 className="text-3xl font-bold text-blue-800 text-center my-10">Détail de la réservation</h2>

      {/* Carte */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-3xl shadow-xl border border-blue-50 overflow-hidden">
          {/* Header carte */}
          <div className="bg-blue-100 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              ✈️ {r.destination}
            </h3>
            <span className={`text-sm font-semibold px-4 py-1 rounded-full ${badge.cls}`}>
              {badge.text}
            </span>
          </div>

          {/* Contenu */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bloc gauche */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Nom</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{r.nom}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{r.email}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Nombre de personnes</p>
                  {isEditing ? (
                    <input
                      type="number"
                      min={1}
                      value={formData.nombrePersonnes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nombrePersonnes: Math.max(1, parseInt(e.target.value || '1')),
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{r.nombrePersonnes}</p>
                  )}
                </div>
              </div>

              {/* Bloc droit */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Prénom</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  ) : (
                    <p className="text-slate-900 font-medium">{r.prenom}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Date du voyage</p>
                  <p className="text-slate-900 font-medium">{r.dateVoyage}</p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Date de réservation</p>
                  <p className="text-slate-900 font-medium">
                    {new Date(r.dateReservation).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
              <button
                onClick={() => navigate('/reservations')}
                className="rounded-2xl px-5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                Retour
              </button>

              <button
                onClick={handleConfirm}
                className="rounded-2xl px-5 py-2 bg-yellow-400 text-yellow-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 shadow-sm"
              >
                Confirmer (payer)
              </button>

              <button
                onClick={handleDelete}
                className="rounded-2xl px-5 py-2 bg-red-100 text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                Annuler
              </button>

              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="rounded-2xl px-5 py-2 bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm"
                  >
                    Sauvegarder
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-2xl px-5 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    Annuler la modification
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="rounded-2xl px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetail;
