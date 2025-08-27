// src/pages/Success.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Success = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirection automatique après 2 secondes
    const timer = setTimeout(() => {
      navigate('/reservations');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="text-center mt-10">
      <h2 className="text-2xl font-semibold text-green-600">Paiement réussi !</h2>
      <p className="mt-4">Redirection vers vos réservations...</p>
    </div>
  );
};

export default Success;
