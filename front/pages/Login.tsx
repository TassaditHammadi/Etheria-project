import { useState } from "react";
import { gql, useMutation, useApolloClient } from "@apollo/client";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../src/auth";

const HYBRID_LOGIN = gql`
  mutation HybridLogin($username: String!, $password: String!) {
    hybridLogin(username: $username, password: $password) {
      token
      refreshToken
      source
      user { id username email }
    }
  }
`;

export default function Login() {
  const nav = useNavigate();
  const apollo = useApolloClient();
  const { setToken } = useAuth(); // Ajouté pour MAJ du contexte global

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [login, { loading }] = useMutation(HYBRID_LOGIN);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const variables = {
        username: form.username.trim(),
        password: form.password,
      };

      const { data, errors } = await login({ variables });

      if (errors?.length) {
        throw new Error(errors.map((er) => er.message).join("\n"));
      }

      const token = data?.hybridLogin?.token;
      const refresh = data?.hybridLogin?.refreshToken;

      if (!token) throw new Error("Pas de token reçu.");

      // 1) MAJ du contexte Auth
      setToken(token);
      if (refresh) localStorage.setItem("refresh", refresh);

      // 2) Reset Apollo pour relancer les queries dépendant de l’auth
      await apollo.clearStore();
      await apollo.resetStore();

      // 3) Redirection
      nav("/");
    } catch (err: any) {
      setError(err?.message || "Connexion impossible");
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 p-6 border rounded bg-white">
        <h1 className="text-2xl font-bold">Connexion</h1>

        <div>
          <label className="block text-sm">Nom d’utilisateur</label>
          <input
            className="w-full border rounded p-2"
            name="username"
            value={form.username}
            onChange={onChange}
            required
            autoComplete="username"
          />
        </div>

        <div>
          <label className="block text-sm">Mot de passe</label>
          <input
            className="w-full border rounded p-2"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <div className="text-red-600 text-sm whitespace-pre-line">{error}</div>}

        <button className="w-full bg-black text-white rounded py-2 disabled:opacity-60" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-sm">
          Pas de compte ? <Link className="underline" to="/register">Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}
