import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Field } from "../components/ui/Field";
import { api } from "../api/client";

interface ScanResult {
  guest?: { nom: string; prenom?: string };
  accesInvite?: { statutAcces: string };
  confiscationCreated?: unknown;
}

function extractToken(rawValue: string): string {
  try {
    const url = new URL(rawValue);
    return url.searchParams.get("token") ?? rawValue;
  } catch {
    return rawValue;
  }
}

export default function CheckIn() {
  const [manualToken, setManualToken] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);

  const scanMutation = useMutation({
    mutationFn: async (token: string) => (await api.post<ScanResult>("/checkin/scan", { token })).data,
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.error ?? "QR code invalide.");
      setResult(null);
    }
  });

  useEffect(() => {
    let active = true;
    import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (!active || !scannerRef.current) return;
        const instance = new Html5Qrcode(scannerRef.current.id);
        html5QrCodeRef.current = instance;
        try {
          await instance.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            (decodedText) => {
              scanMutation.mutate(extractToken(decodedText));
            },
            () => {
              /* ignore per-frame decode failures */
            }
          );
        } catch {
          setCameraError("Caméra indisponible — utilisez la saisie manuelle ci-dessous.");
        }
      })
      .catch(() => setCameraError("Impossible de charger le scanner QR."));

    return () => {
      active = false;
      html5QrCodeRef.current?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout title="Check-in QR">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Scanner un invité</h2>
          <div id="qr-reader" ref={scannerRef} className="mx-auto w-full max-w-sm overflow-hidden rounded-lg bg-slate-900" />
          {cameraError && <p className="mt-2 text-sm text-amber-600">{cameraError}</p>}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (manualToken.trim()) scanMutation.mutate(extractToken(manualToken.trim()));
            }}
          >
            <Field label="Ou saisir le code manuellement">
              <Input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Jeton QR ou lien scanné" />
            </Field>
          </form>
          <Button onClick={() => manualToken.trim() && scanMutation.mutate(extractToken(manualToken.trim()))} disabled={scanMutation.isPending}>
            Valider
          </Button>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Résultat</h2>
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {result && (
            <div className="space-y-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="text-lg font-semibold">
                ✅ {result.guest?.nom} {result.guest?.prenom}
              </p>
              <p>Statut d'accès : {result.accesInvite?.statutAcces}</p>
              {Boolean(result.confiscationCreated) && <p>📱 Téléphone confisqué automatiquement (politique active pour cet évènement).</p>}
            </div>
          )}
          {!error && !result && <p className="text-sm text-slate-400">En attente d'un scan…</p>}
        </Card>
      </div>
    </DashboardLayout>
  );
}
