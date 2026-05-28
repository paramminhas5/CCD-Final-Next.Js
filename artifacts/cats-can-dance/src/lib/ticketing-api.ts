/**
 * Ticketing API client — thin fetch wrappers for all /api/ticketing/* routes.
 *
 * Auth (all optional, any one is sufficient):
 *   - Clerk session cookie (credentials: "include") — when Clerk is configured
 *   - x-promoter-token header — token-based promoter login (no Clerk needed)
 *   - x-admin-password header — admin routes
 *   - x-ticket-email header — fan ticket lookup (no account needed)
 */

const BASE = "/api/ticketing";

function promoterHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = sessionStorage.getItem("ccd_promoter_token");
  return token ? { "x-promoter-token": token } : {};
}

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error ?? `HTTP ${res.status}`), { status: res.status, data });
  return data;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const getEventTicketingConfig = (slug: string) =>
  apiFetch(`/events/${slug}/config`);

export const getPaymentLinkDetails = (token: string) =>
  apiFetch(`/payment-link/${token}`);

export const createOrder = (body: {
  event_slug: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  items: Array<{ tier_id: string; quantity: number }>;
  payment_link_token?: string;
  rsvp_id?: string;
}) => apiFetch("/orders", { method: "POST", body: JSON.stringify(body) });

export const verifyOrder = (orderId: string, body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => apiFetch(`/orders/${orderId}/verify`, { method: "POST", body: JSON.stringify(body) });

export const getTicketByToken = (token: string) =>
  apiFetch(`/tickets/${token}`);

/** Get tickets by email — no account needed */
export const getMyTicketsByEmail = (email: string) =>
  apiFetch(`/my-tickets?email=${encodeURIComponent(email)}`, {
    headers: { "x-ticket-email": email.toLowerCase() },
  });

/** Get tickets for signed-in Clerk user */
export const getMyTickets = () => apiFetch("/my-tickets");

export const initiateTransfer = (qrToken: string, body: { to_email: string; to_name?: string }, holderEmail?: string) =>
  apiFetch(`/tickets/${qrToken}/transfer`, {
    method: "POST",
    headers: holderEmail ? { "x-ticket-email": holderEmail } : {},
    body: JSON.stringify(body),
  });

export const claimTransfer = (claimToken: string, body: { recipient_name?: string; recipient_clerk_id?: string }) =>
  apiFetch(`/transfers/${claimToken}/claim`, { method: "POST", body: JSON.stringify(body) });

export const cancelTransfer = (claimToken: string, holderEmail?: string) =>
  apiFetch(`/transfers/${claimToken}/cancel`, {
    method: "POST",
    headers: holderEmail ? { "x-ticket-email": holderEmail } : {},
    body: JSON.stringify({}),
  });

// ─── Promoter (token OR Clerk session) ───────────────────────────────────────

export const applyAsPromoter = (body: {
  name: string; email: string; instagram?: string; website?: string;
  city?: string; genres?: string[]; bio?: string; sample_event?: string;
}) => apiFetch("/promoter/apply", { method: "POST", body: JSON.stringify(body) });

/** Verify a promoter token is valid — returns promoter profile or throws */
export const verifyPromoterToken = (token: string) =>
  apiFetch("/promoter/me", { headers: { "x-promoter-token": token } });

export const getPromoterMe = () =>
  apiFetch("/promoter/me", { headers: promoterHeaders() });

export const getPromoterEvents = () =>
  apiFetch("/promoter/events", { headers: promoterHeaders() });

export const createEventTicketing = (body: Record<string, unknown>) =>
  apiFetch("/promoter/events", { method: "POST", headers: promoterHeaders(), body: JSON.stringify(body) });

export const updateEventTicketing = (slug: string, body: Record<string, unknown>) =>
  apiFetch(`/promoter/events/${slug}`, { method: "PATCH", headers: promoterHeaders(), body: JSON.stringify(body) });

export const createTier = (slug: string, body: Record<string, unknown>) =>
  apiFetch(`/promoter/events/${slug}/tiers`, { method: "POST", headers: promoterHeaders(), body: JSON.stringify(body) });

export const updateTier = (tierId: string, body: Record<string, unknown>) =>
  apiFetch(`/promoter/tiers/${tierId}`, { method: "PATCH", headers: promoterHeaders(), body: JSON.stringify(body) });

export const deleteTier = (tierId: string) =>
  apiFetch(`/promoter/tiers/${tierId}`, { method: "DELETE", headers: promoterHeaders() });

export const getPromoterOrders = (slug: string) =>
  apiFetch(`/promoter/events/${slug}/orders`, { headers: promoterHeaders() });

export const getPromoterRsvps = (slug: string) =>
  apiFetch(`/promoter/events/${slug}/rsvps`, { headers: promoterHeaders() });

export const approveRsvp = (rsvpId: string, body?: { tier_id?: string }) =>
  apiFetch(`/promoter/rsvps/${rsvpId}/approve`, { method: "POST", headers: promoterHeaders(), body: JSON.stringify(body ?? {}) });

export const declineRsvp = (rsvpId: string, body?: { reason?: string }) =>
  apiFetch(`/promoter/rsvps/${rsvpId}/decline`, { method: "POST", headers: promoterHeaders(), body: JSON.stringify(body ?? {}) });

export const doorCheckin = (body: { qr_token: string; gate?: string }) =>
  apiFetch("/promoter/checkin", { method: "POST", headers: promoterHeaders(), body: JSON.stringify(body) });

// ─── Admin ────────────────────────────────────────────────────────────────────

function adminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const pw = sessionStorage.getItem("ccd_admin_pass") ?? (process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "84838281");
  return { "x-admin-password": pw };
}

export const adminGetApplications = (status?: string) =>
  apiFetch(`/admin/applications${status ? `?status=${status}` : ""}`, { headers: adminHeaders() });

export const adminApproveApplication = (id: string, body?: { clerk_user_id?: string; promoter_slug?: string }) =>
  apiFetch(`/admin/applications/${id}/approve`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(body ?? {}) });

export const adminRejectApplication = (id: string, body?: { notes?: string }) =>
  apiFetch(`/admin/applications/${id}/reject`, { method: "POST", headers: adminHeaders(), body: JSON.stringify(body ?? {}) });

export const adminLinkPromoterUser = (body: { promoter_id: string; email: string; clerk_user_id?: string; display_name?: string; role?: string }) =>
  apiFetch("/admin/promoter-users", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });

export const adminRegenerateToken = (body: { promoter_user_id?: string; email?: string }) =>
  apiFetch("/admin/promoter-token/regenerate", { method: "POST", headers: adminHeaders(), body: JSON.stringify(body) });

export const adminGetOrders = (params?: { event_slug?: string; status?: string }) => {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/admin/orders${qs ? `?${qs}` : ""}`, { headers: adminHeaders() });
};

export const adminRefundOrder = (id: string) =>
  apiFetch(`/admin/orders/${id}/refund`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({}) });

export const adminGetRevenue = () =>
  apiFetch("/admin/revenue", { headers: adminHeaders() });

export const adminGetCheckins = (slug: string) =>
  apiFetch(`/admin/checkins/${slug}`, { headers: adminHeaders() });


