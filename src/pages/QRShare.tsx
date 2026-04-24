import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Plus, Trash2, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getMyQRShares, createQRShare, revokeQRShare, type QRShare } from '@/lib/storage';
import { getSession } from '@/lib/auth';

export default function QRSharePage() {
  const navigate = useNavigate();
  const session = getSession();
  const [shares, setShares] = useState<QRShare[]>([]);

  const reload = () => setShares(getMyQRShares());
  useEffect(() => {
    reload();
    const i = setInterval(reload, 30000);
    return () => clearInterval(i);
  }, []);

  if (!session) return null;

  const create = () => {
    createQRShare(session.userId);
    reload();
  };

  const remaining = (s: QRShare) => {
    const ms = new Date(s.expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expiré';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}min`;
  };

  const buildUrl = (token: string) => `${window.location.origin}/partage/${token}`;

  return (
    <div className="pb-24 px-5 pt-6 max-w-[480px] mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4 active:scale-[0.97]">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>
      <h1 className="font-heading text-2xl font-bold text-foreground animate-fade-in">Partage QR Code</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Génère un QR code temporaire (24h) pour qu'un médecin accède à ton dossier en consultation.
      </p>

      <button
        onClick={create}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
      >
        <Plus className="h-5 w-5" />
        Générer un nouveau QR code
      </button>

      <div className="mt-6 space-y-4">
        {shares.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center">
            <QrCode className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Aucun QR code actif</p>
          </div>
        ) : (
          shares.map((s, i) => (
            <div
              key={s.token}
              className="rounded-2xl border-2 border-border bg-card p-4 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-col items-center">
                <div className="rounded-xl bg-white p-3 border-2 border-border">
                  <QRCodeSVG value={buildUrl(s.token)} size={180} level="M" />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-warning text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  Expire dans {remaining(s)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 text-center break-all">
                  Token : {s.token.slice(0, 12)}…
                </p>
                <button
                  onClick={() => { revokeQRShare(s.token); reload(); }}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border-2 border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-semibold text-destructive active:scale-[0.96]"
                >
                  <Trash2 className="h-3 w-3" /> Révoquer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
