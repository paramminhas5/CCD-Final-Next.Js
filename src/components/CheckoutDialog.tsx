/**
 * CheckoutDialog — handles both "buy now" and "RSVP" flows.
 *
 * direct_sale:  collect buyer info → createOrder → load Razorpay script → open checkout → verifyOrder
 * rsvp_invite:  collect buyer info → POST /api/event-rsvp → show confirmation
 * free:         collect buyer info → createOrder (free) → tickets issued immediately
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import { createOrder, verifyOrder } from "@/lib/ticketing-api";

declare global {
  interface Window { Razorpay: any; }
}

type TierSelection = { tier: { id: string; name: string; price_inr: number; is_free: boolean }; quantity: number };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventSlug: string;
  eventTitle: string;
  eventDate?: string;
  mode: "direct_sale" | "rsvp_invite" | "free_rsvp";
  isFree: boolean;
  selections: TierSelection[];
  razorpayKeyId: string;
};

type Step = "info" | "processing" | "success" | "rsvp_success";

export default function CheckoutDialog({
  open, onOpenChange, eventSlug, eventTitle, eventDate, mode, isFree, selections, razorpayKeyId,
}: Props) {
  const [step, setStep] = useState<Step>("info");
  const [burst, setBurst] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [orderId, setOrderId] = useState("");
  const [qrTokens, setQrTokens] = useState<string[]>([]);

  const reset = () => { setStep("info"); setForm({ name: "", email: "", phone: "" }); setOrderId(""); setQrTokens([]); };
  const close = () => { reset(); onOpenChange(false); };

  const totalQty = selections.reduce((a, s) => a + s.quantity, 0);
  const subtotal = selections.reduce((a, s) => a + s.tier.price_inr * s.quantity, 0);
  const buyerFee = isFree || subtotal === 0 ? 0 : Math.round(subtotal * 0.05);
  const grandTotal = subtotal + buyerFee;

  const loadRazorpay = (): Promise<boolean> => new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Name and email required"); return; }

    setStep("processing");

    // RSVP-only flow (rsvp_invite mode, paid event) — save RSVP via Express API
    if (mode === "rsvp_invite" && !isFree) {
      try {
        await fetch("/api/event-rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_slug: eventSlug,
            name: form.name,
            email: form.email,
            plus_ones: Math.max(0, totalQty - 1),
          }),
        });
        setBurst(true); setTimeout(() => setBurst(false), 1500);
        setStep("rsvp_success");
      } catch {
        toast.error("RSVP failed — please try again");
        setStep("info");
      }
      return;
    }

    // Free or direct sale — create order
    try {
      const orderRes = await createOrder({
        event_slug: eventSlug,
        buyer_name: form.name,
        buyer_email: form.email.toLowerCase(),
        buyer_phone: form.phone || undefined,
        items: selections.map(s => ({ tier_id: s.tier.id, quantity: s.quantity })),
      });

      // Free ticket — issued immediately
      if (orderRes.free) {
        setOrderId(orderRes.order_id);
        if (orderRes.qr_tokens?.length) setQrTokens(orderRes.qr_tokens as string[]);
        setBurst(true); setTimeout(() => setBurst(false), 1500);
        setStep("success");
        return;
      }

      // Paid — launch Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Payment gateway failed to load. Check your connection."); setStep("info"); return; }

      const rzp = new window.Razorpay({
        key: razorpayKeyId || "rzp_test_DUMMY_KEY_ID",
        amount: orderRes.amount_paise,
        currency: "INR",
        name: "Cats Can Dance",
        description: eventTitle,
        order_id: orderRes.razorpay_order_id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#e040fb" },
        handler: async (response: any) => {
          try {
            await verifyOrder(orderRes.order_id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setOrderId(orderRes.order_id);
            setBurst(true); setTimeout(() => setBurst(false), 1500);
            setStep("success");
          } catch {
            toast.error("Payment verification failed. Contact support with your payment ID: " + response.razorpay_payment_id);
            setStep("info");
          }
        },
        modal: {
          ondismiss: () => { toast("Payment cancelled — your selection is still held for 10 min."); setStep("info"); },
        },
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message ?? "Order creation failed");
      setStep("info");
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) close(); }}>
      <DialogContent className="bg-cream border-4 border-ink chunk-shadow-lg max-w-md">
        <Confetti active={burst} />
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-ink uppercase">
            {step === "success" ? "YOU'RE IN." : step === "rsvp_success" ? "RSVP SENT." : mode === "rsvp_invite" && !isFree ? "RSVP FOR TICKETS" : isFree || subtotal === 0 ? "RESERVE TICKETS" : "BUY TICKETS"}
          </DialogTitle>
        </DialogHeader>

        {/* Order summary (info step) */}
        {step === "info" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selections recap */}
            <div className="bg-ink/5 border-2 border-ink/20 p-3 space-y-1">
              {selections.map(s => (
                <div key={s.tier.id} className="flex justify-between text-sm">
                  <span className="font-medium text-ink">{s.tier.name} × {s.quantity}</span>
                  <span className="text-ink/70">
                    {s.tier.is_free || s.tier.price_inr === 0 ? "FREE" : `₹${(s.tier.price_inr * s.quantity).toLocaleString("en-IN")}`}
                  </span>
                </div>
              ))}
              {buyerFee > 0 && (
                <div className="flex justify-between text-xs text-ink/50 border-t border-ink/10 pt-1 mt-1">
                  <span>Service fee (5%)</span><span>₹{buyerFee.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-base border-t-2 border-ink/20 pt-2 mt-1">
                <span className="text-ink uppercase">Total</span>
                <span className="text-ink">{grandTotal === 0 ? "FREE" : `₹${grandTotal.toLocaleString("en-IN")}`}</span>
              </div>
            </div>

            <div>
              <label className="font-display text-sm text-ink mb-1 block">NAME</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={120}
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
            </div>
            <div>
              <label className="font-display text-sm text-ink mb-1 block">EMAIL</label>
              <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255}
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
            </div>
            <div>
              <label className="font-display text-sm text-ink mb-1 block">PHONE <span className="font-normal text-ink/40">(optional)</span></label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={15}
                className="w-full bg-cream text-ink border-4 border-ink px-4 py-3 font-medium focus:outline-none focus:bg-acid-yellow" />
            </div>

            <button type="submit"
              className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
              {mode === "rsvp_invite" && !isFree ? "SEND RSVP REQUEST →" : grandTotal === 0 ? "CONFIRM FREE TICKETS →" : `PAY ₹${grandTotal.toLocaleString("en-IN")} →`}
            </button>
            <p className="text-ink/40 text-[10px] text-center">Secured by Razorpay · UPI, Cards, Netbanking accepted</p>
          </form>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 border-4 border-ink border-t-magenta rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display text-ink text-lg uppercase animate-pulse">Processing…</p>
          </div>
        )}

        {/* Success — tickets issued */}
        {step === "success" && (
          <div className="space-y-4">
            <div className="bg-lime border-4 border-ink p-5">
              <p className="font-display text-2xl text-ink uppercase mb-1">Tickets confirmed!</p>
              <p className="text-ink/70 text-sm">
                {qrTokens.length
                  ? "Your tickets are below — save these links or screenshot this screen."
                  : "Check your email for your QR tickets. Show them at the door."}
              </p>
            </div>
            {/* Inline QR links when no email (RESEND_API_KEY not set) */}
            {qrTokens.length > 0 && (
              <div className="space-y-2">
                {qrTokens.map((token, i) => (
                  <a key={token} href={`/my-tickets/${token}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between border-2 border-ink px-4 py-3 bg-acid-yellow/20 hover:bg-acid-yellow transition-colors">
                    <span className="font-display text-xs text-ink uppercase">Ticket {i + 1} — View QR →</span>
                    <span className="font-mono text-[9px] text-ink/40 truncate max-w-[120px]">{token.slice(0, 12)}…</span>
                  </a>
                ))}
                <p className="text-[10px] text-ink/40 text-center">Bookmark these links — they are your tickets</p>
              </div>
            )}
            <div className="flex gap-3">
              <a href="/my-tickets" className="flex-1 bg-ink text-cream font-display text-base py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform text-center">
                VIEW MY TICKETS →
              </a>
              <button onClick={close} className="bg-cream text-ink font-display text-sm py-3 px-4 border-4 border-ink hover:bg-acid-yellow transition-colors">CLOSE</button>
            </div>
          </div>
        )}

        {/* RSVP submitted */}
        {step === "rsvp_success" && (
          <div className="space-y-4">
            <div className="bg-acid-yellow border-4 border-ink p-5">
              <p className="font-display text-2xl text-ink uppercase mb-1">RSVP received!</p>
              <p className="text-ink/80 text-sm">The promoter will review your request. If approved, you'll get a payment link at <strong>{form.email}</strong> within 48 hours.</p>
            </div>
            <button onClick={close} className="w-full bg-ink text-cream font-display text-base py-3 border-4 border-ink hover:bg-magenta transition-colors">GOT IT →</button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
