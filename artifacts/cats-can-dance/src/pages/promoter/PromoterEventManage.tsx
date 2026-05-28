/**
 * PromoterEventManage — /promoter/events/[slug]
 * Tabs: Overview (sales chart) | Tickets (tiers) | RSVPs | Check-in (QR scanner)
 */
import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useParams } from "@/lib/compat-router";
import { useSafeUser } from "@/lib/clerk-safe";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-shim";
import {
  getPromoterOrders, getPromoterRsvps, approveRsvp, declineRsvp,
  doorCheckin, createTier, updateTier, deleteTier,
} from "@/lib/ticketing-api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";


type Tab = "overview" | "tickets" | "rsvps" | "checkin";

export default function PromoterEventManage() {
  const { slug = "" } = useParams();
  const { user, isLoaded } = useSafeUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [event, setEvent] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New tier form
  const [tierForm, setTierForm] = useState({ name: "", price_inr: "", capacity: "", is_free: false });
  const [tierBusy, setTierBusy] = useState(false);

  // Check-in
  const [scanInput, setScanInput] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanBusy, setScanBusy] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const [evData, ordData, rsvpData] = await Promise.all([
        supabase.from("events").select("*").eq("slug", slug).maybeSingle().then(r => r.data),
        getPromoterOrders(slug),
        getPromoterRsvps(slug),
      ]);
      setEvent(evData);
      setOrders(ordData.orders ?? []);
      setTiers(ordData.tiers ?? []);
      setSummary(ordData.summary ?? null);
      setRsvps(rsvpData.rsvps ?? []);
    } catch (e: any) {
      toast.error("Failed to load event data: " + e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isLoaded && user && slug) load(); }, [isLoaded, user, slug]);

  const handleApprove = async (rsvpId: string) => {
    try {
      await approveRsvp(rsvpId);
      toast.success("RSVP approved — payment link sent");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDecline = async (rsvpId: string) => {
    const reason = prompt("Reason for declining (optional):");
    try {
      await declineRsvp(rsvpId, { reason: reason ?? undefined });
      toast.success("RSVP declined");
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleScan = async () => {
    if (!scanInput.trim()) return;
    setScanBusy(true);
    try {
      const result = await doorCheckin({ qr_token: scanInput.trim() });
      setScanResult(result);
      setScanInput("");
      scanRef.current?.focus();
    } catch (e: any) { setScanResult({ result: "error", message: e.message }); }
    finally { setScanBusy(false); }
  };

  const addTier = async () => {
    if (!tierForm.name) { toast.error("Tier name required"); return; }
    setTierBusy(true);
    try {
      const res = await createTier(slug, {
        ...tierForm,
        price_inr: tierForm.is_free ? 0 : (parseInt(tierForm.price_inr) || 0),
        capacity: tierForm.capacity ? parseInt(tierForm.capacity) : null,
      });
      setTiers(t => [...t, res.tier]);
      setTierForm({ name: "", price_inr: "", capacity: "", is_free: false });
      toast.success("Tier added");
    } catch (e: any) { toast.error(e.message); }
    finally { setTierBusy(false); }
  };

  const removeTier = async (tierId: string, tierName: string) => {
    if (!confirm(`Delete tier "${tierName}"?`)) return;
    try {
      await deleteTier(tierId);
      setTiers(t => t.filter(x => x.id !== tierId));
      toast.success("Tier deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  // Build hourly sales chart data
  const chartData = orders
    .filter(o => o.status === "paid" || o.status === "complimentary")
    .reduce((acc: Record<string, number>, o) => {
      const h = new Date(o.paid_at ?? o.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      acc[h] = (acc[h] ?? 0) + o.subtotal_paise / 100;
      return acc;
    }, {});
  const chartArr = Object.entries(chartData).map(([date, revenue]) => ({ date, revenue }));

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "tickets", label: `Tickets (${tiers.length})` },
    { key: "rsvps", label: `RSVPs (${rsvps.filter(r => !r.extension || r.extension.status === "pending").length} pending)` },
    { key: "checkin", label: "Door / Check-in" },
  ];

  if (!isLoaded || loading) return <div className="min-h-screen bg-cream"><Nav /></div>;


  return (
    <div className="min-h-screen bg-cream">
      <Nav />
      {/* Header */}
      <div className="bg-ink border-b-4 border-ink pt-[72px]">
        <div className="container py-6">
          <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-1">/ PROMOTER PORTAL</p>
          <h1 className="font-display text-4xl text-cream uppercase">{event?.title ?? slug}</h1>
          <p className="text-cream/40 text-sm mt-1">{event?.date} · {event?.venue}</p>
        </div>
        <div className="container">
          <div className="flex overflow-x-auto">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`font-display text-xs uppercase px-5 py-4 border-r border-cream/10 whitespace-nowrap transition-colors ${tab === t.key ? "bg-cream text-ink" : "text-cream/50 hover:text-cream hover:bg-cream/10"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-10 max-w-5xl">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* Summary cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border-4 border-ink">
                {[
                  { label: "Tickets Sold", value: summary.tickets_sold },
                  { label: "Gross Revenue", value: `₹${summary.gross_inr?.toLocaleString("en-IN") ?? 0}` },
                  { label: "CCD Fees", value: `₹${((summary.buyer_fees_inr ?? 0) + (summary.promoter_fees_inr ?? 0)).toLocaleString("en-IN")}` },
                  { label: "Your Payout", value: `₹${summary.net_payout_inr?.toLocaleString("en-IN") ?? 0}` },
                ].map(s => (
                  <div key={s.label} className="bg-cream p-5">
                    <p className="font-display text-3xl text-ink">{s.value}</p>
                    <p className="font-display text-[10px] uppercase tracking-widest text-ink/40 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sales chart */}
            {chartArr.length > 0 && (
              <div className="border-4 border-ink p-5">
                <p className="font-display text-sm uppercase text-ink mb-4">/ REVENUE BY DAY</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartArr}>
                    <XAxis dataKey="date" tick={{ fontFamily: "monospace", fontSize: 10 }} />
                    <YAxis tick={{ fontFamily: "monospace", fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                    <Bar dataKey="revenue" fill="#e040fb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent orders */}
            <div>
              <p className="font-display text-sm uppercase text-ink mb-3">/ RECENT ORDERS</p>
              {orders.length === 0 ? (
                <p className="text-ink/40 text-sm">No orders yet.</p>
              ) : (
                <div className="border-4 border-ink overflow-hidden">
                  <div className="bg-ink text-cream grid grid-cols-4 px-4 py-2 font-display text-[10px] uppercase">
                    <span className="col-span-2">Buyer</span><span>Amount</span><span>Status</span>
                  </div>
                  {orders.slice(0, 15).map(o => (
                    <div key={o.id} className="grid grid-cols-4 items-center px-4 py-3 border-t border-ink/10">
                      <div className="col-span-2">
                        <p className="font-display text-xs text-ink truncate">{o.buyer_name}</p>
                        <p className="text-[10px] text-ink/40 truncate">{o.buyer_email}</p>
                      </div>
                      <p className="text-sm font-medium text-ink">₹{(o.total_paise / 100).toLocaleString("en-IN")}</p>
                      <span className={`font-display text-[10px] uppercase px-2 py-0.5 w-fit ${o.status === "paid" ? "bg-lime text-ink" : o.status === "pending" ? "bg-acid-yellow text-ink" : o.status === "refunded" ? "bg-magenta text-cream" : "bg-ink/10 text-ink"}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TICKETS ── */}
        {tab === "tickets" && (
          <div className="space-y-6">
            <p className="font-display text-sm uppercase text-ink/50">Manage ticket tiers for this event. CCD takes 5% from buyer + 5% from you on each transaction.</p>

            {tiers.length > 0 && (
              <div className="space-y-3">
                {tiers.map(t => (
                  <div key={t.id} className="border-4 border-ink p-5 bg-cream flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-lg text-ink uppercase">{t.name}</p>
                      <p className="text-ink/50 text-sm">{t.is_free ? "FREE" : `₹${t.price_inr} + 5% buyer fee`} · {t.sold} sold{t.capacity ? ` / ${t.capacity}` : ""}</p>
                      {t.description && <p className="text-ink/40 text-xs mt-1">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-display text-[10px] uppercase px-2 py-0.5 border-2 border-ink ${t.status === "active" ? "bg-lime text-ink" : "bg-ink/10 text-ink/50"}`}>{t.status}</span>
                      {t.sold === 0 && (
                        <button onClick={() => removeTier(t.id, t.name)}
                          className="font-display text-[10px] uppercase px-2 py-1 border-2 border-ink text-ink hover:bg-magenta hover:text-cream transition-colors">
                          DELETE
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add tier */}
            <div className="border-4 border-dashed border-ink/30 p-6 space-y-4">
              <p className="font-display text-sm uppercase text-ink">+ ADD TIER</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div><label className="block font-display text-[10px] uppercase text-ink mb-1">NAME *</label>
                  <input value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} placeholder="General Admission" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow" /></div>
                <div><label className="block font-display text-[10px] uppercase text-ink mb-1">PRICE (₹)</label>
                  <input type="number" disabled={tierForm.is_free} value={tierForm.price_inr} onChange={e => setTierForm(f => ({ ...f, price_inr: e.target.value }))} placeholder="500" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow disabled:opacity-40" /></div>
                <div><label className="block font-display text-[10px] uppercase text-ink mb-1">CAPACITY</label>
                  <input type="number" value={tierForm.capacity} onChange={e => setTierForm(f => ({ ...f, capacity: e.target.value }))} placeholder="100" className="w-full bg-cream text-ink border-4 border-ink px-3 py-2 text-sm focus:outline-none focus:bg-acid-yellow" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={tierForm.is_free} onChange={e => setTierForm(f => ({ ...f, is_free: e.target.checked }))} />
                <span className="font-display text-xs uppercase text-ink">Free / Comp</span>
              </label>
              <button onClick={addTier} disabled={tierBusy} className="bg-ink text-cream font-display text-sm uppercase px-5 py-3 border-4 border-ink hover:bg-magenta transition-colors disabled:opacity-60">
                {tierBusy ? "ADDING…" : "+ ADD TIER"}
              </button>
            </div>
          </div>
        )}

        {/* ── RSVPs ── */}
        {tab === "rsvps" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-sm uppercase text-ink">{rsvps.length} RSVPs total · {rsvps.filter(r => !r.extension || r.extension.status === "pending").length} awaiting decision</p>
              <button onClick={() => {
                const csv = ["name,email,plus_ones,status,created_at",
                  ...rsvps.map(r => `"${r.name}","${r.email}",${r.plus_ones},"${r.extension?.status ?? "pending"}","${r.created_at}"`)
                ].join("\n");
                const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `rsvps-${slug}.csv`; a.click();
              }} className="font-display text-xs uppercase bg-ink text-cream px-3 py-2 border-4 border-ink hover:bg-acid-yellow hover:text-ink transition-colors">
                ↓ EXPORT CSV
              </button>
            </div>
            {rsvps.length === 0 ? <p className="text-ink/40 text-sm">No RSVPs yet.</p> : (
              <div className="space-y-2">
                {rsvps.map(r => {
                  const ext = r.extension;
                  const status = ext?.status ?? "pending";
                  const statusColors: Record<string, string> = { pending: "bg-acid-yellow text-ink", approved: "bg-electric-blue text-cream", paid: "bg-lime text-ink", declined: "bg-ink/20 text-ink/50", expired: "bg-ink/10 text-ink/30" };
                  return (
                    <div key={r.id} className={`border-4 p-4 ${status === "pending" ? "border-acid-yellow" : "border-ink/20"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display text-base text-ink uppercase">{r.name}</p>
                            {r.plus_ones > 0 && <span className="font-display text-[10px] bg-ink/10 text-ink px-2 py-0.5">+{r.plus_ones}</span>}
                            <span className={`font-display text-[10px] uppercase px-2 py-0.5 ${statusColors[status] ?? "bg-ink/10 text-ink"}`}>{status}</span>
                          </div>
                          <p className="text-ink/50 text-xs mt-0.5">{r.email}</p>
                          <p className="text-ink/30 text-[10px]">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {status === "pending" && (
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => handleApprove(r.id)} className="font-display text-xs uppercase bg-ink text-cream px-3 py-2 border-4 border-ink hover:bg-lime hover:text-ink transition-colors">✓ APPROVE</button>
                            <button onClick={() => handleDecline(r.id)} className="font-display text-xs uppercase bg-cream text-ink px-3 py-2 border-4 border-ink hover:bg-magenta hover:text-cream transition-colors">✗ DECLINE</button>
                          </div>
                        )}
                        {status === "approved" && <span className="text-xs text-ink/40">Payment link sent</span>}
                        {status === "paid" && <span className="text-xs text-lime font-bold">✓ PAID</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CHECK-IN ── */}
        {tab === "checkin" && (
          <div className="space-y-6">
            <div className="bg-ink text-cream border-4 border-ink p-6">
              <p className="font-display text-acid-yellow text-xs uppercase tracking-widest mb-3">/ DOOR SCANNER</p>
              <p className="text-cream/70 text-sm mb-5">Paste or type a QR token to check in a ticket. Works best on mobile — paste directly from a QR scan.</p>
              <div className="flex gap-3">
                <input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="Paste QR token here…"
                  className="flex-1 bg-cream text-ink border-4 border-cream px-4 py-3 font-mono text-sm focus:outline-none focus:bg-acid-yellow" autoFocus />
                <button onClick={handleScan} disabled={scanBusy || !scanInput.trim()}
                  className="bg-acid-yellow text-ink font-display text-sm uppercase px-5 py-3 border-4 border-cream hover:bg-lime transition-colors disabled:opacity-40">
                  {scanBusy ? "…" : "SCAN"}
                </button>
              </div>
            </div>

            {/* Scan result */}
            {scanResult && (() => {
              const r = scanResult.result;
              const styles: Record<string, { bg: string; emoji: string; msg: string }> = {
                ok:                 { bg: "bg-lime border-lime",     emoji: "✓", msg: "CHECKED IN" },
                already_checked_in: { bg: "bg-acid-yellow border-ink", emoji: "⚠", msg: "ALREADY CHECKED IN" },
                invalid:            { bg: "bg-magenta border-ink",    emoji: "✗", msg: "INVALID TICKET" },
                refunded:           { bg: "bg-ink border-ink text-cream", emoji: "✗", msg: "REFUNDED TICKET" },
                transferred:        { bg: "bg-ink/20 border-ink",    emoji: "→", msg: "TICKET TRANSFERRED" },
              };
              const style = styles[r] ?? { bg: "bg-ink/10 border-ink", emoji: "?", msg: r?.toUpperCase() };
              const t = scanResult.ticket;
              return (
                <div className={`border-4 p-6 ${style.bg}`}>
                  <p className="font-display text-5xl mb-2">{style.emoji}</p>
                  <p className="font-display text-2xl uppercase mb-1">{style.msg}</p>
                  {t && <div className="mt-3 space-y-1 text-sm">
                    <p className="font-medium">{t.holder_name}</p>
                    <p className="opacity-70">{t.tier_name}</p>
                    {t.checked_in_at && <p className="opacity-50 text-xs">at {new Date(t.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>}
                  </div>}
                </div>
              );
            })()}

            <div className="border-4 border-ink/20 p-4">
              <p className="font-display text-[10px] uppercase text-ink/40 mb-2">Tip: Use your phone camera to scan the QR code, copy the token, and paste it here. Or use a Bluetooth barcode scanner for hands-free door ops.</p>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
