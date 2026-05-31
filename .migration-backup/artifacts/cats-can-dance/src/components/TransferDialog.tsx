/**
 * TransferDialog — initiate a face-value ticket transfer.
 * Shows who the ticket is being sent to, confirms, then calls /api/ticketing/tickets/:token/transfer.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { initiateTransfer } from "@/lib/ticketing-api";

type Props = {
  ticket: {
    id: string;
    qr_token: string;
    tier_name: string;
    event_title?: string;
    transfer_count: number;
  };
  onClose: () => void;
  onSuccess: () => void;
};

export default function TransferDialog({ ticket, onClose, onSuccess }: Props) {
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) { toast.error("Recipient email required"); return; }
    setBusy(true);
    try {
      await initiateTransfer(ticket.qr_token, { to_email: toEmail.toLowerCase().trim(), to_name: toName.trim() || undefined });
      setSent(true);
      toast.success("Transfer link sent!");
    } catch (err: any) {
      toast.error(err.message ?? "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="bg-cream border-4 border-ink chunk-shadow-lg max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-ink uppercase">Transfer Ticket</DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="space-y-4">
            <div className="bg-lime border-4 border-ink p-5">
              <p className="font-display text-xl text-ink uppercase mb-1">Transfer link sent!</p>
              <p className="text-ink/70 text-sm">
                We've emailed <strong>{toEmail}</strong> with a claim link. They have 24 hours to accept.
                Your ticket is held until they confirm.
              </p>
            </div>
            <div className="bg-acid-yellow/20 border-2 border-ink/20 p-3 text-xs text-ink/60">
              <p className="font-display text-[10px] uppercase text-ink/40 mb-1">Face-value transfer policy</p>
              Tickets transfer at their original price only — no scalping. CCD monitors transfer chains and will void tickets sold above face value.
            </div>
            <button onClick={onSuccess} className="w-full bg-ink text-cream font-display py-3 border-4 border-ink hover:bg-magenta transition-colors">
              DONE
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Ticket recap */}
            <div className="bg-ink/5 border-2 border-ink/20 px-4 py-3">
              <p className="font-display text-sm text-ink uppercase">{ticket.tier_name}</p>
              <p className="text-ink/50 text-xs">{ticket.event_title ?? "—"}</p>
              <p className="text-ink/40 text-[10px] mt-1">Transfers used: {ticket.transfer_count}/3</p>
            </div>

            <div>
              <label className="block font-display text-sm text-ink mb-1">RECIPIENT EMAIL *</label>
              <input
                required type="email"
                value={toEmail}
                onChange={e => setToEmail(e.target.value)}
                placeholder="friend@email.com"
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
              />
            </div>
            <div>
              <label className="block font-display text-sm text-ink mb-1">RECIPIENT NAME <span className="font-normal text-ink/40 text-xs">(optional)</span></label>
              <input
                value={toName}
                onChange={e => setToName(e.target.value)}
                placeholder="Their name"
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow"
              />
            </div>

            <div className="bg-acid-yellow/20 border-2 border-ink/20 p-3 text-xs text-ink/60">
              <strong className="font-display text-[10px] uppercase text-ink block mb-1">How it works</strong>
              We'll email them a claim link valid for 24 hours. Once they claim it, your original ticket is voided and a new one is issued to them. Face-value only — no resale.
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={busy}
                className="flex-1 bg-magenta text-cream font-display text-base py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-60">
                {busy ? "SENDING…" : "SEND TRANSFER →"}
              </button>
              <button type="button" onClick={onClose}
                className="bg-cream text-ink font-display text-sm py-3 px-4 border-4 border-ink hover:bg-acid-yellow transition-colors">
                CANCEL
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
