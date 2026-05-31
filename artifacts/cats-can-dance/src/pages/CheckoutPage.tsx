/**
 * CheckoutPage — /checkout/[orderId]
 * Used for payment links sent by promoters after RSVP approval.
 * Also handles direct-sale orders that need a dedicated payment page.
 */
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import Confetti from "@/components/Confetti";
import { getPaymentLinkDetails, verifyOrder } from "@/lib/ticketing-api";

declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { orderId, token } = useParams<{ orderId?: string; token?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [step, setStep] = useState<"pay" | "processing" | "success" | "error">("pay");
  const [burst, setBurst] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) return;
    getPaymentLinkDetails(token as string).then(d => {
      setOrder(d.order);
      setEvent(d.event);
      setItems(d.items ?? []);
      setLoading(false);
    }).catch(e => {
      setErr(e.message ?? "Invalid or expired payment link");
      setLoading(false);
      setStep("error");
    });
  }, [token]);

  const loadRazorpay = (): Promise<boolean> => new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handlePay = async () => {
    if (!order) return;
    setStep("processing");

    try {
      // Create / get Razorpay order  — for payment link flow, order already has razorpay_order_id
      // If not, create one via /api/ticketing/orders
      let rzpOrderId = order.razorpay_order_id;
      if (!rzpOrderId) {
        const res = await fetch("/api/ticketing/orders/razorpay-refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.id }),
        }).then(r => r.json());
        rzpOrderId = res.razorpay_order_id;
      }

      const loaded = await loadRazorpay();
      if (!loaded) { toast.error("Payment gateway failed to load"); setStep("pay"); return; }

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_DUMMY_KEY_ID",
        amount: order.total_paise,
        currency: "INR",
        name: "Cats Can Dance",
        description: event?.title ?? "Ticket Purchase",
        order_id: rzpOrderId,
        prefill: { name: order.buyer_name, email: order.buyer_email },
        theme: { color: "#e040fb" },
        handler: async (response: any) => {
          try {
            await verifyOrder(order.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setBurst(true);
            setStep("success");
          } catch {
            toast.error("Payment verification failed. Email us at hello@catscandance.com with your payment ID: " + response.razorpay_payment_id);
            setStep("pay");
          }
        },
        modal: { ondismiss: () => setStep("pay") },
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message);
      setStep("pay");
    }
  };

  if (!token && !orderId) return (
    <div className="min-h-screen bg-cream"><Nav />
      <div className="container py-24 text-center"><p className="font-display text-2xl text-ink">Invalid checkout link</p></div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      <Confetti active={burst} />
      <div className="container max-w-lg py-16 md:py-24">

        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-ink border-t-magenta rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display text-ink/40 text-sm uppercase animate-pulse">Loading…</p>
          </div>
        )}

        {step === "error" && (
          <div className="border-4 border-ink bg-cream p-8 text-center">
            <p className="font-display text-4xl text-magenta mb-3">LINK EXPIRED</p>
            <p className="text-ink/70 mb-6">{err}</p>
            <a href="/events" className="inline-block bg-ink text-cream font-display px-6 py-3 border-4 border-ink chunk-shadow">SEE ALL EVENTS →</a>
          </div>
        )}

        {!loading && step !== "error" && order && (
          <>
            {/* Event card */}
            <div className="bg-magenta text-cream border-4 border-ink chunk-shadow p-6 mb-6">
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ YOUR RSVP WAS APPROVED</p>
              <h1 className="font-display text-4xl uppercase leading-tight mb-2">{event?.title ?? "Event"}</h1>
              <p className="font-display text-lg">{event?.date} · {event?.venue}</p>
            </div>

            {/* Order summary */}
            <div className="border-4 border-ink bg-cream p-5 mb-6">
              <p className="font-display text-sm uppercase text-ink mb-3">/ ORDER SUMMARY</p>
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between py-2 border-b border-ink/10 text-sm last:border-b-0">
                  <span className="font-medium text-ink">{item.tier_name} × {item.quantity}</span>
                  <span className="text-ink/70">₹{(item.total_paise / 100).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {order.buyer_fee_paise > 0 && (
                <div className="flex justify-between text-xs text-ink/50 pt-2">
                  <span>Service fee (5%)</span><span>₹{(order.buyer_fee_paise / 100).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-lg border-t-2 border-ink mt-2 pt-2">
                <span className="uppercase">Total</span>
                <span>₹{(order.total_paise / 100).toLocaleString("en-IN")}</span>
              </div>
              <p className="text-ink/40 text-xs mt-2">For: {order.buyer_name} · {order.buyer_email}</p>
            </div>

            {step === "pay" && (
              <button onClick={handlePay}
                className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                PAY ₹{(order.total_paise / 100).toLocaleString("en-IN")} →
              </button>
            )}

            {step === "processing" && (
              <div className="flex items-center justify-center gap-3 py-6">
                <div className="w-8 h-8 border-4 border-ink border-t-magenta rounded-full animate-spin" />
                <p className="font-display text-ink uppercase">Opening payment…</p>
              </div>
            )}

            {step === "success" && (
              <div className="bg-lime border-4 border-ink p-6 text-center">
                <p className="font-display text-5xl text-ink mb-2">✓</p>
                <p className="font-display text-2xl text-ink uppercase mb-2">Payment confirmed!</p>
                <p className="text-ink/70 mb-5">Your tickets have been sent to {order.buyer_email}.</p>
                <a href="/my-tickets" className="inline-block bg-ink text-cream font-display px-6 py-3 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform">
                  VIEW MY TICKETS →
                </a>
              </div>
            )}

            <p className="text-ink/30 text-[10px] text-center mt-4">Secured by Razorpay · UPI, Cards, Netbanking</p>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
