import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { Field, Input } from "../components/ui/Field";
import { Button } from "../components/ui/Button";

export default function Rsvp() {
  const { reservationId } = useParams<{ reservationId: string }>();
  const [form, setForm] = useState({ nomPrenom: "", numeroTelephone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post(`/public/rsvp/${reservationId}`, form);
      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-3xl">💌</div>
          <h1 className="mt-2 text-xl font-semibold text-slate-800">Confirmez votre présence</h1>
        </div>
        {submitted ? (
          <p className="text-center text-sm text-emerald-600">Merci ! Votre réponse a bien été enregistrée.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <Field label="Nom et prénom">
              <Input required value={form.nomPrenom} onChange={(e) => setForm((f) => ({ ...f, nomPrenom: e.target.value }))} />
            </Field>
            <Field label="Téléphone">
              <Input value={form.numeroTelephone} onChange={(e) => setForm((f) => ({ ...f, numeroTelephone: e.target.value }))} />
            </Field>
            {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full">
              Confirmer
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
