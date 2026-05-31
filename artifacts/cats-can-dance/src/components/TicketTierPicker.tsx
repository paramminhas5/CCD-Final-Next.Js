/**
 * TicketTierPicker — shown on EventDetail for events with ticketing enabled.
 * Supports both "direct_sale" (buy now) and "rsvp_invite" (RSVP then pay later) modes.
 * Free events just show a reservation button.
 */
import { useState } from "react";

type Tier = {
  id: string;
  name: string;
  description?: string | null;
  price_inr: number;
  is_free: boolean;
  capacity?: number | null;
  available?: number | null;
  on_sale: boolean;
  status: string;
  max_per_order: number;
};

type Config = {
  ticketing_mode: string;
  is_free: boolean;
  show_capacity: boolean;
  max_tickets_per_order: number;
};

type Props = {
  tiers: Tier[];
  config: Config;
  onBuyNow: (selections: Array<{ tier: Tier; quantity: number }>) => void;
  onRsvp: (selections: Array<{ tier: Tier; quantity: number }>) => void;
  busy?: boolean;
};

export default function TicketTierPicker({ tiers, config, onBuyNow, onRsvp, busy }: Props) {
  const [selections, setSelections] = useState<Record<string, number>>({});

  const totalItems = Object.values(selections).reduce((a, b) => a + b, 0);
  const totalPrice = tiers.reduce((sum, t) => sum + (selections[t.id] ?? 0) * t.price_inr, 0);
  const buyerFee = config.is_free ? 0 : Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + buyerFee;

  const activeTiers = tiers.filter(t => t.on_sale && t.status === "active");

  const setQty = (tierId: string, qty: number) =>
    setSelections(s => ({ ...s, [tierId]: Math.max(0, qty) }));

  const getSelectionArray = () =>
    tiers.filter(t => (selections[t.id] ?? 0) > 0)
      .map(t => ({ tier: t, quantity: selections[t.id]! }));

  const canProceed = totalItems > 0 && getSelectionArray().length > 0;
  const isDirect = config.ticketing_mode === "direct_sale";
  const isFreeEvent = config.is_free || tiers.every(t => t.is_free || t.price_inr === 0);

  if (activeTiers.length === 0) {
    return (
      <div className="border-4 border-ink bg-cream p-5">
        <p className="font-display text-lg text-ink uppercase mb-1">Tickets</p>
        <p className="text-ink/50 text-sm">Tickets are not yet on sale for this event.</p>
      </div>
    );
  }

  return (
    <div className="border-4 border-ink bg-cream chunk-shadow">
      <div className="bg-ink px-5 py-3">
        <p className="font-display text-acid-yellow text-xs tracking-widest uppercase">/ TICKETS</p>
      </div>

      <div className="p-5 space-y-3">
        {activeTiers.map(tier => {
          const qty = selections[tier.id] ?? 0;
          const availLabel = tier.capacity != null && config.show_capacity
            ? tier.available != null && tier.available < 20
              ? `Only ${tier.available} left`
              : `${tier.available ?? "∞"} available`
            : null;

          return (
            <div key={tier.id} className={`border-2 border-ink p-4 transition-colors ${qty > 0 ? "bg-acid-yellow/20" : "bg-cream"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base text-ink uppercase leading-tight">{tier.name}</p>
                  {tier.description && <p className="text-ink/60 text-xs mt-0.5">{tier.description}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="font-display text-lg text-ink">
                      {tier.is_free || tier.price_inr === 0
                        ? "FREE"
                        : `₹${tier.price_inr.toLocaleString("en-IN")}`}
                    </p>
                    {!isFreeEvent && tier.price_inr > 0 && (
                      <span className="text-ink/40 text-xs">
                        + ₹{Math.round(tier.price_inr * 0.05)} fee
                      </span>
                    )}
                    {availLabel && (
                      <span className={`font-display text-[10px] uppercase px-2 py-0.5 border border-ink ${
                        tier.available != null && tier.available < 10 ? "bg-magenta text-cream border-magenta" : "bg-ink/10 text-ink"
                      }`}>{availLabel}</span>
                    )}
                  </div>
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(tier.id, qty - 1)}
                    disabled={qty === 0}
                    className="w-9 h-9 border-2 border-ink font-display text-xl flex items-center justify-center hover:bg-ink hover:text-cream transition-colors disabled:opacity-30"
                  >−</button>
                  <span className="font-display text-xl w-6 text-center">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(tier.id, qty + 1)}
                    disabled={qty >= Math.min(tier.max_per_order, tier.available ?? 999, config.max_tickets_per_order)}
                    className="w-9 h-9 border-2 border-ink font-display text-xl flex items-center justify-center hover:bg-ink hover:text-cream transition-colors disabled:opacity-30"
                  >+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      {totalItems > 0 && (
        <div className="border-t-4 border-ink px-5 py-3 space-y-1 bg-ink/5">
          <div className="flex justify-between text-sm">
            <span className="text-ink/70">{totalItems} ticket{totalItems !== 1 ? "s" : ""}</span>
            <span className="font-medium text-ink">
              {isFreeEvent ? "FREE" : `₹${totalPrice.toLocaleString("en-IN")}`}
            </span>
          </div>
          {!isFreeEvent && buyerFee > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-ink/50">Service fee (5%)</span>
              <span className="text-ink/70">₹{buyerFee.toLocaleString("en-IN")}</span>
            </div>
          )}
          {!isFreeEvent && (
            <div className="flex justify-between font-display text-base border-t border-ink/20 pt-2 mt-1">
              <span className="text-ink uppercase">Total</span>
              <span className="text-ink">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="px-5 pb-5 pt-3">
        {isDirect ? (
          <button
            type="button"
            onClick={() => onBuyNow(getSelectionArray())}
            disabled={!canProceed || busy}
            className="w-full bg-magenta text-cream font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-50"
          >
            {busy ? "PROCESSING…" : isFreeEvent ? "RESERVE NOW →" : `BUY TICKETS — ₹${grandTotal.toLocaleString("en-IN")} →`}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRsvp(getSelectionArray())}
            disabled={!canProceed || busy}
            className="w-full bg-acid-yellow text-ink font-display text-xl py-4 border-4 border-ink chunk-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-transform disabled:opacity-50"
          >
            {busy ? "SUBMITTING…" : "RSVP FOR TICKETS →"}
          </button>
        )}
        {!isDirect && !isFreeEvent && (
          <p className="text-ink/40 text-xs text-center mt-2">
            RSVP is free — you'll pay after the promoter approves your request.
          </p>
        )}
        <p className="text-ink/30 text-[10px] text-center mt-1">
          CCD takes 5% from buyer + 5% from promoter on each ticket.
        </p>
      </div>
    </div>
  );
}
