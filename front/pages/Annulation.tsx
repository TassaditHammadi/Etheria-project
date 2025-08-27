// src/pages/Annulation.tsx
import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gql, useMutation } from '@apollo/client';

const DELETE_RESERVATION = gql`
  mutation DeleteReservation($id: ID!) {
    deleteReservation(id: $id) { ok }
  }
`;

const Annulation = () => {
  const { id, date } = useParams();
  const navigate = useNavigate();
  const [deleteReservation] = useMutation(DELETE_RESERVATION);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Toujours appeler les hooks (pas de return avant)
  const decoded = useMemo(() => {
    try { return date ? decodeURIComponent(date) : ""; } catch { return date || ""; }
  }, [date]);

  const dateVoyage = useMemo(() => {
    if (!decoded) return null;
    let d = new Date(decoded);
    if (isNaN(d.getTime())) {
      const parts = decoded.split("-");
      if (parts.length === 3) {
        const [y, m, day] = parts.map(Number);
        if (y && m && day) d = new Date(y, m - 1, day);
      }
    }
    return isNaN(d.getTime()) ? null : d;
  }, [decoded]);

  const now = new Date();
  const diffHeures = dateVoyage ? (dateVoyage.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;
  const remboursable = dateVoyage ? diffHeures >= 48 : false;

  const handleConfirmAnnulation = async () => {
    setErrMsg(null);
    if (!id) {
      setErrMsg("ID manquant.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await deleteReservation({ variables: { id } });
      if (data?.deleteReservation?.ok) {
        navigate('/reservations');
      } else {
        setErrMsg("Impossible d'annuler la réservation.");
        setLoading(false);
      }
    } catch (error: any) {
      setErrMsg(error?.message || 'Erreur lors de la suppression.');
      setLoading(false);
    }
  };

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });

  // Rendu
  if (!id || !date || !dateVoyage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-bold text-lg">
          Erreur : ID ou date invalide dans l’URL.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-lg w-full text-center">
        <p className="text-sm text-slate-500 mb-2">
          Date du voyage : <strong>{fmt(dateVoyage)}</strong>
        </p>

        {remboursable ? (
          <>
            <h2 className="text-xl font-bold text-green-600 mb-4">Remboursement en cours</h2>
            <p className="text-gray-700 mb-6">
              La réservation sera annulée avec remboursement.<br />
              Vous recevrez le montant sur le moyen de paiement utilisé sous 3 jours ouvrables.
            </p>
            <button
              onClick={handleConfirmAnnulation}
              disabled={loading}
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition disabled:opacity-60"
            >
              {loading ? 'Traitement…' : 'Confirmer l’annulation'}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-4">Annulation sans remboursement</h2>
            <p className="text-gray-700 mb-6">
              Cette réservation est à moins de 48h du départ ({Math.max(0, Math.floor(diffHeures))}h restantes).<br />
              L’annulation se fera <strong>sans remboursement</strong>. Confirmer ?
            </p>
            <button
              onClick={handleConfirmAnnulation}
              disabled={loading}
              className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition disabled:opacity-60"
            >
              {loading ? 'Traitement…' : 'Oui, annuler sans remboursement'}
            </button>
          </>
        )}

        {errMsg && (
          <p className="mt-4 text-sm text-red-600">
            {errMsg}
          </p>
        )}
      </div>
    </div>
  );
};

export default Annulation;
