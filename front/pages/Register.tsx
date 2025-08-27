import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { Link, useNavigate } from "react-router-dom";

// 📌 Mutation GraphQL pour l’inscription
const REGISTER = gql`
  mutation RegisterUser(
    $username: String!
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    registerUser(
      username: $username
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
    ) {
      user {
        id
        username
      }
      token
      refreshToken
    }
  }
`;

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [registerUser, { loading }] = useMutation(REGISTER);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    try {
      const { data } = await registerUser({ variables: form });
      if (data?.registerUser?.token) {
        setOk(true);
        setTimeout(() => nav("/login"), 1000);
      } else {
        setError("Erreur inconnue lors de l’inscription.");
      }
    } catch (err: any) {
      const msg = err?.message || "Erreur réseau.";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 p-6 border rounded bg-white"
      >
        <h1 className="text-2xl font-bold">Créer un compte</h1>

        <input className="w-full border rounded p-2" name="firstName" placeholder="Prénom" onChange={onChange} required />
        <input className="w-full border rounded p-2" name="lastName" placeholder="Nom" onChange={onChange} required />
        <input className="w-full border rounded p-2" name="username" placeholder="Nom d'utilisateur" onChange={onChange} required />
        <input className="w-full border rounded p-2" type="email" name="email" placeholder="Email" onChange={onChange} required />
        <input className="w-full border rounded p-2" type="password" name="password" placeholder="Mot de passe" onChange={onChange} required />

        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-green-700 text-sm">Compte créé ! Redirection…</div>}

        <button className="w-full bg-black text-white rounded py-2" disabled={loading}>
          {loading ? "Inscription…" : "S’inscrire"}
        </button>

        <p className="text-sm">
          Déjà inscrit ? <Link className="underline" to="/login">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
