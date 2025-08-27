import { useEffect, useState } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import CountryBadge from "../composants/CountryBadge";

const ME = gql`
  query {
    me { id username email countryCode }
    myDocument { file uploadedAt }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($username: String, $email: String, $countryCode: String) {
    updateProfile(username: $username, email: $email, countryCode: $countryCode) {
      user { id username email countryCode }
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($old: String!, $neu: String!) {
    changePassword(oldPassword: $old, newPassword: $neu) { ok }
  }
`;

const UPLOAD_DOC = gql`
  mutation UploadUserDocument($file: Upload!) {
    uploadUserDocument(file: $file) {
      document { file uploadedAt }
    }
  }
`;

export default function Profile() {
  const { data, loading, refetch } = useQuery(ME);
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [changePwd] = useMutation(CHANGE_PASSWORD);
  const [uploadDoc] = useMutation(UPLOAD_DOC);

  const me = data?.me;
  const doc = data?.myDocument;

  const [form, setForm] = useState({ username: "", email: "", countryCode: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pwdForm, setPwdForm] = useState({ old: "", neu: "", confirm: "" });
  const [upMsg, setUpMsg] = useState<string | null>(null);

  useEffect(() => {
    if (me) setForm({
      username: me.username || "",
      email: me.email || "",
      countryCode: me.countryCode || "",
    });
  }, [me]);

  if (loading) return <div className="p-6">Chargement…</div>;
  if (!me) {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  window.location.href = "/login";
  return null;
  }


  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    await updateProfile({ variables: form });
    setMsg("Profil mis à jour ✔");
    refetch();
  };

  const onPwdChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPwdForm({ ...pwdForm, [e.target.name]: e.target.value });

  const doChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.neu !== pwdForm.confirm) return setUpMsg("Les nouveaux mots de passe ne correspondent pas.");
    setUpMsg(null);
    const { data } = await changePwd({ variables: { old: pwdForm.old, neu: pwdForm.neu } });
    setUpMsg(data?.changePassword?.ok ? "Mot de passe changé ✔" : "Échec");
    setPwdForm({ old: "", neu: "", confirm: "" });
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUpMsg("Envoi en cours…");
    await uploadDoc({ variables: { file: f } });
    setUpMsg("Fichier envoyé ✔");
    refetch();
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mon profil</h1>
        <button
          className="underline"
          onClick={() => { localStorage.removeItem("access"); localStorage.removeItem("refresh"); location.href="/login"; }}
        >
          Se déconnecter
        </button>
      </div>

      <form onSubmit={save} className="space-y-3 border rounded p-4">
        <div>
          <label className="block text-sm">Nom d’utilisateur</label>
          <input className="w-full border rounded p-2" name="username" value={form.username} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded p-2" type="email" name="email" value={form.email} onChange={onChange} />
        </div>
        <div>
          <label className="block text-sm">Code pays (FR, CA, SN…)</label>
          <input className="w-full border rounded p-2" name="countryCode" value={form.countryCode} onChange={onChange} />
          <div className="mt-2"><CountryBadge code={form.countryCode} /></div>
        </div>
        <button className="bg-black text-white rounded px-4 py-2">Enregistrer</button>
        {msg && <div className="text-green-700 text-sm">{msg}</div>}
      </form>

      <div className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Document</h2>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={onUpload} />
        {upMsg && <div className="text-sm">{upMsg}</div>}
        {doc?.file && <a className="underline text-sm" href={doc.file} target="_blank">ouvrir</a>}
      </div>

      <div className="space-y-2 border rounded p-4">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        <form onSubmit={doChangePwd} className="space-y-2">
          <input className="w-full border rounded p-2" type="password" name="old" placeholder="Ancien mot de passe" value={pwdForm.old} onChange={onPwdChange} />
          <input className="w-full border rounded p-2" type="password" name="neu" placeholder="Nouveau mot de passe" value={pwdForm.neu} onChange={onPwdChange} />
          <input className="w-full border rounded p-2" type="password" name="confirm" placeholder="Confirmer" value={pwdForm.confirm} onChange={onPwdChange} />
          <button className="bg-black text-white rounded px-4 py-2">Mettre à jour</button>
        </form>
      </div>
    </div>
  );
}
